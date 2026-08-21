/**
 * Mongoose models — ready for when you switch to real MongoDB.
 *
 * These schemas mirror the file-based collections exactly. To use them,
 * install mongoose (`npm i mongoose`), add MONGO_URI to your .env, and
 * replace the internals of /db/engine.js with mongoose calls (a full swap
 * guide lives in the README). The rest of the backend never changes,
 * because controllers only ever call: find / findOne / findById /
 * insert / insertMany / update / updateWhere / remove / count.
 */
import mongoose from 'mongoose';

const { Schema } = mongoose;

export const User = mongoose.model('User', new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'MEMBER', 'TRAINER'], default: 'MEMBER' },
  phone: String, age: Number, height: Number,
  fitnessLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  goal: { type: String, enum: ['general_fitness', 'strength', 'muscle_development', 'endurance', 'mobility', 'weight_management', 'sports_conditioning'], default: 'general_fitness' },
  activityLevel: String,
  workoutDays: [String],
  workoutDuration: Number,
  equipment: [String],
  preferences: [String],
  avatarColor: String,
  deactivated: { type: Boolean, default: false },
  resetTokenHash: String,
  resetTokenExpiry: Date,
}, { timestamps: true }));

export const Machine = mongoose.model('Machine', new Schema({
  name: { type: String, required: true }, slug: String,
  category: String, muscleGroup: String, targetMuscles: [String],
  equipmentType: String, difficulty: String, popular: Boolean,
  description: String, startingPosition: String, steps: [String], breathing: String,
  levelDetails: Schema.Types.Mixed,
  commonMistakes: [String], safetyTips: [String], whenToStop: [String],
  alternatives: [String], tip: String, image: String, videoUrl: String,
}, { timestamps: true }));

export const Exercise = mongoose.model('Exercise', new Schema({
  name: { type: String, required: true }, machineId: Number, machineSlug: String,
  muscleGroup: String, secondaryMuscles: [String], equipmentType: String,
  difficulty: String, popular: Boolean, instructions: String, safetyTip: String,
  levelInfo: Schema.Types.Mixed, archived: Boolean,
}, { timestamps: true }));

export const WorkoutPlan = mongoose.model('WorkoutPlan', new Schema({
  userId: Number, name: String, templatePlanId: Number,
  goal: String, fitnessLevel: String, durationPerDay: Number,
  days: [{
    day: String, rest: Boolean, focus: String,
    muscles: [String], mode: String, warmup: String,
    exercises: [{
      exerciseId: Number, name: String, machineId: Number, machineSlug: String,
      muscleGroup: String, equipmentType: String, difficulty: String,
      sets: Number, reps: String, restSec: Number, instructions: String, safetyTip: String,
    }],
  }],
}, { timestamps: true }));

export const WorkoutHistory = mongoose.model('WorkoutHistory', new Schema({
  userId: Number, date: String, day: String, focus: String,
  muscleGroups: [String], exercises: [Schema.Types.Mixed],
  setsCompleted: Number, volume: Number, durationMin: Number,
  notes: String, completedAt: Date,
}, { timestamps: true }));

export const Attendance = mongoose.model('Attendance', new Schema({
  userId: Number, date: String, checkInTime: Date, method: { type: String, enum: ['qr', 'admin', 'workout'] },
}, { timestamps: true }));

export const Membership = mongoose.model('Membership', new Schema({
  name: String, price: Number, currency: String, durationMonths: Number,
  description: String, features: [String], popular: Boolean, active: Boolean, order: Number,
}, { timestamps: true }));

export const Subscription = mongoose.model('Subscription', new Schema({
  userId: Number, planId: Number, planName: String, price: Number, currency: String,
  startDate: Date, expiryDate: Date,
  status: { type: String, enum: ['active', 'pending', 'expired', 'cancelled'], default: 'pending' },
  paymentMethod: String, paymentRef: String,
}, { timestamps: true }));

export const NutritionArticle = mongoose.model('NutritionArticle', new Schema({
  title: String, slug: String, category: String, readTime: Number,
  tags: [String], published: Boolean, summary: String, sections: [{ h: String, p: [String] }],
}, { timestamps: true }));

export const Goal = mongoose.model('Goal', new Schema({
  userId: Number, title: String, type: String, target: Number, current: Number, unit: String,
}, { timestamps: true }));

export const Notification = mongoose.model('Notification', new Schema({
  userId: Number, type: String, title: String, message: String, read: Boolean, link: String,
}, { timestamps: true }));

export const ContactMessage = mongoose.model('ContactMessage', new Schema({
  name: String, email: String, phone: String, subject: String, message: String, read: Boolean, kind: String,
}, { timestamps: true }));

export const Testimonial = mongoose.model('Testimonial', new Schema({
  name: String, role: String, rating: Number, text: String, color: String, approved: Boolean,
}, { timestamps: true }));

export const GymSettings = mongoose.model('GymSettings', new Schema({
  gymName: String, tagline: String, heroTitle: String, heroSubtitle: String,
  announcement: String, address: String, phone: String, email: String,
  mapEmbedUrl: String, hours: Schema.Types.Mixed, stats: Schema.Types.Mixed,
  socials: Schema.Types.Mixed, weeklySchedule: Schema.Types.Mixed, safetyNote: String,
}, { timestamps: true }));
