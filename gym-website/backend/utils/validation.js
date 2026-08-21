/**
 * Tiny validation helpers. Each rule returns an error string or null.
 * Controllers call `check(body, rules)` and answer 400 on the first error,
 * so invalid input never reaches the database.
 */
import { isValidEmail, isValidPhone } from './helpers.js';

export const rules = {
  required: (label) => (v) => (v === undefined || v === null || String(v).trim() === '' ? `${label} is required.` : null),
  string: (label, min = 1, max = 300) => (v) => {
    if (typeof v !== 'string') return `${label} must be text.`;
    const t = v.trim();
    if (t.length < min) return `${label} must be at least ${min} character(s).`;
    if (t.length > max) return `${label} must be at most ${max} characters.`;
    return null;
  },
  email: (v) => (isValidEmail(v) ? null : 'Please enter a valid email address.'),
  phone: (v) => (v === '' || v === undefined || v === null || isValidPhone(v) ? null : 'Please enter a valid phone number.'),
  password: (v) => {
    if (typeof v !== 'string' || v.length < 8) return 'Password must be at least 8 characters long.';
    if (v.length > 100) return 'Password must be at most 100 characters.';
    return null;
  },
  oneOf: (label, allowed) => (v) => (allowed.includes(v) ? null : `${label} must be one of: ${allowed.join(', ')}.`),
  number: (label, min = null, max = null) => (v) => {
    if (v === '' || v === undefined || v === null) return null; // optional
    const n = Number(v);
    if (Number.isNaN(n)) return `${label} must be a number.`;
    if (min !== null && n < min) return `${label} must be at least ${min}.`;
    if (max !== null && n > max) return `${label} must be at most ${max}.`;
    return null;
  },
  arrayOf: (label, allowed) => (v) => {
    if (v === undefined || v === null) return null; // optional
    if (!Array.isArray(v)) return `${label} must be a list.`;
    if (v.some((x) => !allowed.includes(x))) return `${label} contains an invalid value.`;
    return null;
  },
};

/** Run all rule functions; returns the first error message or null. */
export function check(body, ruleMap) {
  for (const [field, fns] of Object.entries(ruleMap)) {
    const list = Array.isArray(fns) ? fns : [fns];
    for (const fn of list) {
      const err = fn(body?.[field]);
      if (err) return { field, error: err };
    }
  }
  return null;
}

export const fail = (res, error) => res.status(400).json({ error: error || 'Invalid input. Please check the form and try again.' });
