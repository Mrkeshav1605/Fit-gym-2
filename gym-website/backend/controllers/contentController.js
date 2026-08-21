/** Public content endpoints: machines, exercises, programmes, nutrition,
 *  testimonials, gym settings, contact form, and global search. */
import { db } from '../db/engine.js';
import { asyncHandler, httpError } from '../middleware/error.js';
import { check, rules, fail } from '../utils/validation.js';
import { slugify } from '../utils/helpers.js';

// ── Machines (list + filters + search) ────────────────────────────────
export const listMachines = asyncHandler(async (req, res) => {
  const { q, category, muscle, equipment, difficulty, popular } = req.query;
  let machines = db.machines.all();

  if (q) {
    const needle = String(q).toLowerCase();
    machines = machines.filter((m) =>
      [m.name, m.muscleGroup, m.category, m.description, ...(m.targetMuscles || [])]
        .join(' ').toLowerCase().includes(needle));
  }
  if (category) machines = machines.filter((m) => m.category === category);
  if (muscle) machines = machines.filter((m) => m.muscleGroup === muscle);
  if (equipment) machines = machines.filter((m) => m.equipmentType === equipment);
  if (difficulty) machines = machines.filter((m) => m.difficulty?.toLowerCase() === String(difficulty).toLowerCase());
  if (popular === 'true') machines = machines.filter((m) => m.popular);

  res.json({
    machines,
    filters: {
      categories: [...new Set(db.machines.all().map((m) => m.category))],
      muscles: [...new Set(db.machines.all().map((m) => m.muscleGroup))],
      equipment: [...new Set(db.machines.all().map((m) => m.equipmentType))],
      difficulties: ['Easy', 'Moderate', 'Advanced'],
    },
  });
});

export const getMachine = asyncHandler(async (req, res) => {
  const machine = db.machines.findOne({ slug: req.params.slug })
    || db.machines.findById(req.params.slug);
  if (!machine) throw httpError(404, 'Machine information unavailable.');

  const alternatives = db.machines.all()
    .filter((m) => m.id !== machine.id && (machine.alternatives || []).some((a) => m.name.toLowerCase().includes(a.toLowerCase())));
  const altIds = new Set(alternatives.map((a) => a.id));
  const resolved = (machine.alternatives || [])
    .map((name) => db.machines.all().find((m) => m.name.toLowerCase() === name.toLowerCase()) || db.machines.all().find((m) => m.name.toLowerCase().includes(name.toLowerCase())))
    .filter(Boolean)
    .map((m) => ({ id: m.id, name: m.name, slug: m.slug, muscleGroup: m.muscleGroup, difficulty: m.difficulty }));

  // Machines used on the same muscle group (for "similar machines").
  const similar = db.machines.all()
    .filter((m) => m.id !== machine.id && m.muscleGroup === machine.muscleGroup)
    .slice(0, 3);

  res.json({ machine, alternatives: resolved, similar });
});

// ── Exercises ─────────────────────────────────────────────────────────
export const listExercises = asyncHandler(async (req, res) => {
  const { q, muscle, equipment, difficulty } = req.query;
  let exercises = db.exercises.find({ archived: { $ne: true } });
  if (q) {
    const needle = String(q).toLowerCase();
    exercises = exercises.filter((e) => `${e.name} ${e.muscleGroup} ${e.equipmentType}`.toLowerCase().includes(needle));
  }
  if (muscle) exercises = exercises.filter((e) => e.muscleGroup === muscle);
  if (equipment) exercises = exercises.filter((e) => e.equipmentType === equipment);
  if (difficulty) exercises = exercises.filter((e) => e.difficulty?.toLowerCase() === String(difficulty).toLowerCase());
  res.json({ exercises });
});

// ── Programmes (public) ───────────────────────────────────────────────
export const listPlans = asyncHandler(async (_req, res) => {
  const plans = db.plans.find({ active: true });
  res.json({
    plans: plans.map((p) => ({
      ...p,
      weekDays: Object.entries(p.schedule || {}).map(([day, conf]) => ({ day, ...conf })),
    })),
  });
});

export const getPlan = asyncHandler(async (req, res) => {
  const plan = db.plans.findById(req.params.id);
  if (!plan) throw httpError(404, 'Programme not found.');
  res.json({ plan: { ...plan, weekDays: Object.entries(plan.schedule || {}).map(([day, conf]) => ({ day, ...conf })) } });
});

// ── Membership plans ──────────────────────────────────────────────────
export const listMemberships = asyncHandler(async (_req, res) => {
  res.json({ memberships: db.memberships.find({ active: true }).sort((a, b) => a.order - b.order) });
});

// ── Nutrition ─────────────────────────────────────────────────────────
export const listArticles = asyncHandler(async (req, res) => {
  const { q, category } = req.query;
  let articles = db.nutritionArticles.find({ published: true });
  if (q) {
    const needle = String(q).toLowerCase();
    articles = articles.filter((a) => `${a.title} ${a.summary} ${(a.tags || []).join(' ')}`.toLowerCase().includes(needle));
  }
  if (category) articles = articles.filter((a) => a.category === category);
  res.json({ articles, categories: [...new Set(db.nutritionArticles.all().map((a) => a.category))] });
});

export const getArticle = asyncHandler(async (req, res) => {
  const article = db.nutritionArticles.findOne({ slug: req.params.slug }) || db.nutritionArticles.findById(req.params.slug);
  if (!article || !article.published) throw httpError(404, 'Article not found.');
  const related = db.nutritionArticles.find({ published: true })
    .filter((a) => a.id !== article.id && a.category === article.category).slice(0, 3);
  res.json({ article, related });
});

// ── Testimonials ──────────────────────────────────────────────────────
export const listTestimonials = asyncHandler(async (_req, res) => {
  res.json({ testimonials: db.testimonials.find({ approved: true }) });
});

// ── Gym settings (public view) ────────────────────────────────────────
export const publicSettings = asyncHandler(async (_req, res) => {
  const s = db.gymSettings.findOne({}) || {};
  res.json({
    settings: {
      gymName: s.gymName, tagline: s.tagline, heroTitle: s.heroTitle, heroSubtitle: s.heroSubtitle,
      announcement: s.announcement, address: s.address, phone: s.phone, email: s.email,
      mapEmbedUrl: s.mapEmbedUrl, hours: s.hours, stats: s.stats, socials: s.socials,
      weeklySchedule: s.weeklySchedule, safetyNote: s.safetyNote,
    },
  });
});

// ── Contact form ──────────────────────────────────────────────────────
export const sendContactMessage = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const err = check(b, {
    name: [rules.required('Name'), rules.string('Name', 2, 80)],
    email: [rules.required('Email'), rules.email],
    phone: rules.phone,
    subject: rules.string('Subject', 0, 120),
    message: [rules.required('Message'), rules.string('Message', 10, 2000)],
  });
  if (err) return fail(res, err.error);
  db.contactMessages.insert({ name: b.name.trim(), email: b.email.trim(), phone: b.phone || '', subject: b.subject || 'General enquiry', message: b.message.trim(), read: false, kind: 'contact' });
  res.status(201).json({ message: 'Thank you! Your message has been received. The gym team will get back to you soon.' });
});

// ── Global search ─────────────────────────────────────────────────────
export const search = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (q.length < 2) return res.json({ query: q, results: { machines: [], exercises: [], programmes: [], articles: [] } });

  const match = (...fields) => fields.join(' ').toLowerCase().includes(q);
  res.json({
    query: q,
    results: {
      machines: db.machines.all().filter((m) => match(m.name, m.category, m.muscleGroup, m.description, ...(m.targetMuscles || []))).slice(0, 8),
      exercises: db.exercises.find({ archived: { $ne: true } }).filter((e) => match(e.name, e.muscleGroup, e.equipmentType)).slice(0, 8),
      programmes: db.plans.find({ active: true }).filter((p) => match(p.name, p.goal, p.description)).slice(0, 4),
      articles: db.nutritionArticles.find({ published: true }).filter((a) => match(a.title, a.summary, ...(a.tags || []))).slice(0, 4),
    },
  });
});

// helper
export const slugFor = slugify;
