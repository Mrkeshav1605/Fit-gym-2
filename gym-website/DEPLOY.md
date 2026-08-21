# 🚀 Deployment Guide — Smart Gym Platform

This project is **deployment-ready**: the backend serves the built frontend in
production, so you only need to run **one Node.js process**.

## What's inside this ZIP

```
gym-website/
├── backend/          → Express API + the built frontend server
│   ├── data/         → seeded demo database (works immediately)
│   ├── .env          → configuration (CHANGE THE SECRET before real deployment!)
│   └── node_modules  → NOT included — run `npm install` once
└── frontend/
    ├── dist/         → pre-built production bundle (included, ready to serve)
    └── node_modules  → NOT included
```

---

## Option 1 — Deploy locally (your own computer)

```bash
cd gym-website/backend
npm install            # installs backend dependencies
npm start              # one command runs the WHOLE app
```

Open **http://localhost:5000** — website, API, dashboard, admin panel all live.
Log in with `admin@ironpulse.fit / Admin@123`.

> ⚠️ Change the demo passwords before exposing this to the internet
> (Admin → Members → edit, or edit `backend/db/seed.js` and re-seed).

---

## Option 2 — Deploy to Render (free tier, easiest cloud)

1. Create a **free account** at [render.com](https://render.com).
2. **New → Web Service**, connect your GitHub/GitLab repo with this project
   (or use Render's "Public Git repository" option).
3. Fill in:

| Field | Value |
|---|---|
| Root directory | `gym-website` |
| Runtime | Node |
| Build command | `npm install --prefix backend && npm install --prefix frontend && npm run build --prefix frontend` |
| Start command | `npm start --prefix backend` |

4. Add **Environment Variables**:

```
NODE_ENV=production
JWT_SECRET=type_a_long_random_string_here
SERVE_FRONTEND=true
```

(PORT is set automatically by Render — the backend already respects it.)

5. Click **Deploy**. Your app gets a free `https://your-app.onrender.com` URL.

### ⚠️ Two things to know about the file database on Render

- The demo **file database** (`backend/data/`) works on Render, but Render's
  disk is **ephemeral** — data resets on every redeploy.
- For **permanent data**, switch to MongoDB: create a free cluster at
  [MongoDB Atlas](https://www.mongodb.com/atlas), add
  `MONGO_URI=mongodb+srv://…` to Render's environment variables, and follow
  the "Switching to MongoDB" section in `README.md` (schemas are ready in
  `backend/models/index.js`).

---

## Option 3 — Deploy to Railway (free trial) or any VPS

**Railway:** New Project → Deploy from repo → set the same env vars as above.
Railway auto-detects Node; set the service root to `gym-website` and start
command to `npm start --prefix backend`.

**Any VPS (Ubuntu):**

```bash
# install Node 20+ then:
cd gym-website/backend
npm install
npm run seed          # only if data/ folder was removed
npm start             # or use pm2: pm2 start server.js --name gym
```

Point your domain at the VPS and put Nginx (or Caddy) in front:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔐 Production checklist (do these before going live)

1. **Change `JWT_SECRET`** in the environment (never the dev default).
2. **Change demo passwords** — or delete the demo users.
3. **Restrict CORS** — set `CORS_ORIGIN=https://yourdomain.com`.
4. **Switch to MongoDB** for permanent data storage.
5. **Add HTTPS** — Render/Railway give you HTTPS automatically.
6. Update **gym info** in Admin → Settings (address, phone, hours, stats).
7. Payments: the subscription flow is demo-mode. To go live, integrate
   Razorpay or Stripe in `backend/controllers/memberController.js → subscribe`
   (the backend is structured for it — no card data is ever stored).

## 🧪 Quick smoke test after deploying

```bash
curl https://your-app.onrender.com/api/health
# → {"status":"ok",...}

curl https://your-app.onrender.com/          # → the gym home page
```

Then log in with a demo account and click through Dashboard → My Workout →
Start Workout. If all that works, your deployment is healthy. 💪
