/** Member-facing endpoints: profile, workout, history, stats, goals,
 *  favorites, attendance/QR check-in, subscriptions, notifications. */
import crypto from 'node:crypto';
import { db } from '../db/engine.js';
import { asyncHandler, httpError } from '../middleware/error.js';
import { check, rules, fail } from '../utils/validation.js';
import { generateWeeklyWorkout, estimateDayDuration } from '../services/workoutEngine.js';
import { computeMemberStats } from '../services/progressService.js';
import { getSubscription, effectiveStatus } from '../services/subscriptions.js';
import { notify } from '../services/notify.js';
import { publicUser } from './authController.js';
import { DAYS, DAY_LABELS, dateKey, todayKey, dateKeyFromISO, addDays } from '../utils/helpers.js';

// ── Profile ───────────────────────────────────────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const err = check(b, {
    name: rules.string('Name', 2, 80),
    phone: rules.phone,
    age: rules.number('Age', 10, 100),
    height: rules.number('Height (cm)', 100, 250),
    fitnessLevel: rules.oneOf('Fitness level', ['beginner', 'intermediate', 'advanced']),
    goal: rules.oneOf('Workout goal', ['general_fitness', 'strength', 'muscle_development', 'endurance', 'mobility', 'weight_management', 'sports_conditioning']),
    workoutDuration: rules.oneOf('Workout duration', ['30', '45', '60', '90']),
    workoutDays: rules.arrayOf('Available days', DAYS),
    equipment: rules.arrayOf('Equipment', ['Machine', 'Dumbbell', 'Barbell', 'Cable', 'Bodyweight', 'Cardio']),
  });
  if (err) return fail(res, err.error);

  const allowed = ['name', 'phone', 'age', 'height', 'fitnessLevel', 'goal', 'activityLevel', 'workoutDuration', 'workoutDays', 'equipment', 'preferences', 'avatarColor'];
  const patch = {};
  for (const k of allowed) if (b[k] !== undefined) patch[k] = b[k];
  if (patch.workoutDuration !== undefined) patch.workoutDuration = Number(patch.workoutDuration);

  const updated = db.users.update(req.user.id, patch);
  res.json({ user: publicUser(updated) });
});

// ── My workout (weekly plan) ──────────────────────────────────────────
export const myWorkout = asyncHandler(async (req, res) => {
  const plan = db.workouts.findOne({ userId: req.user.id });
  if (!plan) throw httpError(404, 'No workout plan found. Please regenerate your plan.');
  const today = todayKey();
  const withMeta = plan.days.map((d) => ({
    ...d,
    isToday: d.day === today,
    estDuration: d.rest ? 0 : estimateDayDuration(d),
  }));
  res.json({ workout: { ...plan, days: withMeta }, today: todayKey() });
});

export const regenerateWorkout = asyncHandler(async (req, res) => {
  const user = db.users.findById(req.user.id);
  const template = db.plans.findOne({ goal: user.goal, fitnessLevel: user.fitnessLevel })
    || db.plans.findOne({ goal: user.goal }) || db.plans.findOne({});
  const schedule = (db.gymSettings.findOne({}) || {}).weeklySchedule;
  db.workouts.removeWhere({ userId: user.id });
  const plan = db.workouts.insert(generateWeeklyWorkout(user, template, schedule));
  notify(user.id, 'workout', 'New workout plan generated', `Your ${plan.name} plan is ready. Open "My Workout" to see the week.`, '/dashboard/workout');
  res.json({ workout: plan });
});

// ── Complete a workout ────────────────────────────────────────────────
export const completeWorkout = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const err = check(b, {
    day: rules.oneOf('Day', DAYS),
    durationMin: rules.number('Duration', 1, 600),
    exercises: (v) => {
      if (!Array.isArray(v) || v.length === 0) return 'At least one completed exercise is required.';
      return null;
    },
  });
  if (err) return fail(res, err.error);

  const plan = db.workouts.findOne({ userId: req.user.id });
  const dayPlan = plan?.days.find((d) => d.day === b.day) || { focus: 'Workout', muscles: [] };

  let setsCompleted = 0;
  let volume = 0;
  const exercises = b.exercises.map((x) => {
    const n = Math.max(0, Math.min(Number(x.setsDone) || 0, Number(x.setsTarget) || 99));
    setsCompleted += n;
    volume += n * (Number(x.reps) || 10);
    return { exerciseId: x.exerciseId || null, name: x.name || 'Exercise', setsDone: n, setsTarget: Number(x.setsTarget) || n };
  });

  const history = db.history.insert({
    userId: req.user.id,
    date: dateKey(),
    day: b.day,
    focus: dayPlan.focus || 'Workout',
    muscleGroups: dayPlan.muscles || [],
    exercises,
    setsCompleted,
    volume,
    durationMin: Number(b.durationMin) || 0,
    notes: (b.notes || '').slice(0, 1000),
    completedAt: new Date().toISOString(),
  });

  // Completing a workout also counts as checking in for today.
  if (!db.attendance.findOne({ userId: req.user.id, date: dateKey() })) {
    db.attendance.insert({ userId: req.user.id, date: dateKey(), checkInTime: new Date().toISOString(), method: 'workout' });
  }

  notify(req.user.id, 'workout', 'Workout completed! 🎉', `${history.focus}: ${history.setsCompleted} sets finished. Consistency is compounding — see you at the next session.`, '/dashboard/progress');

  res.status(201).json({ history });
});

// ── History ───────────────────────────────────────────────────────────
export const myHistory = asyncHandler(async (req, res) => {
  const history = db.history.find({ userId: req.user.id })
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  res.json({ history });
});

// ── Progress stats ────────────────────────────────────────────────────
export const myStats = asyncHandler(async (req, res) => {
  const stats = computeMemberStats(req.user.id);
  const goals = db.goals.find({ userId: req.user.id });
  const enrichedGoals = goals.map((g) => {
    let progress = g.current || 0;
    if (g.type === 'workouts_per_week') progress = Math.min(g.target, stats.thisWeek);
    if (g.type === 'streak') progress = Math.min(g.target, stats.streak);
    return { ...g, progress };
  });
  res.json({ stats, goals: enrichedGoals });
});

// ── Goals CRUD ────────────────────────────────────────────────────────
export const createGoal = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const err = check(b, {
    title: [rules.required('Goal title'), rules.string('Goal title', 3, 80)],
    type: rules.oneOf('Goal type', ['workouts_per_week', 'streak', 'custom']),
    target: rules.number('Target', 1, 999),
    unit: rules.string('Unit', 1, 30),
  });
  if (err) return fail(res, err.error);
  const goal = db.goals.insert({ userId: req.user.id, title: b.title.trim(), type: b.type, target: Number(b.target), current: 0, unit: b.unit || 'times', createdAt: new Date().toISOString() });
  res.status(201).json({ goal });
});

export const updateGoal = asyncHandler(async (req, res) => {
  const goal = db.goals.findById(req.params.id);
  if (!goal || String(goal.userId) !== String(req.user.id)) throw httpError(404, 'Goal not found.');
  const b = req.body || {};
  const patch = {};
  if (b.title) patch.title = b.title.trim().slice(0, 80);
  if (b.target !== undefined) patch.target = Math.max(1, Number(b.target) || 1);
  if (b.current !== undefined) patch.current = Math.max(0, Number(b.current) || 0);
  if (b.unit) patch.unit = b.unit.slice(0, 30);
  res.json({ goal: db.goals.update(goal.id, patch) });
});

export const deleteGoal = asyncHandler(async (req, res) => {
  const goal = db.goals.findById(req.params.id);
  if (!goal || String(goal.userId) !== String(req.user.id)) throw httpError(404, 'Goal not found.');
  db.goals.remove(goal.id);
  res.json({ message: 'Goal deleted.' });
});

// ── Favorites ("Add to My Workout") ───────────────────────────────────
export const myFavorites = asyncHandler(async (req, res) => {
  const favorites = db.favorites.find({ userId: req.user.id });
  const machineIds = favorites.map((f) => f.machineId);
  const machines = db.machines.all().filter((m) => machineIds.includes(m.id));
  res.json({ favorites: machines });
});

export const addFavorite = asyncHandler(async (req, res) => {
  const machine = db.machines.findById(req.params.machineId);
  if (!machine) throw httpError(404, 'Machine information unavailable.');
  if (!db.favorites.findOne({ userId: req.user.id, machineId: machine.id })) {
    db.favorites.insert({ userId: req.user.id, machineId: machine.id, createdAt: new Date().toISOString() });
  }
  res.status(201).json({ message: `"${machine.name}" added to My Workout.` });
});

export const removeFavorite = asyncHandler(async (req, res) => {
  db.favorites.removeWhere({ userId: req.user.id, machineId: Number(req.params.machineId) });
  res.json({ message: 'Removed from My Workout.' });
});

// ── Attendance + QR check-in ──────────────────────────────────────────
export const myAttendance = asyncHandler(async (req, res) => {
  const records = db.attendance.find({ userId: req.user.id }).sort((a, b) => b.date.localeCompare(a.date));
  const monthKey = dateKey().slice(0, 7);
  const thisMonth = records.filter((r) => r.date.startsWith(monthKey));
  const stats = computeMemberStats(req.user.id);
  res.json({
    today: records.find((r) => r.date === dateKey()) || null,
    thisMonth: thisMonth.length,
    percentage: stats.attendance.attendancePct,
    history: records,
  });
});

const CODE_TTL_MS = 5 * 60 * 1000; // check-in codes live for 5 minutes

function makeCheckInCode(user) {
  const expiry = Date.now() + CODE_TTL_MS;
  const body = `${user.id}.${expiry}`;
  const sig = crypto.createHmac('sha256', process.env.JWT_SECRET).update(body).digest('base64url');
  return `${Buffer.from(body).toString('base64url')}.${sig}`;
}

function verifyCheckInCode(code) {
  try {
    const [bodyB64, sig] = String(code || '').split('.');
    if (!bodyB64 || !sig) return null;
    const body = Buffer.from(bodyB64, 'base64url').toString();
    const expected = crypto.createHmac('sha256', process.env.JWT_SECRET).update(body).digest('base64url');
    if (sig !== expected) return null;
    const [id, expiry] = body.split('.');
    if (Number(expiry) < Date.now()) return { expired: true };
    const user = db.users.findById(id);
    if (!user) return null;
    return { user };
  } catch {
    return null;
  }
}

export const getCheckInCode = asyncHandler(async (req, res) => {
  const code = makeCheckInCode(req.user);
  res.json({ code, expiresInSec: CODE_TTL_MS / 1000, name: req.user.name });
});

export const checkIn = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const result = verifyCheckInCode(b.code);
  if (!result || result.expired) {
    return res.status(400).json({ error: result?.expired ? 'This check-in code has expired. Please generate a new one.' : 'Invalid check-in code.' });
  }
  const user = result.user;
  const today = dateKey();
  const existing = db.attendance.findOne({ userId: user.id, date: today });
  if (existing) return res.json({ message: `Already checked in today at ${new Date(existing.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.`, attendance: existing });

  const record = db.attendance.insert({ userId: user.id, date: today, checkInTime: new Date().toISOString(), method: 'qr' });
  notify(user.id, 'attendance', 'Checked in! ✅', 'Your attendance for today is recorded. Have a great session!', '/dashboard/attendance');
  res.status(201).json({ message: `Welcome, ${user.name}! Checked in successfully.`, attendance: record });
});

// ── Subscription ──────────────────────────────────────────────────────
export const mySubscription = asyncHandler(async (req, res) => {
  const { latest, history } = getSubscription(req.user.id);
  res.json({ subscription: latest ? { ...latest, status: effectiveStatus(latest) } : null, history });
});

export const subscribe = asyncHandler(async (req, res) => {
  const plan = db.memberships.findById(req.body?.planId);
  if (!plan || !plan.active) throw httpError(404, 'That membership plan is not available.');

  const now = new Date();
  const expiry = addDays(now, 30 * plan.durationMonths);
  const sub = db.subscriptions.insert({
    userId: req.user.id, planId: plan.id, planName: plan.name,
    price: plan.price, currency: plan.currency,
    startDate: now.toISOString(), expiryDate: expiry.toISOString(),
    status: 'active',
    paymentMethod: 'demo',
    // Real payment integration (Razorpay/Stripe) plugs in here later.
    paymentRef: `demo_${Date.now()}`,
    createdAt: new Date().toISOString(),
  });
  notify(req.user.id, 'membership', `Membership activated: ${plan.name}`, `Your ${plan.name} plan is active until ${new Date(expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`, '/dashboard/membership');
  res.status(201).json({ subscription: sub });
});

// ── Notifications ─────────────────────────────────────────────────────
export const myNotifications = asyncHandler(async (req, res) => {
  const list = db.notifications.find({ userId: req.user.id })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 30);
  res.json({ notifications: list, unread: list.filter((n) => !n.read).length });
});

export const markNotificationsRead = asyncHandler(async (req, res) => {
  const b = req.body || {};
  if (b.all) {
    db.notifications.updateWhere({ userId: req.user.id }, { read: true });
  } else if (Array.isArray(b.ids)) {
    b.ids.forEach((id) => {
      const n = db.notifications.findById(id);
      if (n && String(n.userId) === String(req.user.id)) db.notifications.update(id, { read: true });
    });
  }
  res.json({ message: 'Notifications updated.' });
});

// ── Trainer consultation request ──────────────────────────────────────
export const requestTrainer = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const err = check(b, { message: [rules.required('Message'), rules.string('Message', 10, 1000)] });
  if (err) return fail(res, err.error);

  db.contactMessages.insert({
    name: req.user.name, email: req.user.email, phone: req.user.phone || '',
    subject: 'Trainer consultation request', message: b.message, read: false, kind: 'trainer-request',
  });
  notify(req.user.id, 'trainer', 'Trainer request received', 'A trainer will review your request and get back to you. Remember: for technique, beginners, injuries, or medical conditions, professional supervision is the safest choice.', '');
  res.status(201).json({ message: 'Your request has been sent to our training team. They will get back to you soon.' });
});

// ── Smart recommendations ─────────────────────────────────────────────
export const recommendations = asyncHandler(async (req, res) => {
  const user = req.user;
  const history = db.history.find({ userId: user.id });
  const trained = new Set();
  history.forEach((h) => (h.muscleGroups || []).forEach((g) => trained.add(g)));

  const all = db.machines.all().filter((m) => m.category !== 'Free Weights');
  const scored = all.map((m) => {
    let s = m.popular ? 5 : 0;
    if (user.goal === 'strength' && ['Chest', 'Back', 'Legs'].includes(m.muscleGroup)) s += 4;
    if (user.goal === 'endurance' && m.category === 'Cardio') s += 5;
    if (user.goal === 'mobility' && ['Core', 'Full Body'].includes(m.muscleGroup)) s += 3;
    if (!trained.has(m.muscleGroup)) s += 2; // balanced exposure
    s += Math.random() * 2;
    return { m, s };
  }).sort((a, b) => b.s - a.s);

  res.json({ recommendations: scored.slice(0, 6).map((x) => x.m) });
});

// helper exports for other controllers
export const memberHelpers = { DAY_LABELS, dateKeyFromISO };
