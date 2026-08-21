/**
 * Template workout programmes. Members get a personalised weekly plan built
 * from one of these templates (matched to their goal + level), and the gym's
 * weekly schedule (Monday–Saturday, Sunday rest).
 */
export const plans = [
  {
    name: 'Beginner Foundation',
    goal: 'general_fitness', fitnessLevel: 'beginner', active: true, popular: true,
    description: 'A gentle, full-body introduction to strength training. Learn the machines, build the habit, and create a base for everything that comes next.',
    durationPerDay: 45, daysPerWeek: 5,
    schedule: {
      monday: { focus: 'Chest + Triceps', muscles: ['Chest', 'Arms'], mode: 'strength' },
      tuesday: { focus: 'Back + Biceps', muscles: ['Back', 'Arms'], mode: 'strength' },
      wednesday: { focus: 'Legs', muscles: ['Legs'], mode: 'strength' },
      thursday: { focus: 'Shoulders + Core', muscles: ['Shoulders', 'Core'], mode: 'strength' },
      friday: { focus: 'Full Body Light', muscles: ['Full Body'], mode: 'strength' },
      saturday: { focus: 'Cardio + Mobility', muscles: ['Cardio'], mode: 'cardio' },
      sunday: { focus: 'Rest Day / Gym Holiday', muscles: [], mode: 'rest', rest: true },
    },
  },
  {
    name: 'Strength Builder',
    goal: 'strength', fitnessLevel: 'intermediate', active: true, popular: true,
    description: 'Progressive strength training built around the big compound lifts and their machine counterparts. Lift heavier over time — safely.',
    durationPerDay: 60, daysPerWeek: 5,
    schedule: {
      monday: { focus: 'Chest + Triceps', muscles: ['Chest', 'Arms'], mode: 'strength' },
      tuesday: { focus: 'Back + Biceps', muscles: ['Back', 'Arms'], mode: 'strength' },
      wednesday: { focus: 'Legs (Squat Focus)', muscles: ['Legs'], mode: 'strength' },
      thursday: { focus: 'Shoulders + Core', muscles: ['Shoulders', 'Core'], mode: 'strength' },
      friday: { focus: 'Upper Body / Strength', muscles: ['Chest', 'Back', 'Shoulders', 'Arms'], mode: 'strength' },
      saturday: { focus: 'Cardio + Mobility + Full Body', muscles: ['Cardio', 'Full Body'], mode: 'cardio' },
      sunday: { focus: 'Rest Day / Gym Holiday', muscles: [], mode: 'rest', rest: true },
    },
  },
  {
    name: 'Muscle Growth',
    goal: 'muscle_development', fitnessLevel: 'intermediate', active: true, popular: true,
    description: 'Hypertrophy-focused training with moderate weights, higher volume, and controlled tempo — built to add lean muscle.',
    durationPerDay: 60, daysPerWeek: 6,
    schedule: {
      monday: { focus: 'Chest + Triceps', muscles: ['Chest', 'Arms'], mode: 'strength' },
      tuesday: { focus: 'Back + Biceps', muscles: ['Back', 'Arms'], mode: 'strength' },
      wednesday: { focus: 'Legs', muscles: ['Legs'], mode: 'strength' },
      thursday: { focus: 'Shoulders + Core', muscles: ['Shoulders', 'Core'], mode: 'strength' },
      friday: { focus: 'Upper Body / Strength', muscles: ['Chest', 'Back', 'Shoulders', 'Arms'], mode: 'strength' },
      saturday: { focus: 'Cardio + Mobility + Full Body', muscles: ['Cardio', 'Full Body'], mode: 'cardio' },
      sunday: { focus: 'Rest Day / Gym Holiday', muscles: [], mode: 'rest', rest: true },
    },
  },
  {
    name: 'Fat Burn & Conditioning',
    goal: 'weight_management', fitnessLevel: 'beginner', active: true, popular: true,
    description: 'A sustainable combination of strength training and cardio intervals that supports healthy weight management — no crash dieting, no extremes.',
    durationPerDay: 45, daysPerWeek: 6,
    schedule: {
      monday: { focus: 'Full Body Strength', muscles: ['Full Body'], mode: 'strength' },
      tuesday: { focus: 'Cardio Intervals', muscles: ['Cardio'], mode: 'cardio' },
      wednesday: { focus: 'Legs + Core', muscles: ['Legs', 'Core'], mode: 'strength' },
      thursday: { focus: 'Upper Body Circuit', muscles: ['Chest', 'Back', 'Shoulders', 'Arms'], mode: 'strength' },
      friday: { focus: 'Steady Cardio', muscles: ['Cardio'], mode: 'cardio' },
      saturday: { focus: 'Cardio + Mobility + Full Body', muscles: ['Cardio', 'Full Body'], mode: 'cardio' },
      sunday: { focus: 'Rest Day / Gym Holiday', muscles: [], mode: 'rest', rest: true },
    },
  },
  {
    name: 'Endurance Engine',
    goal: 'endurance', fitnessLevel: 'intermediate', active: true, popular: false,
    description: 'Cardio-first programming with supporting strength work to build the engine: stamina, heart health, and work capacity.',
    durationPerDay: 60, daysPerWeek: 5,
    schedule: {
      monday: { focus: 'Steady Cardio', muscles: ['Cardio'], mode: 'cardio' },
      tuesday: { focus: 'Full Body Strength', muscles: ['Full Body'], mode: 'strength' },
      wednesday: { focus: 'Cardio Intervals', muscles: ['Cardio'], mode: 'cardio' },
      thursday: { focus: 'Core + Mobility', muscles: ['Core'], mode: 'strength' },
      friday: { focus: 'Upper Body / Strength', muscles: ['Chest', 'Back', 'Shoulders', 'Arms'], mode: 'strength' },
      saturday: { focus: 'Long Cardio Session', muscles: ['Cardio'], mode: 'cardio' },
      sunday: { focus: 'Rest Day / Gym Holiday', muscles: [], mode: 'rest', rest: true },
    },
  },
  {
    name: 'Mobility & Core',
    goal: 'mobility', fitnessLevel: 'beginner', active: true, popular: false,
    description: 'Move better, feel better. Joint-friendly strength, core stability, and mobility work that supports everything else you do in the gym.',
    durationPerDay: 45, daysPerWeek: 4,
    schedule: {
      monday: { focus: 'Mobility + Core', muscles: ['Core', 'Full Body'], mode: 'strength' },
      tuesday: { focus: 'Rest Day (not selected)', muscles: [], mode: 'rest', rest: true },
      wednesday: { focus: 'Legs + Core', muscles: ['Legs', 'Core'], mode: 'strength' },
      thursday: { focus: 'Shoulders + Mobility', muscles: ['Shoulders'], mode: 'strength' },
      friday: { focus: 'Core + Full Body', muscles: ['Core', 'Full Body'], mode: 'strength' },
      saturday: { focus: 'Light Cardio + Stretch', muscles: ['Cardio'], mode: 'cardio' },
      sunday: { focus: 'Rest Day / Gym Holiday', muscles: [], mode: 'rest', rest: true },
    },
  },
];
