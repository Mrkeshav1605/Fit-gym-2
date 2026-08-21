/**
 * Smart Gym API server.
 * - Express REST API under /api
 * - Optionally serves the built React frontend (production mode)
 * - Security: helmet, CORS, rate limiting, httpOnly JWT cookies
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import routes from './routes/index.js';
import { cookieParser } from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

// ── Security middleware ───────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : true; // reflect origin — restrict this list in production
app.use(cors({ origin: corsOrigin, credentials: true }));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser);

// Rate limiting: tighter on auth, gentle everywhere else.
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false }));

// ── API ───────────────────────────────────────────────────────────────
app.use('/api', routes);
app.use('/api', notFound);

// ── Frontend (production build) ───────────────────────────────────────
if (process.env.SERVE_FRONTEND !== 'false') {
  const dist = path.resolve(__dirname, process.env.FRONTEND_DIST || '../frontend/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist, { maxAge: '1d' }));
    // SPA fallback: any non-API GET returns index.html
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
      res.sendFile(path.join(dist, 'index.html'));
    });
    console.log(`Serving frontend from ${dist}`);
  } else {
    console.log('Frontend build not found — API only. Run `npm run build` in /frontend.');
  }
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Smart Gym API running on http://localhost:${PORT}`);
  console.log(`  Demo logins → admin@ironpulse.fit / Admin@123 · member@ironpulse.fit / Member@123`);
});
