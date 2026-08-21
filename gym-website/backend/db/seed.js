/**
 * Seed script: fills the database with realistic demo data.
 *   npm run seed         → seeds only if the database is empty
 *   npm run seed:force   → wipes and re-seeds everything
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db, DATA_DIR, resetCache } from './engine.js';
import { machines } from './seedData/machines.js';
import { extraExercises } from './seedData/exercises.js';
import { plans } from './seedData/plans.js';
import { articles } from './seedData/articles.js';
import { testimonials } from './seedData/testimonials.js';
import { gymSettings } from './seedData/settings.js';
import { memberships } from './seedData/memberships.js';
import { generateWeeklyWorkout } from '../services/workoutEngine.js';
import { slugify, DAYS, dateKey, addDays, dateKeyFromISO, fmtDate } from '../utils/helpers.js';
import fs from 'node:fs';

const FORCE = process.argv.includes('--force');

function isEmpty() {
  return !fs.existsSync(DATA_DIR) || db.machines.count() === 0;
}

function wipeAll() {
  if (fs.existsSync(DATA_DIR)) fs.rmSync(DATA_DIR, { recursive: true, force: true });
  resetCache(); // drop anything already loaded into memory this process
}

function deriveExercisesFromMachines() {
  const out = [];
  for (const m of machines) {
    if (m.category === 'Free Weights') continue; // covered by extra exercises
    out.push({
      name: m.name,
      machineSlug: slugify(m.name),
      muscleGroup: m.muscleGroup,
      secondaryMuscles: m.targetMuscles.filter((t) => !t.toLowerCase().includes(m.muscleGroup.toLowerCase())).slice(0, 2),
      equipmentType: m.equipmentType,
      difficulty: m.difficulty,
      popular: !!m.popular,
      instructions: `${m.steps.slice(0, 3).join(' ')}`,
      safetyTip: m.safetyTips[0] || '',
      levelInfo: m.levelDetails,
      archived: false,
    });
  }
  return out;
}

async function seed() {
  if (!isEmpty() && !FORCE) {
    console.log('Database already has data — use `npm run seed:force` to re-seed.');
    return;
  }
  if (FORCE) wipeAll();

  console.log('Seeding Smart Gym database…');

  // ── Content ────────────────────────────────────────────────────────
  db.gymSettings.insert(gymSettings);
  const machineDocs = db.machines.insertMany(machines.map((m) => ({ ...m, slug: slugify(m.name) })));
  console.log(`  ✓ ${machineDocs.length} machines`);

  const machineIndex = new Map(machineDocs.map((m) => [m.slug, m.id]));
  const exerciseDocs = db.exercises.insertMany(
    deriveExercisesFromMachines().map((e) => ({ ...e, machineId: machineIndex.get(e.machineSlug) || null }))
  );
  db.exercises.insertMany(extraExercises);
  console.log(`  ✓ ${exerciseDocs.length + extraExercises.length} exercises`);

  db.plans.insertMany(plans);
  db.memberships.insertMany(memberships);
  db.nutritionArticles.insertMany(articles);
  db.testimonials.insertMany(testimonials);
  console.log(`  ✓ ${plans.length} programmes, ${memberships.length} membership plans, ${articles.length} nutrition articles, ${testimonials.length} testimonials`);

  // ── Users ──────────────────────────────────────────────────────────
  const hash = (pw) => bcrypt.hashSync(pw, 10);
  const admin = db.users.insert({
    name: 'Gym Owner', email: 'admin@ironpulse.fit', passwordHash: hash('Admin@123'),
    role: 'ADMIN', phone: '+91 98765 43210', active: true,
  });
  const trainer = db.users.insert({
    name: 'Karan Rathore', email: 'trainer@ironpulse.fit', passwordHash: hash('Trainer@123'),
    role: 'TRAINER', phone: '+91 98765 43211', active: true,
  });
  const member = db.users.insert({
    name: 'Demo Member', email: 'member@ironpulse.fit', passwordHash: hash('Member@123'),
    role: 'MEMBER', phone: '+91 98765 43212', active: true,
    age: 24, height: 172,
    fitnessLevel: 'intermediate', goal: 'muscle_development',
    activityLevel: 'moderate', workoutDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    workoutDuration: 60, equipment: ['Machine', 'Dumbbell', 'Barbell', 'Cable', 'Cardio', 'Bodyweight'],
    preferences: [], avatarColor: '#ff5c1c',
  });
  console.log('  ✓ 3 demo users (admin / trainer / member)');

  // ── Member's personalised weekly workout ───────────────────────────
  const template = db.plans.findOne({ goal: member.goal });
  const workout = db.workouts.insert(
    generateWeeklyWorkout(member, template, gymSettings.weeklySchedule)
  );
  console.log('  ✓ personalised weekly workout generated for demo member');

  // ── Demo history (past 8 weeks) ────────────────────────────────────
  const historySeed = [];
  const attendanceSeed = [];
  const now = new Date();
  for (let week = 7; week >= 0; week -= 1) {
    const daysThisWeek = week === 0 ? Math.max(1, now.getDay()) : 4 + (week % 3); // 4–6 workouts
    const daySet = new Set();
    for (let i = 0; i < daysThisWeek && daySet.size < 6; i += 1) {
      daySet.add(DAYS[(Math.floor(Math.random() * 6))]);
    }
    for (const day of daySet) {
      const d = addDays(new Date(), -week * 7);
      const shift = (DAYS.indexOf(day) - ((d.getDay() + 6) % 7) + 14) % 7; // days until that weekday
      const date = addDays(d, shift - 7 > -14 ? (shift === 0 ? 0 : shift - 7) : shift);
      if (date > now) continue;
      const planDay = workout.days.find((x) => x.day === day) || workout.days[0];
      const exercises = (planDay.exercises || []).slice(0, 5);
      const setsCompleted = exercises.reduce((s, e) => s + e.sets, 0);
      const durationMin = 40 + Math.floor(Math.random() * 25);
      const completedAt = new Date(date); completedAt.setHours(7 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
      historySeed.push({
        userId: member.id, date: dateKey(date), day,
        focus: planDay.focus, muscleGroups: planDay.muscles || [],
        exercises: exercises.map((e) => ({ exerciseId: e.exerciseId, name: e.name, setsDone: e.sets, setsTarget: e.sets })),
        setsCompleted, volume: setsCompleted * 10 + Math.floor(Math.random() * 40),
        durationMin, notes: '', completedAt: completedAt.toISOString(),
      });
      if (Math.random() < 0.85) {
        attendanceSeed.push({ userId: member.id, date: dateKey(date), checkInTime: completedAt.toISOString(), method: 'qr' });
      }
    }
  }
  // Today's attendance (already checked in via QR)
  if (new Date().getDay() !== 0) {
    attendanceSeed.push({ userId: member.id, date: dateKey(now), checkInTime: new Date().toISOString(), method: 'qr' });
  }
  db.history.insertMany(historySeed.sort((a, b) => a.completedAt.localeCompare(b.completedAt)));
  db.attendance.insertMany(attendanceSeed);
  console.log(`  ✓ ${historySeed.length} workout history records + ${attendanceSeed.length} attendance records`);

  // ── Subscription (PRO, active) ─────────────────────────────────────
  const pro = db.memberships.findOne({ name: 'PRO' });
  const start = addDays(now, -14);
  db.subscriptions.insert({
    userId: member.id, planId: pro.id, planName: pro.name,
    price: pro.price, currency: pro.currency,
    startDate: start.toISOString(),
    expiryDate: addDays(start, 30 * pro.durationMonths).toISOString(),
    status: 'active', paymentMethod: 'demo', paymentRef: 'demo_pay_001',
  });

  // ── Goals ──────────────────────────────────────────────────────────
  db.goals.insertMany([
    { userId: member.id, title: 'Complete 4 workouts per week', type: 'workouts_per_week', target: 4, current: 3, unit: 'workouts', createdAt: new Date().toISOString() },
    { userId: member.id, title: 'Improve consistency', type: 'streak', target: 7, current: 2, unit: 'days', createdAt: new Date().toISOString() },
    { userId: member.id, title: 'Mobility minutes this week', type: 'custom', target: 60, current: 40, unit: 'minutes', createdAt: new Date().toISOString() },
  ]);

  // ── Notifications ──────────────────────────────────────────────────
  db.notifications.insertMany([
    { userId: member.id, type: 'welcome', title: 'Welcome to IronPulse!', message: 'Your personalised weekly workout plan is ready. Check Today’s Workout on your dashboard.', read: false, link: '/dashboard/workout', createdAt: new Date().toISOString() },
    { userId: member.id, type: 'announcement', title: 'Sunday is Rest Day', message: 'Reminder: the gym is closed on Sundays. Recovery is part of the plan!', read: false, createdAt: new Date().toISOString() },
    { userId: member.id, type: 'workout', title: 'Great session yesterday!', message: 'You completed a Back + Biceps workout. Consistency is compounding — keep going.', read: true, createdAt: new Date().toISOString() },
  ]);

  // ── Contact messages ───────────────────────────────────────────────
  db.contactMessages.insertMany([
    { name: 'Nisha Patel', email: 'nisha@example.com', phone: '+91 90000 11111', subject: 'Trial session', message: 'Hi, do you offer a free trial day before joining? I would love to visit this Saturday.', read: false },
    { name: 'Amit Jain', email: 'amit@example.com', phone: '', subject: 'Trainer consultation', message: 'I have a mild knee issue and want to check which machines are safe for me. Can a trainer help?', read: false },
  ]);

  console.log('Seed complete!');
  console.log('──────────────────────────────────────────────');
  console.log('  Demo logins:');
  console.log('    Admin   → admin@ironpulse.fit   / Admin@123');
  console.log('    Trainer → trainer@ironpulse.fit / Trainer@123');
  console.log('    Member  → member@ironpulse.fit  / Member@123');
  console.log('──────────────────────────────────────────────');
}

seed().catch((e) => { console.error('Seed failed:', e); process.exit(1); });
