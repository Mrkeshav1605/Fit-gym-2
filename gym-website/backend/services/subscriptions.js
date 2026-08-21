/** Subscription status logic (Active / Pending / Expired / Cancelled). */
import { db } from '../db/engine.js';

export function effectiveStatus(sub) {
  if (!sub) return null;
  if (sub.status === 'cancelled' || sub.status === 'pending') return sub.status;
  if (new Date(sub.expiryDate) < new Date()) return 'expired';
  return 'active';
}

/** Latest subscription record for a member + its effective status. */
export function getSubscription(userId) {
  const all = db.subscriptions.find({ userId }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const latest = all[0] || null;
  if (latest && effectiveStatus(latest) === 'expired' && latest.status !== 'expired') {
    db.subscriptions.update(latest.id, { status: 'expired' });
    latest.status = 'expired';
  }
  return { latest, history: all.map((s) => ({ ...s, status: effectiveStatus(s) })) };
}

/** Does this member have an active membership right now? */
export function hasActiveSubscription(userId) {
  const { latest } = getSubscription(userId);
  return !!latest && effectiveStatus(latest) === 'active';
}
