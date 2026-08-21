/**
 * Tiny file-based database layer.
 *
 * The whole API talks to this module. Each "collection" is a JSON file
 * inside DATA_DIR, so data survives server restarts. The query syntax
 * mirrors a small, useful subset of MongoDB ($in, $ne, $gte, $lte, $regex).
 *
 * When you are ready for real MongoDB, you only need to replace this one
 * file's internals (or use the Mongoose models in /models) — the rest of
 * the backend keeps working because it only calls the functions below.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

const cache = new Map();

const fileFor = (name) => path.join(DATA_DIR, name + '.json');

function load(name) {
  const file = fileFor(name);
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return [];
    }
  }
  return [];
}

function matches(doc, filter) {
  for (const [key, value] of Object.entries(filter || {})) {
    const dv = doc[key];
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      if ('$in' in value) { if (!value.$in.includes(dv)) return false; }
      else if ('$ne' in value) { if (dv === value.$ne) return false; }
      else if ('$gte' in value) { if (!(dv >= value.$gte)) return false; }
      else if ('$lte' in value) { if (!(dv <= value.$lte)) return false; }
      else if ('$regex' in value) { if (dv == null || !new RegExp(value.$regex, 'i').test(String(dv))) return false; }
      else return false;
    } else if (Array.isArray(value)) {
      if (!value.includes(dv)) return false;
    } else if (dv !== value) {
      return false;
    }
  }
  return true;
}

export function collection(name) {
  if (!cache.has(name)) cache.set(name, load(name));
  const docs = () => cache.get(name);

  const save = () => {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(fileFor(name), JSON.stringify(docs(), null, 2));
  };

  const nextId = () => docs().reduce((max, d) => Math.max(max, Number(d.id) || 0), 0) + 1;

  return {
    all: () => docs(),
    find: (filter = {}) => docs().filter((d) => matches(d, filter)),
    findOne: (filter = {}) => docs().find((d) => matches(d, filter)) || null,
    findById: (id) => docs().find((d) => String(d.id) === String(id)) || null,
    insert: (doc) => {
      const d = { id: nextId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...doc };
      docs().push(d);
      save();
      return d;
    },
    insertMany: (arr) => {
      const out = arr.map((doc) => {
        const d = { id: nextId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...doc };
        docs().push(d);
        return d;
      });
      save();
      return out;
    },
    update: (id, patch) => {
      const d = docs().find((x) => String(x.id) === String(id));
      if (!d) return null;
      Object.assign(d, patch, { updatedAt: new Date().toISOString() });
      save();
      return d;
    },
    updateWhere: (filter, patch) => {
      let n = 0;
      for (const d of docs()) {
        if (matches(d, filter)) { Object.assign(d, patch, { updatedAt: new Date().toISOString() }); n += 1; }
      }
      if (n) save();
      return n;
    },
    remove: (id) => {
      const i = docs().findIndex((x) => String(x.id) === String(id));
      if (i < 0) return false;
      docs().splice(i, 1);
      save();
      return true;
    },
    removeWhere: (filter = {}) => {
      const before = docs().length;
      cache.set(name, docs().filter((d) => !matches(d, filter)));
      if (docs().length !== before) save();
      return before - docs().length;
    },
    count: (filter = {}) => docs().filter((d) => matches(d, filter)).length,
    save,
  };
}

// db.users, db.machines, db.attendance ... — any name works on demand.
export const db = new Proxy({}, { get: (_, name) => collection(name) });

export function resetCache() { cache.clear(); }
