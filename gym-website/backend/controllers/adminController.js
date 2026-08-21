/** Admin endpoints: dashboard stats + full management of members,
 *  machines, exercises, plans, schedule, memberships, subscriptions,
 *  attendance, nutrition, testimonials, messages, notifications, settings. */
import bcrypt from 'bcryptjs';
import { db } from '../db/engine.js';
import { asyncHandler, httpError } from '../middleware/error.js';
import { check, rules, fail } from '../utils/validation.js';
import { generateWeeklyWorkout } from '../services/workoutEngine.js';
import { computeMemberStatsLite } from '../services/progressService.js';
import { getSubscription, effectiveStatus } from '../services/subscriptions.js';
import { announceToAllMembers, notify } from '../services/notify.js';
import { publicUser } from './authController.js';
import { slugify, dateKey, dateKeyFromISO, DAYS } from '../utils/helpers.js';
import crypto from 'node:crypto';

const pub = (u) => ({ ...publicUser(u), deactivated: !!u.deactivated, lastLogin: u.lastLogin || null });

// ── Dashboard stats ───────────────────────────────────────────────────
export const stats = asyncHandler(async (_req, res) => {
  const members = db.users.find({ role: 'MEMBER' });
  const activeMembers = members.filter((m) => !m.deactivated);
  const subs = activeMembers.map((m) => getSubscription(m.id).latest).filter(Boolean);

  const today = dateKey();
  const monthKey = today.slice(0, 7);
  const todayAttendance = db.attendance.count({ date: today });
  const monthHistory = db.history.find({}).filter((h) => dateKeyFromISO(h.completedAt).startsWith(monthKey));

  const now = new Date();
  const weekly = [];
  for (let i = 7; i >= 0; i -= 1) {
    const d = new Date(now); d.setDate(d.getDate() - i * 7);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    const end = new Date(start); end.setDate(start.getDate() + 7);
    weekly.push({
      label: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      value: db.history.find({}).filter((h) => { const t = new Date(h.completedAt); return t >= start && t < end; }).length,
    });
  }

  // Popular workouts by focus label.
  const focusCount = {};
  db.history.find({}).forEach((h) => { focusCount[h.focus] = (focusCount[h.focus] || 0) + 1; });
  const popularWorkouts = Object.entries(focusCount).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  // Machine usage by favorites.
  const favCount = {};
  db.favorites.find({}).forEach((f) => { favCount[f.machineId] = (favCount[f.machineId] || 0) + 1; });
  const machineUsage = Object.entries(favCount)
    .map(([id, value]) => { const m = db.machines.findById(id); return m ? { label: m.name, value } : null; })
    .filter(Boolean).sort((a, b) => b.value - a.value).slice(0, 6);

  const expiringSoon = subs.filter((s) => s && effectiveStatus(s) === 'active' && new Date(s.expiryDate) - now < 14 * 86400000);

  res.json({
    totals: {
      members: activeMembers.length,
      activeSubscriptions: subs.filter((s) => s && effectiveStatus(s) === 'active').length,
      expiredSubscriptions: subs.filter((s) => s && effectiveStatus(s) === 'expired').length,
      pendingSubscriptions: subs.filter((s) => s && effectiveStatus(s) === 'pending').length,
      todayAttendance,
      workoutsThisMonth: monthHistory.length,
      revenuePlaceholder: subs.filter((s) => s && effectiveStatus(s) === 'active').reduce((sum, s) => sum + (s.price || 0), 0),
    },
    weekly,
    popularWorkouts,
    machineUsage,
    expiringSoon: expiringSoon.map((s) => ({ ...s, member: db.users.findById(s.userId)?.name || 'Member' })),
    recentRegistrations: db.users.all().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6).map(pub),
  });
});

// ── Members ───────────────────────────────────────────────────────────
export const listMembers = asyncHandler(async (req, res) => {
  const { q, level, goal } = req.query;
  let members = db.users.find({ role: 'MEMBER' });
  if (q) {
    const needle = String(q).toLowerCase();
    members = members.filter((m) => `${m.name} ${m.email} ${m.phone || ''}`.toLowerCase().includes(needle));
  }
  if (level) members = members.filter((m) => m.fitnessLevel === level);
  if (goal) members = members.filter((m) => m.goal === goal);

  const enriched = members.map((m) => {
    const { latest } = getSubscription(m.id);
    return {
      ...pub(m),
      membership: latest ? latest.planName : null,
      membershipStatus: effectiveStatus(latest),
      stats: computeMemberStatsLite(m.id),
    };
  });
  res.json({ members: enriched });
});

export const getMember = asyncHandler(async (req, res) => {
  const member = db.users.findById(req.params.id);
  if (!member) throw httpError(404, 'Member not found.');
  const { latest, history } = getSubscription(member.id);
  res.json({
    member: pub(member),
    membership: latest ? { ...latest, status: effectiveStatus(latest) } : null,
    subscriptionHistory: history,
    stats: computeMemberStatsLite(member.id),
    attendance: db.attendance.find({ userId: member.id }).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30),
    history: db.history.find({ userId: member.id }).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)).slice(0, 10),
    workout: db.workouts.findOne({ userId: member.id }) || null,
    goals: db.goals.find({ userId: member.id }),
  });
});

export const createMember = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const err = check(b, {
    name: [rules.required('Name'), rules.string('Name', 2, 80)],
    email: [rules.required('Email'), rules.email],
    password: [rules.required('Password'), rules.password],
    fitnessLevel: rules.oneOf('Fitness level', ['beginner', 'intermediate', 'advanced']),
    goal: rules.oneOf('Goal', ['general_fitness', 'strength', 'muscle_development', 'endurance', 'mobility', 'weight_management', 'sports_conditioning']),
    phone: rules.phone,
  });
  if (err) return fail(res, err.error);
  const email = b.email.trim().toLowerCase();
  if (db.users.findOne({ email })) return fail(res, 'A user with this email already exists.');

  const user = db.users.insert({
    name: b.name.trim(), email, passwordHash: await bcrypt.hash(b.password, 10),
    role: 'MEMBER', phone: b.phone || '', age: b.age || null, height: b.height || null,
    fitnessLevel: b.fitnessLevel || 'beginner', goal: b.goal || 'general_fitness',
    activityLevel: b.activityLevel || 'moderate',
    workoutDays: b.workoutDays?.length ? b.workoutDays : DAYS.filter((d) => d !== 'sunday'),
    workoutDuration: Number(b.workoutDuration) || 60,
    equipment: b.equipment?.length ? b.equipment : ['Machine', 'Dumbbell', 'Barbell', 'Cable', 'Bodyweight', 'Cardio'],
    preferences: [], avatarColor: '#ff5c1c',
  });
  const template = db.plans.findOne({ goal: user.goal, fitnessLevel: user.fitnessLevel }) || db.plans.findOne({});
  const schedule = (db.gymSettings.findOne({}) || {}).weeklySchedule;
  db.workouts.insert(generateWeeklyWorkout(user, template, schedule));
  notify(user.id, 'welcome', 'Welcome to the gym!', 'Your personalised weekly workout plan is ready.', '/dashboard/workout');
  res.status(201).json({ member: pub(user) });
});

export const updateMember = asyncHandler(async (req, res) => {
  const member = db.users.findById(req.params.id);
  if (!member) throw httpError(404, 'Member not found.');
  const b = req.body || {};
  const patch = {};
  for (const k of ['name', 'phone', 'age', 'height', 'fitnessLevel', 'goal', 'activityLevel', 'workoutDuration', 'workoutDays', 'equipment', 'avatarColor']) {
    if (b[k] !== undefined) patch[k] = b[k];
  }
  if (b.email !== undefined) {
    const err = check({ email: b.email }, { email: [rules.email] });
    if (err) return fail(res, err.error);
    patch.email = b.email.trim().toLowerCase();
  }
  if (b.password) {
    const err = check({ password: b.password }, { password: rules.password });
    if (err) return fail(res, err.error);
    patch.passwordHash = await bcrypt.hash(b.password, 10);
  }
  const updated = db.users.update(member.id, patch);
  res.json({ member: pub(updated) });
});

export const deactivateMember = asyncHandler(async (req, res) => {
  const member = db.users.findById(req.params.id);
  if (!member) throw httpError(404, 'Member not found.');
  db.users.update(member.id, { deactivated: !member.deactivated });
  res.json({ message: member.deactivated ? 'Member reactivated.' : 'Member deactivated. They can no longer log in.' });
});

export const deleteMember = asyncHandler(async (req, res) => {
  const member = db.users.findById(req.params.id);
  if (!member) throw httpError(404, 'Member not found.');
  db.users.remove(member.id);
  db.workouts.removeWhere({ userId: member.id });
  db.history.removeWhere({ userId: member.id });
  db.attendance.removeWhere({ userId: member.id });
  db.subscriptions.removeWhere({ userId: member.id });
  db.goals.removeWhere({ userId: member.id });
  db.notifications.removeWhere({ userId: member.id });
  db.favorites.removeWhere({ userId: member.id });
  res.json({ message: 'Member and all their data deleted.' });
});

export const assignPlan = asyncHandler(async (req, res) => {
  const member = db.users.findById(req.params.id);
  if (!member) throw httpError(404, 'Member not found.');
  const template = db.plans.findById(req.body?.planId) || db.plans.findOne({ goal: member.goal });
  const schedule = (db.gymSettings.findOne({}) || {}).weeklySchedule;
  db.workouts.removeWhere({ userId: member.id });
  const plan = db.workouts.insert(generateWeeklyWorkout(member, template, schedule));
  notify(member.id, 'workout', 'New workout plan assigned', `A trainer assigned you the "${plan.name}" programme. Check your weekly schedule.`, '/dashboard/workout');
  res.json({ message: `Plan "${plan.name}" assigned to ${member.name}.`, workout: plan });
});

// ── Machines CRUD ─────────────────────────────────────────────────────
const machinePatch = (b) => {
  const patch = {};
  for (const k of ['name', 'category', 'muscleGroup', 'targetMuscles', 'equipmentType', 'difficulty', 'popular', 'description', 'startingPosition', 'steps', 'breathing', 'levelDetails', 'commonMistakes', 'safetyTips', 'whenToStop', 'alternatives', 'tip', 'image', 'videoUrl']) {
    if (b[k] !== undefined) patch[k] = b[k];
  }
  if (patch.name) patch.slug = slugify(patch.name);
  return patch;
};

export const createMachine = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const err = check(b, { name: [rules.required('Name'), rules.string('Name', 2, 80)], category: rules.required('Category'), muscleGroup: rules.required('Muscle group') });
  if (err) return fail(res, err.error);
  const machine = db.machines.insert({ ...machinePatch(b), slug: slugify(b.name) });
  res.status(201).json({ machine });
});

export const updateMachine = asyncHandler(async (req, res) => {
  const machine = db.machines.findById(req.params.id);
  if (!machine) throw httpError(404, 'Machine not found.');
  const updated = db.machines.update(machine.id, machinePatch(req.body || {}));
  // Keep the derived exercise in sync when the machine name changes.
  const ex = db.exercises.findOne({ machineId: machine.id });
  if (ex && updated.name !== machine.name) db.exercises.update(ex.id, { name: updated.name, machineSlug: updated.slug });
  res.json({ machine: updated });
});

export const deleteMachine = asyncHandler(async (req, res) => {
  const machine = db.machines.findById(req.params.id);
  if (!machine) throw httpError(404, 'Machine not found.');
  db.machines.remove(machine.id);
  db.favorites.removeWhere({ machineId: machine.id });
  res.json({ message: 'Machine deleted.' });
});

// ── Exercises CRUD ────────────────────────────────────────────────────
export const listExercisesAdmin = asyncHandler(async (req, res) => {
  res.json({ exercises: db.exercises.all().sort((a, b) => a.name.localeCompare(b.name)) });
});

export const createExercise = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const err = check(b, { name: [rules.required('Name'), rules.string('Name', 2, 80)], muscleGroup: rules.required('Muscle group'), equipmentType: rules.required('Equipment type') });
  if (err) return fail(res, err.error);
  const ex = db.exercises.insert({
    name: b.name.trim(), muscleGroup: b.muscleGroup, secondaryMuscles: b.secondaryMuscles || [],
    equipmentType: b.equipmentType, difficulty: b.difficulty || 'Moderate', popular: !!b.popular,
    instructions: b.instructions || '', safetyTip: b.safetyTip || '', levelInfo: b.levelInfo || {}, archived: false,
  });
  res.status(201).json({ exercise: ex });
});

export const updateExercise = asyncHandler(async (req, res) => {
  const ex = db.exercises.findById(req.params.id);
  if (!ex) throw httpError(404, 'Exercise not found.');
  const b = req.body || {};
  const patch = {};
  for (const k of ['name', 'muscleGroup', 'secondaryMuscles', 'equipmentType', 'difficulty', 'popular', 'instructions', 'safetyTip', 'levelInfo', 'archived']) {
    if (b[k] !== undefined) patch[k] = b[k];
  }
  res.json({ exercise: db.exercises.update(ex.id, patch) });
});

export const deleteExercise = asyncHandler(async (req, res) => {
  const ex = db.exercises.findById(req.params.id);
  if (!ex) throw httpError(404, 'Exercise not found.');
  db.exercises.remove(ex.id);
  res.json({ message: 'Exercise deleted.' });
});

// ── Plans (programmes) CRUD ───────────────────────────────────────────
export const listPlansAdmin = asyncHandler(async (_req, res) => {
  res.json({ plans: db.plans.all() });
});

export const createPlan = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const err = check(b, { name: [rules.required('Name'), rules.string('Name', 2, 80)] });
  if (err) return fail(res, err.error);
  const plan = db.plans.insert({
    name: b.name.trim(), goal: b.goal || 'general_fitness', fitnessLevel: b.fitnessLevel || 'beginner',
    active: b.active !== false, popular: !!b.popular,
    description: b.description || '', durationPerDay: Number(b.durationPerDay) || 60,
    daysPerWeek: Number(b.daysPerWeek) || 5, schedule: b.schedule || {},
  });
  res.status(201).json({ plan });
});

export const updatePlan = asyncHandler(async (req, res) => {
  const plan = db.plans.findById(req.params.id);
  if (!plan) throw httpError(404, 'Programme not found.');
  const b = req.body || {};
  const patch = {};
  for (const k of ['name', 'goal', 'fitnessLevel', 'active', 'popular', 'description', 'durationPerDay', 'daysPerWeek', 'schedule']) {
    if (b[k] !== undefined) patch[k] = b[k];
  }
  res.json({ plan: db.plans.update(plan.id, patch) });
});

export const deletePlan = asyncHandler(async (req, res) => {
  const plan = db.plans.findById(req.params.id);
  if (!plan) throw httpError(404, 'Programme not found.');
  db.plans.remove(plan.id);
  res.json({ message: 'Programme deleted.' });
});

// ── Weekly schedule (gym-level default) ───────────────────────────────
export const getSchedule = asyncHandler(async (_req, res) => {
  const s = db.gymSettings.findOne({}) || {};
  res.json({ schedule: s.weeklySchedule || {} });
});

export const updateSchedule = asyncHandler(async (req, res) => {
  const b = req.body || {};
  if (!b.schedule || typeof b.schedule !== 'object') return fail(res, 'A weekly schedule object is required.');
  const s = db.gymSettings.findOne({}) || {};
  db.gymSettings.update(s.id, { weeklySchedule: { ...s.weeklySchedule, ...b.schedule } });
  res.json({ schedule: db.gymSettings.findOne({}).weeklySchedule });
});

// ── Memberships (plans catalogue) CRUD ────────────────────────────────
export const listMembershipsAdmin = asyncHandler(async (_req, res) => {
  res.json({ memberships: db.memberships.all().sort((a, b) => a.order - b.order) });
});

export const createMembership = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const err = check(b, { name: [rules.required('Name'), rules.string('Name', 2, 40)], price: rules.number('Price', 0, 1000000), durationMonths: rules.number('Duration (months)', 1, 60) });
  if (err) return fail(res, err.error);
  const m = db.memberships.insert({
    name: b.name.trim().toUpperCase(), price: Number(b.price), currency: b.currency || '₹',
    durationMonths: Number(b.durationMonths), description: b.description || '',
    features: Array.isArray(b.features) ? b.features.filter((f) => String(f).trim()) : [],
    popular: !!b.popular, active: b.active !== false, order: Number(b.order) || 99,
  });
  res.status(201).json({ membership: m });
});

export const updateMembership = asyncHandler(async (req, res) => {
  const m = db.memberships.findById(req.params.id);
  if (!m) throw httpError(404, 'Membership plan not found.');
  const b = req.body || {};
  const patch = {};
  for (const k of ['name', 'price', 'currency', 'durationMonths', 'description', 'features', 'popular', 'active', 'order']) {
    if (b[k] !== undefined) patch[k] = b[k];
  }
  res.json({ membership: db.memberships.update(m.id, patch) });
});

export const deleteMembership = asyncHandler(async (req, res) => {
  const m = db.memberships.findById(req.params.id);
  if (!m) throw httpError(404, 'Membership plan not found.');
  db.memberships.remove(m.id);
  res.json({ message: 'Membership plan deleted.' });
});

// ── Subscriptions ─────────────────────────────────────────────────────
export const listSubscriptions = asyncHandler(async (req, res) => {
  const { status, q } = req.query;
  let subs = db.subscriptions.all().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (q) {
    const memberIds = new Set(db.users.all().filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(String(q).toLowerCase())).map((u) => u.id));
    subs = subs.filter((s) => memberIds.has(s.userId));
  }
  if (status) subs = subs.filter((s) => effectiveStatus(s) === status);
  res.json({
    subscriptions: subs.map((s) => ({
      ...s, status: effectiveStatus(s),
      member: (() => { const u = db.users.findById(s.userId); return u ? u.name : 'Deleted member'; })(),
      memberEmail: (() => { const u = db.users.findById(s.userId); return u ? u.email : ''; })(),
    })),
  });
});

export const updateSubscription = asyncHandler(async (req, res) => {
  const sub = db.subscriptions.findById(req.params.id);
  if (!sub) throw httpError(404, 'Subscription not found.');
  const b = req.body || {};
  const status = ['active', 'pending', 'expired', 'cancelled'].includes(b.status) ? b.status : null;
  if (!status) return fail(res, 'Valid status required: active, pending, expired or cancelled.');
  db.subscriptions.update(sub.id, { status });
  const member = db.users.findById(sub.userId);
  if (member) notify(member.id, 'membership', 'Membership update', `Your ${sub.planName} subscription status is now: ${status}.`, '/dashboard/membership');
  res.json({ subscription: { ...db.subscriptions.findById(sub.id), status } });
});

// ── Attendance ────────────────────────────────────────────────────────
export const listAttendance = asyncHandler(async (req, res) => {
  const { date, memberId } = req.query;
  let records = db.attendance.all();
  if (date) records = records.filter((r) => r.date === date);
  if (memberId) records = records.filter((r) => String(r.userId) === String(memberId));
  records.sort((a, b) => (b.date + (b.checkInTime || '')).localeCompare(a.date + (a.checkInTime || '')));
  const today = date || dateKey();
  const open = new Date(today + 'T00:00:00').getDay() !== 0;
  res.json({
    attendance: records.slice(0, 500).map((r) => {
      const u = db.users.findById(r.userId);
      return { ...r, member: u ? u.name : 'Deleted member', email: u ? u.email : '' };
    }),
    today, open, total: records.length,
  });
});

export const markAttendance = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const err = check(b, {
    userId: rules.required('Member'),
    date: rules.string('Date', 8, 10),
  });
  if (err) return fail(res, err.error);
  const member = db.users.findById(b.userId);
  if (!member) throw httpError(404, 'Member not found.');
  const date = b.date || dateKey();
  const existing = db.attendance.findOne({ userId: member.id, date });
  if (existing) return res.json({ message: 'Already marked present for this date.', attendance: existing });
  const record = db.attendance.insert({ userId: member.id, date, checkInTime: new Date().toISOString(), method: 'admin' });
  res.status(201).json({ attendance: { ...record, member: member.name } });
});

export const verifyCheckIn = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const code = String(b.code || '');
  try {
    const [bodyB64, sig] = code.split('.');
    const body = Buffer.from(bodyB64, 'base64url').toString();
    const expected = crypto.createHmac('sha256', process.env.JWT_SECRET).update(body).digest('base64url');
    if (sig !== expected) return res.status(400).json({ error: 'Invalid QR code.' });
    const [id, expiry] = body.split('.');
    if (Number(expiry) < Date.now()) return res.status(400).json({ error: 'This QR code has expired. Ask the member to refresh it.' });
    const member = db.users.findById(id);
    if (!member) return res.status(400).json({ error: 'Invalid QR code.' });
    const today = dateKey();
    const existing = db.attendance.findOne({ userId: member.id, date: today });
    if (existing) return res.json({ message: `${member.name} already checked in at ${new Date(existing.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.`, attendance: existing });
    const record = db.attendance.insert({ userId: member.id, date: today, checkInTime: new Date().toISOString(), method: 'qr' });
    res.status(201).json({ message: `✅ ${member.name} checked in successfully!`, attendance: { ...record, member: member.name } });
  } catch {
    return res.status(400).json({ error: 'Invalid QR code.' });
  }
});

// ── Nutrition CRUD ────────────────────────────────────────────────────
export const listArticlesAdmin = asyncHandler(async (_req, res) => {
  res.json({ articles: db.nutritionArticles.all().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

export const createArticle = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const err = check(b, { title: [rules.required('Title'), rules.string('Title', 3, 120)], summary: rules.string('Summary', 0, 500) });
  if (err) return fail(res, err.error);
  const article = db.nutritionArticles.insert({
    title: b.title.trim(), slug: slugify(b.title), category: b.category || 'General',
    readTime: Number(b.readTime) || 4, tags: b.tags || [], published: b.published !== false,
    summary: b.summary || '', sections: Array.isArray(b.sections) ? b.sections : [],
  });
  res.status(201).json({ article });
});

export const updateArticle = asyncHandler(async (req, res) => {
  const article = db.nutritionArticles.findById(req.params.id);
  if (!article) throw httpError(404, 'Article not found.');
  const b = req.body || {};
  const patch = {};
  for (const k of ['title', 'category', 'readTime', 'tags', 'published', 'summary', 'sections']) {
    if (b[k] !== undefined) patch[k] = b[k];
  }
  if (patch.title) patch.slug = slugify(patch.title);
  res.json({ article: db.nutritionArticles.update(article.id, patch) });
});

export const deleteArticle = asyncHandler(async (req, res) => {
  const article = db.nutritionArticles.findById(req.params.id);
  if (!article) throw httpError(404, 'Article not found.');
  db.nutritionArticles.remove(article.id);
  res.json({ message: 'Article deleted.' });
});

// ── Testimonials CRUD ─────────────────────────────────────────────────
export const listTestimonialsAdmin = asyncHandler(async (_req, res) => {
  res.json({ testimonials: db.testimonials.all() });
});

export const createTestimonial = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const err = check(b, {
    name: [rules.required('Name'), rules.string('Name', 2, 80)],
    text: [rules.required('Testimonial text'), rules.string('Testimonial text', 10, 1000)],
    rating: rules.number('Rating', 1, 5),
  });
  if (err) return fail(res, err.error);
  const t = db.testimonials.insert({ name: b.name.trim(), role: b.role || 'Member', rating: Number(b.rating) || 5, text: b.text.trim(), color: b.color || '#ff5c1c', approved: b.approved !== false });
  res.status(201).json({ testimonial: t });
});

export const updateTestimonial = asyncHandler(async (req, res) => {
  const t = db.testimonials.findById(req.params.id);
  if (!t) throw httpError(404, 'Testimonial not found.');
  const b = req.body || {};
  const patch = {};
  for (const k of ['name', 'role', 'rating', 'text', 'color', 'approved']) if (b[k] !== undefined) patch[k] = b[k];
  res.json({ testimonial: db.testimonials.update(t.id, patch) });
});

export const deleteTestimonial = asyncHandler(async (req, res) => {
  const t = db.testimonials.findById(req.params.id);
  if (!t) throw httpError(404, 'Testimonial not found.');
  db.testimonials.remove(t.id);
  res.json({ message: 'Testimonial deleted.' });
});

// ── Contact messages ──────────────────────────────────────────────────
export const listMessages = asyncHandler(async (_req, res) => {
  const messages = db.contactMessages.all().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ messages, unread: messages.filter((m) => !m.read).length });
});

export const markMessageRead = asyncHandler(async (req, res) => {
  const msg = db.contactMessages.findById(req.params.id);
  if (!msg) throw httpError(404, 'Message not found.');
  res.json({ message: db.contactMessages.update(msg.id, { read: true }) });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const msg = db.contactMessages.findById(req.params.id);
  if (!msg) throw httpError(404, 'Message not found.');
  db.contactMessages.remove(msg.id);
  res.json({ message: 'Message deleted.' });
});

// ── Announcements ─────────────────────────────────────────────────────
export const sendAnnouncement = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const err = check(b, {
    title: [rules.required('Title'), rules.string('Title', 2, 100)],
    message: [rules.required('Message'), rules.string('Message', 5, 1000)],
  });
  if (err) return fail(res, err.error);
  const count = announceToAllMembers(b.title.trim(), b.message.trim(), b.link || '');
  res.status(201).json({ message: `Announcement sent to ${count} member(s).` });
});

// ── Gym settings ──────────────────────────────────────────────────────
export const getSettings = asyncHandler(async (_req, res) => {
  res.json({ settings: db.gymSettings.findOne({}) || {} });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const s = db.gymSettings.findOne({}) || db.gymSettings.insert({});
  const patch = {};
  for (const k of ['gymName', 'tagline', 'heroTitle', 'heroSubtitle', 'announcement', 'address', 'phone', 'email', 'mapEmbedUrl', 'hours', 'stats', 'socials', 'safetyNote']) {
    if (b[k] !== undefined) patch[k] = b[k];
  }
  res.json({ settings: db.gymSettings.update(s.id, patch) });
});
