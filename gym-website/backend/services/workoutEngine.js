/**
 * The "smart" part of the platform: turns a member profile into a full
 * weekly workout plan (Monday–Saturday training, Sunday always rest).
 *
 * Inputs:
 *  - user profile (fitness level, goal, available days, duration, equipment)
 *  - the gym's weekly schedule template (admin-configurable, e.g.
 *    Monday = Chest + Triceps)
 *  - the exercise database (seeded machines/exercises)
 *
 * Output: a plan with 7 days, each containing warm-up, focus, and a list of
 * exercises with level-appropriate sets, reps and rest seconds.
 */
import { db } from '../db/engine.js';
import { DAYS } from '../utils/helpers.js';

const LEVEL_RANK = { beginner: 0, intermediate: 1, advanced: 2 };
const DIFF_RANK = { easy: 0, moderate: 1, advanced: 2 };

const DEFAULTS = {
  beginner: { sets: 3, reps: '10–12', restSec: 90 },
  intermediate: { sets: 3, reps: '8–12', restSec: 75 },
  advanced: { sets: 4, reps: '8–10', restSec: 90 },
};

// Rough target for exercises per day based on the member's preferred duration.
const CAP_BY_DURATION = { 30: 4, 45: 5, 60: 6, 90: 7 };

const DEFAULT_WARMUP = '5–10 minutes of light cardio, joint circles and dynamic mobility for the muscles you are about to train.';

export function defaultSchedule() {
  return {
    monday: { focus: 'Chest + Triceps', muscles: ['Chest', 'Arms'], mode: 'strength' },
    tuesday: { focus: 'Back + Biceps', muscles: ['Back', 'Arms'], mode: 'strength' },
    wednesday: { focus: 'Legs', muscles: ['Legs'], mode: 'strength' },
    thursday: { focus: 'Shoulders + Core', muscles: ['Shoulders', 'Core'], mode: 'strength' },
    friday: { focus: 'Upper Body / Strength', muscles: ['Chest', 'Back', 'Shoulders', 'Arms'], mode: 'strength' },
    saturday: { focus: 'Cardio + Mobility + Full Body', muscles: ['Cardio', 'Full Body'], mode: 'cardio' },
    sunday: { focus: 'Rest Day / Gym Holiday', muscles: [], mode: 'rest', rest: true },
  };
}

function scoreExercise(exercise, conf, levelRank, used) {
  if (used.has(exercise.id)) return Number.NEGATIVE_INFINITY;
  let s = 0;

  if (conf.mode === 'cardio') {
    s += exercise.equipmentType === 'Cardio' ? 50 : -60;
    if ((exercise.muscleGroup || '') === 'Cardio') s += 10;
  } else {
    const muscles = conf.muscles || [];
    if (muscles.includes(exercise.muscleGroup)) s += 30;
    else if ((exercise.secondaryMuscles || []).some((m) => muscles.includes(m))) s += 12;
    else s -= 18;
    if (exercise.equipmentType === 'Cardio') s -= 25; // keep cardio on cardio days
  }

  // Difficulty should match the member's level (but never be a hard filter).
  const diffRank = DIFF_RANK[(exercise.difficulty || 'moderate').toLowerCase()] ?? 1;
  s -= Math.min(Math.abs(diffRank - levelRank), 2) * 8;

  if (exercise.popular) s += 4;
  s += Math.random() * 5; // a little variety between regenerations
  return s;
}

function buildDayExercise(exercise, level) {
  const base = DEFAULTS[level] || DEFAULTS.beginner;
  const info = (exercise.levelInfo || {})[level] || {};
  return {
    exerciseId: exercise.id,
    name: exercise.name,
    machineId: exercise.machineId || null,
    machineSlug: exercise.machineSlug || null,
    muscleGroup: exercise.muscleGroup,
    equipmentType: exercise.equipmentType,
    difficulty: exercise.difficulty,
    sets: info.sets || base.sets,
    reps: info.reps || base.reps,
    restSec: info.restSec ?? base.restSec,
    instructions: exercise.instructions || '',
    safetyTip: exercise.safetyTip || '',
  };
}

export function generateWeeklyWorkout(user, templatePlan, schedule, options = {}) {
  const level = (user.fitnessLevel || 'beginner').toLowerCase();
  const levelRank = LEVEL_RANK[level] ?? 0;
  const cap = CAP_BY_DURATION[Number(user.workoutDuration)] || 5;

  // Structure precedence: the assigned programme's own weekly structure wins;
  // otherwise the gym's configurable default schedule is used.
  const structure = (templatePlan?.schedule && Object.keys(templatePlan.schedule).length)
    ? templatePlan.schedule
    : schedule || defaultSchedule();

  // Days the member said they can train (never includes Sunday).
  const chosen = (Array.isArray(user.workoutDays) && user.workoutDays.length)
    ? user.workoutDays.map((d) => d.toLowerCase()).filter((d) => d !== 'sunday')
    : DAYS.filter((d) => d !== 'sunday');

  const used = new Set(options.used || []);
  const days = [];

  for (const day of DAYS) {
    const conf = structure[day] || defaultSchedule()[day];
    if (day === 'sunday' || conf.rest || conf.mode === 'rest') {
      days.push({
        day, rest: true,
        focus: conf.focus || 'Rest Day / Gym Holiday',
        muscles: [], mode: 'rest',
        warmup: '', exercises: [],
      });
      continue;
    }
    if (!chosen.includes(day)) {
      days.push({
        day, rest: true,
        focus: 'Rest day (not selected)',
        muscles: conf.muscles || [], mode: 'rest',
        warmup: '', exercises: [],
      });
      continue;
    }

    const pool = db.exercises.find({ archived: { $ne: true } });
    const ranked = pool
      .map((e) => ({ e, s: scoreExercise(e, conf, levelRank, used) }))
      .filter((x) => Number.isFinite(x.s))
      .sort((a, b) => b.s - a.s);

    const picks = [];
    const seenGroups = new Set();
    for (const { e } of ranked) {
      if (picks.length >= cap) break;
      // On strength days, keep a little variety instead of 5 chest machines.
      if (conf.mode !== 'cardio' && seenGroups.has(e.muscleGroup) && picks.length >= 3) continue;
      picks.push(buildDayExercise(e, level));
      used.add(e.id);
      seenGroups.add(e.muscleGroup);
    }

    days.push({
      day,
      rest: false,
      focus: conf.focus,
      muscles: conf.muscles || [],
      mode: conf.mode || 'strength',
      warmup: conf.warmup || DEFAULT_WARMUP,
      exercises: picks,
    });
  }

  return {
    userId: user.id,
    name: templatePlan?.name || 'Personalized Weekly Plan',
    templatePlanId: templatePlan?.id || null,
    goal: user.goal,
    fitnessLevel: level,
    days,
    durationPerDay: Number(user.workoutDuration) || 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** Rough session duration estimate (minutes) for a day of the plan. */
export function estimateDayDuration(day) {
  const perSetSec = 45; // average time under tension + transition
  let sec = 300; // warm-up
  for (const ex of day.exercises) {
    const sets = Number(ex.sets) || 3;
    const rest = Number(ex.restSec) || 75;
    sec += sets * perSetSec + Math.max(0, sets - 1) * rest;
  }
  return Math.round(sec / 60);
}
