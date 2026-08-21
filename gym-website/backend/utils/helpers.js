/** Small shared helpers used across controllers and services. */

export const slugify = (text = '') =>
  String(text).toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const DAY_LABELS = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

export const todayKey = (d = new Date()) => DAYS[(d.getDay() + 6) % 7]; // Monday-first week

export const dateKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

export const dateKeyFromISO = (iso) => dateKey(new Date(iso));

export const addDays = (d, n) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };

export const startOfWeek = (d = new Date()) => {
  const c = new Date(d);
  const shift = (c.getDay() + 6) % 7; // Monday-first
  c.setDate(c.getDate() - shift);
  c.setHours(0, 0, 0, 0);
  return c;
};

export const daysAgoISO = (n) => addDays(new Date(), -n).toISOString();

export const fmtDate = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  try { return new Date(iso).toLocaleDateString('en-IN', opts); } catch { return iso; }
};

export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || ''));

export const isValidPhone = (v) => /^[+]?[\d\s-]{7,15}$/.test(String(v || ''));

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/** Parse a raw cookie header into an object. */
export function parseCookies(header = '') {
  const out = {};
  for (const part of String(header).split(';')) {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/** Escape user content before it ever reaches the UI layer. */
export function sanitize(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}
