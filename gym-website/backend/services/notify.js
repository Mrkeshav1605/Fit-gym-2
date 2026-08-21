/** Notification helpers — events in the system create member notifications. */
import { db } from '../db/engine.js';

export function notify(userId, type, title, message, link = '') {
  db.notifications.insert({
    userId, type, title, message, link, read: false,
    createdAt: new Date().toISOString(),
  });
}

export function announceToAllMembers(title, message, link = '') {
  const members = db.users.find({ role: 'MEMBER', deactivated: { $ne: true } });
  members.forEach((m) => notify(m.id, 'announcement', title, message, link));
  return members.length;
}
