/** All API routes, mounted under /api. */
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as auth from '../controllers/authController.js';
import * as member from '../controllers/memberController.js';
import * as content from '../controllers/contentController.js';
import * as admin from '../controllers/adminController.js';

const router = Router();
const memberOnly = [requireAuth, requireRole('MEMBER', 'TRAINER')];
const adminOnly = [requireAuth, requireRole('ADMIN')];

// ── Health ────────────────────────────────────────────────────────────
router.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── Auth ──────────────────────────────────────────────────────────────
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.post('/auth/logout', auth.logout);
router.post('/auth/forgot-password', auth.forgotPassword);
router.post('/auth/reset-password', auth.resetPassword);
router.get('/auth/me', requireAuth, auth.me);

// ── Public content ────────────────────────────────────────────────────
router.get('/machines', content.listMachines);
router.get('/machines/:slug', content.getMachine);
router.get('/exercises', content.listExercises);
router.get('/plans', content.listPlans);
router.get('/plans/:id', content.getPlan);
router.get('/memberships', content.listMemberships);
router.get('/nutrition', content.listArticles);
router.get('/nutrition/:slug', content.getArticle);
router.get('/testimonials', content.listTestimonials);
router.get('/settings', content.publicSettings);
router.get('/search', content.search);
router.post('/contact', content.sendContactMessage);

// ── Member dashboard ──────────────────────────────────────────────────
router.get('/member/me', ...memberOnly, auth.me);
router.put('/member/profile', ...memberOnly, member.updateProfile);
router.get('/member/workout', ...memberOnly, member.myWorkout);
router.post('/member/workout/regenerate', ...memberOnly, member.regenerateWorkout);
router.post('/member/workout/complete', ...memberOnly, member.completeWorkout);
router.get('/member/history', ...memberOnly, member.myHistory);
router.get('/member/stats', ...memberOnly, member.myStats);
router.get('/member/goals', ...memberOnly, member.myStats);
router.post('/member/goals', ...memberOnly, member.createGoal);
router.put('/member/goals/:id', ...memberOnly, member.updateGoal);
router.delete('/member/goals/:id', ...memberOnly, member.deleteGoal);
router.get('/member/favorites', ...memberOnly, member.myFavorites);
router.post('/member/favorites/:machineId', ...memberOnly, member.addFavorite);
router.delete('/member/favorites/:machineId', ...memberOnly, member.removeFavorite);
router.get('/member/attendance', ...memberOnly, member.myAttendance);
router.get('/member/checkin-code', ...memberOnly, member.getCheckInCode);
router.post('/member/attendance/checkin', ...memberOnly, member.checkIn);
router.get('/member/subscription', ...memberOnly, member.mySubscription);
router.post('/member/subscribe', ...memberOnly, member.subscribe);
router.get('/member/notifications', ...memberOnly, member.myNotifications);
router.put('/member/notifications/read', ...memberOnly, member.markNotificationsRead);
router.post('/member/trainer-request', ...memberOnly, member.requestTrainer);
router.get('/member/recommendations', ...memberOnly, member.recommendations);

// ── Admin ─────────────────────────────────────────────────────────────
router.get('/admin/stats', ...adminOnly, admin.stats);
router.get('/admin/members', ...adminOnly, admin.listMembers);
router.post('/admin/members', ...adminOnly, admin.createMember);
router.get('/admin/members/:id', ...adminOnly, admin.getMember);
router.put('/admin/members/:id', ...adminOnly, admin.updateMember);
router.delete('/admin/members/:id', ...adminOnly, admin.deleteMember);
router.post('/admin/members/:id/deactivate', ...adminOnly, admin.deactivateMember);
router.post('/admin/members/:id/assign-plan', ...adminOnly, admin.assignPlan);

router.get('/admin/machines', ...adminOnly, content.listMachines);
router.post('/admin/machines', ...adminOnly, admin.createMachine);
router.put('/admin/machines/:id', ...adminOnly, admin.updateMachine);
router.delete('/admin/machines/:id', ...adminOnly, admin.deleteMachine);

router.get('/admin/exercises', ...adminOnly, admin.listExercisesAdmin);
router.post('/admin/exercises', ...adminOnly, admin.createExercise);
router.put('/admin/exercises/:id', ...adminOnly, admin.updateExercise);
router.delete('/admin/exercises/:id', ...adminOnly, admin.deleteExercise);

router.get('/admin/plans', ...adminOnly, admin.listPlansAdmin);
router.post('/admin/plans', ...adminOnly, admin.createPlan);
router.put('/admin/plans/:id', ...adminOnly, admin.updatePlan);
router.delete('/admin/plans/:id', ...adminOnly, admin.deletePlan);

router.get('/admin/schedule', ...adminOnly, admin.getSchedule);
router.put('/admin/schedule', ...adminOnly, admin.updateSchedule);

router.get('/admin/memberships', ...adminOnly, admin.listMembershipsAdmin);
router.post('/admin/memberships', ...adminOnly, admin.createMembership);
router.put('/admin/memberships/:id', ...adminOnly, admin.updateMembership);
router.delete('/admin/memberships/:id', ...adminOnly, admin.deleteMembership);

router.get('/admin/subscriptions', ...adminOnly, admin.listSubscriptions);
router.put('/admin/subscriptions/:id', ...adminOnly, admin.updateSubscription);

router.get('/admin/attendance', ...adminOnly, admin.listAttendance);
router.post('/admin/attendance', ...adminOnly, admin.markAttendance);
router.post('/admin/attendance/verify', ...adminOnly, admin.verifyCheckIn);

router.get('/admin/nutrition', ...adminOnly, admin.listArticlesAdmin);
router.post('/admin/nutrition', ...adminOnly, admin.createArticle);
router.put('/admin/nutrition/:id', ...adminOnly, admin.updateArticle);
router.delete('/admin/nutrition/:id', ...adminOnly, admin.deleteArticle);

router.get('/admin/testimonials', ...adminOnly, admin.listTestimonialsAdmin);
router.post('/admin/testimonials', ...adminOnly, admin.createTestimonial);
router.put('/admin/testimonials/:id', ...adminOnly, admin.updateTestimonial);
router.delete('/admin/testimonials/:id', ...adminOnly, admin.deleteTestimonial);

router.get('/admin/messages', ...adminOnly, admin.listMessages);
router.put('/admin/messages/:id', ...adminOnly, admin.markMessageRead);
router.delete('/admin/messages/:id', ...adminOnly, admin.deleteMessage);

router.post('/admin/notifications', ...adminOnly, admin.sendAnnouncement);

router.get('/admin/settings', ...adminOnly, admin.getSettings);
router.put('/admin/settings', ...adminOnly, admin.updateSettings);

export default router;
