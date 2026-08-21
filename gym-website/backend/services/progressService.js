/**
 * Computes all the numbers behind the Progress dashboard:
 * consistency (streaks, weekly counts), training volume, attendance %,
 * and muscle-group balance. Everything is derived from real workout history
 * and attendance records — nothing is invented.
 */
import { db } from '../db/engine.js';
import { dateKey, dateKeyFromISO, startOfWeek, addDays, fmtDate } from '../utils/helpers.js';

const dayIndex = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

export function computeMemberStats(userId) {
  const history = db.history.find({ userId }).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  const attendance = db.attendance.find({ userId });

  // ── Basic totals ────────────────────────────────────────────────────
  const totalWorkouts = history.length;
  const totalSets = history.reduce((s, h) => s + (h.setsCompleted || 0), 0);
  const totalMinutes = history.reduce((s, h) => s + (h.durationMin || 0), 0);
  const avgDurationMin = totalWorkouts ? Math.round(totalMinutes / totalWorkouts) : 0;

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeekStart = startOfWeek(now);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisWeek = history.filter((h) => new Date(h.completedAt) >= thisWeekStart).length;
  const thisMonth = history.filter((h) => new Date(h.completedAt) >= thisMonthStart).length;

  // ── Streaks (consecutive calendar days with a completed workout) ────
  const workedDays = new Set(history.map((h) => dateKeyFromISO(h.completedAt)));
  let streak = 0;
  let cursor = startToday;
  if (!workedDays.has(dateKey(cursor))) cursor = addDays(cursor, -1); // today may still be in progress
  while (workedDays.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  let bestStreak = 0;
  if (workedDays.size) {
    let run = 0;
    let prev = null;
    const sorted = [...workedDays].sort();
    for (const d of sorted) {
      const cur = new Date(d + 'T00:00:00');
      run = prev && (cur - prev) / 86400000 === 1 ? run + 1 : 1;
      bestStreak = Math.max(bestStreak, run);
      prev = cur;
    }
  }

  // ── Weekly frequency (last 8 weeks) ─────────────────────────────────
  const weekly = [];
  for (let i = 7; i >= 0; i -= 1) {
    const ws = startOfWeek(addDays(now, -i * 7));
    const we = addDays(ws, 6);
    const count = history.filter((h) => {
      const d = new Date(h.completedAt);
      return d >= ws && d <= new Date(we.getFullYear(), we.getMonth(), we.getDate(), 23, 59, 59);
    }).length;
    weekly.push({ label: fmtDate(ws, { day: 'numeric', month: 'short' }), value: count });
  }

  // ── Muscle balance (from the focus label of each completed workout) ─
  const groupCount = {};
  for (const h of history) {
    for (const g of h.muscleGroups || []) groupCount[g] = (groupCount[g] || 0) + 1;
  }
  const muscleSplit = Object.entries(groupCount)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // ── Training volume trend (last 8 sessions, sets × reps as volume) ──
  const volumeTrend = history.slice(0, 8).reverse().map((h) => ({
    label: fmtDate(h.completedAt, { day: 'numeric', month: 'short' }),
    value: h.volume || (h.setsCompleted || 0) * 10,
  }));

  // ── Attendance % for the current month (gym is open Mon–Sat) ────────
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const attendedThisMonth = attendance.filter((a) => a.date.startsWith(monthKey)).length;
  let openDays = 0;
  for (let d = 1; d <= now.getDate(); d += 1) {
    const dow = new Date(now.getFullYear(), now.getMonth(), d).getDay();
    if (dow !== 0) openDays += 1; // Sundays closed
  }
  const attendancePct = openDays ? Math.round((attendedThisMonth / openDays) * 100) : 0;

  // ── Attendance heat map (last 8 weeks) ──────────────────────────────
  const attended = new Set(attendance.map((a) => a.date));
  const heatmap = [];
  for (let i = 7; i >= 0; i -= 1) {
    const ws = startOfWeek(addDays(now, -i * 7));
    const week = { label: fmtDate(ws, { day: 'numeric', month: 'short' }), days: [] };
    for (let d = 0; d < 7; d += 1) {
      const date = addDays(ws, d);
      const key = dateKey(date);
      week.days.push({
        date: key,
        dow: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][d],
        isSunday: d === 6,
        attended: attended.has(key),
        workedOut: workedDays.has(key),
        inFuture: date > now,
      });
    }
    heatmap.push(week);
  }

  return {
    totalWorkouts, thisWeek, thisMonth, totalSets, totalMinutes,
    avgDurationMin, streak, bestStreak, weekly, muscleSplit, volumeTrend,
    attendance: { attendedThisMonth, openDays, attendancePct },
    heatmap,
  };
}

/** Stats for a member viewed from the admin panel. */
export function computeMemberStatsLite(userId) {
  const s = computeMemberStats(userId);
  return {
    totalWorkouts: s.totalWorkouts,
    thisMonth: s.thisMonth,
    streak: s.streak,
    attendancePct: s.attendance.attendancePct,
  };
}
