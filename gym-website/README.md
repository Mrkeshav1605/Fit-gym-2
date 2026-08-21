# 💪 Smart Gym — Full-Stack Fitness Management Platform

A complete, production-quality gym platform with three sides in one app:

| Side | What it does |
|---|---|
| **Public website** | Home, About, Programs, Machines (34 guides), Workouts, Membership, Nutrition, Contact — dark premium fitness UI |
| **Member dashboard** | Personalised Monday–Saturday workout plan (Sunday = rest), workout player with timers, progress charts, goals, QR attendance, subscriptions, notifications, profile |
| **Admin panel** | Members, machines, exercises, workout plans, weekly schedule, membership plans, subscriptions, attendance (incl. QR verification), nutrition content, testimonials, messages, announcements, settings |

**Stack:** React 18 + Vite (frontend) · Node.js + Express (REST API) · JWT auth (httpOnly cookies) · file-based database with ready-made Mongoose models for real MongoDB.

---

## 🚀 Quick start (2 terminals)

```bash
# Terminal 1 — backend (also serves the built frontend in production mode)
cd backend
npm install
npm run seed          # fills the database with demo data (machines, plans, users…)
npm run dev           # API on http://localhost:5000

# Terminal 2 — frontend (development mode with hot reload)
cd frontend
npm install
npm run dev           # website on http://localhost:5173 (proxies /api to 5000)
```

**Demo logins**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@ironpulse.fit` | `Admin@123` |
| Trainer | `trainer@ironpulse.fit` | `Trainer@123` |
| Member | `member@ironpulse.fit` | `Member@123` |

The member account comes pre-loaded with 8 weeks of workout history, attendance, goals and an active PRO subscription — so every chart and dashboard is alive on first login.

---

## 🗺 Project structure

```
gym-website/
├── backend/                    # Node.js + Express REST API
│   ├── server.js               # App entry: security, rate limits, API + static frontend
│   ├── .env / .env.example     # Secrets & configuration (never commit .env)
│   ├── config/                 # (reserved for future config modules)
│   ├── controllers/            # Request handlers (auth, member, admin, content)
│   ├── middleware/             # JWT auth, role guards, error handling
│   ├── models/                 # Mongoose schemas — ready for real MongoDB
│   ├── routes/index.js         # Every API route, grouped by feature
│   ├── services/               # Business logic: workout engine, progress stats,
│   │                           #   subscriptions, notifications
│   ├── utils/                  # Validation, dates, sanitising, helpers
│   └── db/
│       ├── engine.js           # The database layer (JSON-file store, Mongo-like API)
│       ├── seed.js             # Demo data seeder (npm run seed)
│       └── seedData/           # Machines, exercises, plans, articles, settings…
└── frontend/                   # React + Vite SPA
    ├── index.html              # SEO meta, Open Graph, favicon
    ├── vite.config.js          # Dev server + /api proxy
    ├── public/                 # robots.txt, sitemap.xml, images
    └── src/
        ├── App.jsx             # All routes
        ├── components/         # Reusable UI: navbar, footer, cards, modal, toast,
        │   │                   #   charts (pure SVG), workout player, machine art…
        ├── contexts/           # Auth + Toast state
        ├── hooks/              # useApi (fetch + loading + errors), timers, reveal
        ├── pages/              # public/ · member/ · admin/ pages
        ├── services/api.js     # The only place that talks to the backend
        └── styles/global.css   # Design system (dark theme, orange accent)
```

---

## ⚙️ Switching to real MongoDB

The API talks to a small data layer (`backend/db/engine.js`) whose API mirrors
Mongoose (`find`, `findOne`, `insert`, `update`, `remove`, …). The ready-made
schemas live in `backend/models/index.js`. To switch:

1. `cd backend && npm i mongoose`
2. Add `MONGO_URI=mongodb://localhost:27017/smart_gym` to `.env`
3. Replace the internals of `db/engine.js` with Mongoose calls (import the
   models from `../models/index.js`). Controllers, routes and services **do not change**.

> Why not Mongo by default? So the project runs anywhere with zero setup — the
> JSON-file store persists data across restarts and is perfect for development.

---

## 🔐 Security features

- Passwords hashed with **bcrypt** (never stored in plain text)
- **JWT** sessions in **httpOnly, sameSite cookies** + expiry handling
- **Role-based authorization** (`ADMIN`, `MEMBER`, `TRAINER`) on every protected route
- **Rate limiting** (strict on auth endpoints), **helmet** security headers, CORS config
- **Input validation** on every write endpoint; **Mongo-style injection-safe** queries
- User-generated content escaped before rendering
- Never stores card details — subscription flow is built ready for Razorpay/Stripe
- `.env` keeps `JWT_SECRET` and credentials out of the code (see `.env.example`)

## 🧠 How the "smart" workout engine works

1. At registration you pick **level** (beginner/intermediate/advanced), **goal**,
   **available days**, **preferred duration** and **equipment**.
2. The engine (`backend/services/workoutEngine.js`) combines that profile with the
   gym's **weekly schedule** (admin-editable, e.g. Monday = Chest + Triceps) and the
   **exercise database**.
3. It scores every exercise for the day's muscle groups, your level and variety, then
   builds each day with sets / reps / rest per level. **Sunday is always Rest Day /
   Gym Holiday** — the system enforces it.
4. Completing a workout creates history, updates streaks & goals, and auto-checks
   attendance. Admin can assign a different programme anytime (`Admin → Members → assign`).

## ⚕️ Safety-first fitness content

Every machine guide includes **starting position, step-by-step movement, breathing,
sets/reps by level, rest guidance, common mistakes, safety precautions, when to stop
and alternative exercises**. Technique-heavy lifts (squat, barbell work…) explicitly
recommend learning from a qualified trainer. Nutrition content carries a professional
disclaimer — the platform is education, not medical advice, and never promotes crash
diets, starvation or unsafe lifting.

## 🧪 What's tested

- Registration → auto plan generation → login → workout completion → history/stats
- Admin CRUD for machines/exercises/plans/memberships, plan assignment
- Attendance marking + QR check-in verification (HMAC-signed, 5-minute expiry)
- Subscriptions (active/pending/expired/cancelled) and status transitions
- Password reset flow, role guards, invalid-input rejection, expired sessions

## 📦 Useful commands

| Command | Where | What it does |
|---|---|---|
| `npm run dev` | backend | API with auto-restart on file changes |
| `npm run seed` | backend | Seed demo data (skips if data exists) |
| `npm run seed:force` | backend | Wipe & re-seed demo data |
| `npm start` | backend | Production server (serves built frontend too) |
| `npm run dev` | frontend | Vite dev server on :5173 |
| `npm run build` | frontend | Production build into `dist/` |

---

*General fitness education only. This platform does not replace a qualified personal
trainer, doctor, physiotherapist, or registered dietitian.*
