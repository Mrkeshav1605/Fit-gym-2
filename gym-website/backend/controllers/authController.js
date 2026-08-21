/** Authentication: register, login, logout, forgot/reset password, me. */
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db } from '../db/engine.js';
import { signToken } from '../middleware/auth.js';
import { asyncHandler, httpError } from '../middleware/error.js';
import { check, rules, fail } from '../utils/validation.js';
import { generateWeeklyWorkout } from '../services/workoutEngine.js';
import { notify } from '../services/notify.js';
import { DAYS } from '../utils/helpers.js';

export const publicUser = (u) => ({
  id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone || '',
  age: u.age || null, height: u.height || null,
  fitnessLevel: u.fitnessLevel || 'beginner', goal: u.goal || 'general_fitness',
  activityLevel: u.activityLevel || '', workoutDays: u.workoutDays || [],
  workoutDuration: u.workoutDuration || 60, equipment: u.equipment || [],
  preferences: u.preferences || [], avatarColor: u.avatarColor || '#ff5c1c',
  createdAt: u.createdAt,
});

const COOKIE_OPTS = {
  httpOnly: true, sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production' && !process.env.ALLOW_INSECURE_COOKIES,
  maxAge: 7 * 24 * 60 * 60 * 1000, path: '/',
};

const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced'];
const GOALS = ['general_fitness', 'strength', 'muscle_development', 'endurance', 'mobility', 'weight_management', 'sports_conditioning'];

// ── Register ──────────────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const err = check(b, {
    name: [rules.required('Name'), rules.string('Name', 2, 80)],
    email: [rules.required('Email'), rules.email],
    password: [rules.required('Password'), rules.password],
    fitnessLevel: rules.oneOf('Fitness level', FITNESS_LEVELS),
    goal: rules.oneOf('Workout goal', GOALS),
    phone: rules.phone,
    age: rules.number('Age', 10, 100),
    height: rules.number('Height (cm)', 100, 250),
    workoutDuration: rules.oneOf('Workout duration', ['30', '45', '60', '90']),
    workoutDays: rules.arrayOf('Available days', DAYS),
    equipment: rules.arrayOf('Equipment', ['Machine', 'Dumbbell', 'Barbell', 'Cable', 'Bodyweight', 'Cardio']),
  });
  if (err) return fail(res, err.error);

  const email = b.email.trim().toLowerCase();
  if (db.users.findOne({ email })) return fail(res, 'An account with this email already exists. Please log in instead.');

  const passwordHash = await bcrypt.hash(b.password, 10);
  const user = db.users.insert({
    name: b.name.trim(), email, passwordHash, role: 'MEMBER', phone: b.phone || '',
    age: b.age || null, height: b.height || null,
    fitnessLevel: b.fitnessLevel, goal: b.goal,
    activityLevel: b.activityLevel || 'moderate',
    workoutDays: b.workoutDays?.length ? b.workoutDays : DAYS.filter((d) => d !== 'sunday'),
    workoutDuration: Number(b.workoutDuration) || 60,
    equipment: b.equipment?.length ? b.equipment : ['Machine', 'Dumbbell', 'Barbell', 'Cable', 'Bodyweight', 'Cardio'],
    preferences: b.preferences || [], avatarColor: '#ff5c1c',
  });

  // Generate the personalised weekly plan (Monday–Saturday, Sunday rest).
  const template = db.plans.findOne({ goal: b.goal, fitnessLevel: b.fitnessLevel })
    || db.plans.findOne({ goal: b.goal })
    || db.plans.findOne({});
  const schedule = (db.gymSettings.findOne({}) || {}).weeklySchedule;
  db.workouts.insert(generateWeeklyWorkout(user, template, schedule));

  notify(user.id, 'welcome', 'Welcome to the gym!', 'Your personalised weekly workout plan is ready. Open your dashboard to see today\u2019s workout.', '/dashboard/workout');

  const token = signToken(user);
  res.cookie('token', token, COOKIE_OPTS);
  res.status(201).json({ user: publicUser(user), message: 'Account created. Your personalised workout plan is ready!' });
});

// ── Login ─────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const err = check(b, {
    email: [rules.required('Email'), rules.email],
    password: rules.required('Password'),
  });
  if (err) return fail(res, err.error);

  const user = db.users.findOne({ email: b.email.trim().toLowerCase() });
  if (!user) return fail(res, 'Invalid email or password.');
  if (user.deactivated) return res.status(403).json({ error: 'This account has been deactivated. Please contact the gym.' });

  const ok = await bcrypt.compare(b.password, user.passwordHash);
  if (!ok) return fail(res, 'Invalid email or password.');

  const token = signToken(user);
  res.cookie('token', token, COOKIE_OPTS);
  res.json({ user: publicUser(user) });
});

// ── Logout ────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out.' });
});

// ── Forgot / reset password ───────────────────────────────────────────
export const forgotPassword = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const err = check(b, { email: [rules.required('Email'), rules.email] });
  if (err) return fail(res, err.error);

  const user = db.users.findOne({ email: b.email.trim().toLowerCase() });
  // Always return the same message so we don't reveal which emails exist.
  if (!user) return res.json({ message: 'If that email is registered, a reset link has been sent.' });

  const token = crypto.randomBytes(24).toString('hex');
  db.users.update(user.id, {
    resetTokenHash: await bcrypt.hash(token, 10),
    resetTokenExpiry: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  });

  // NOTE: a real deployment emails this link. In this demo we return it so
  // you can complete the flow. Never return reset tokens in production.
  res.json({
    message: 'Reset token generated. In production this is emailed to the member.',
    demoResetToken: token,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const err = check(b, {
    token: rules.required('Reset token'),
    password: [rules.required('New password'), rules.password],
  });
  if (err) return fail(res, err.error);

  const candidates = db.users.all().filter((u) =>
    u.resetTokenHash && u.resetTokenExpiry && new Date(u.resetTokenExpiry) > new Date());
  if (!candidates.length) return fail(res, 'This reset link is invalid or has expired. Please request a new one.');

  let user = null;
  for (const c of candidates) {
    if (await bcrypt.compare(b.token, c.resetTokenHash)) { user = c; break; }
  }
  if (!user) return fail(res, 'This reset link is invalid or has expired. Please request a new one.');

  db.users.update(user.id, {
    passwordHash: await bcrypt.hash(b.password, 10),
    resetTokenHash: null, resetTokenExpiry: null,
  });
  res.json({ message: 'Password updated. You can now log in with your new password.' });
});

// ── Current user ──────────────────────────────────────────────────────
export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
