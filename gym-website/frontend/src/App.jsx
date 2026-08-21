/** Application root — routes, public layout, auth-protected shells. */
import { Routes, Route, useLocation } from 'react-router-dom';
import { useApi } from './hooks/useApi.js';
import { publicApi } from './services/api.js';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import { DashboardLayout } from './components/layout/DashboardLayout.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

// Public pages
import HomePage from './pages/public/HomePage.jsx';
import AboutPage from './pages/public/AboutPage.jsx';
import ProgramsPage from './pages/public/ProgramsPage.jsx';
import MachinesPage from './pages/public/MachinesPage.jsx';
import MachineDetailPage from './pages/public/MachineDetailPage.jsx';
import WorkoutsPage from './pages/public/WorkoutsPage.jsx';
import MembershipPage from './pages/public/MembershipPage.jsx';
import NutritionPage from './pages/public/NutritionPage.jsx';
import NutritionArticlePage from './pages/public/NutritionArticlePage.jsx';
import ContactPage from './pages/public/ContactPage.jsx';
import LoginPage from './pages/public/LoginPage.jsx';
import RegisterPage from './pages/public/RegisterPage.jsx';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage.jsx';
import NotFoundPage from './pages/public/NotFoundPage.jsx';

// Member pages
import DashboardHome from './pages/member/DashboardHome.jsx';
import MyWorkoutPage from './pages/member/MyWorkoutPage.jsx';
import MyMachinesPage from './pages/member/MyMachinesPage.jsx';
import ProgressPage from './pages/member/ProgressPage.jsx';
import AttendancePage from './pages/member/AttendancePage.jsx';
import SubscriptionPage from './pages/member/SubscriptionPage.jsx';
import HistoryPage from './pages/member/HistoryPage.jsx';
import ProfilePage from './pages/member/ProfilePage.jsx';
import NotificationsPage from './pages/member/NotificationsPage.jsx';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminMembers from './pages/admin/AdminMembers.jsx';
import AdminMachines from './pages/admin/AdminMachines.jsx';
import AdminExercises from './pages/admin/AdminExercises.jsx';
import AdminWorkouts from './pages/admin/AdminWorkouts.jsx';
import AdminSchedule from './pages/admin/AdminSchedule.jsx';
import AdminMemberships from './pages/admin/AdminMemberships.jsx';
import AdminSubscriptions from './pages/admin/AdminSubscriptions.jsx';
import AdminAttendance from './pages/admin/AdminAttendance.jsx';
import AdminNutrition from './pages/admin/AdminNutrition.jsx';
import AdminTestimonials from './pages/admin/AdminTestimonials.jsx';
import AdminMessages from './pages/admin/AdminMessages.jsx';
import AdminNotifications from './pages/admin/AdminNotifications.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';

function PublicShell({ children }) {
  const { data } = useApi(publicApi.settings, []);
  const s = data?.settings || {};
  return (
    <>
      <Navbar gymName={s.gymName || 'IronPulse'} />
      {s.announcement && <div className="announce">{s.announcement}</div>}
      {children}
      <Footer settings={s} />
    </>
  );
}

function DashShell({ children, title, sub, admin = false }) {
  return <DashboardLayout title={title} sub={sub} admin={admin}>{children}</DashboardLayout>;
}

export default function App() {
  const location = useLocation();
  const isDash = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');

  const memberDash = (el, title, sub, admin = false) => (
    <ProtectedRoute admin={admin}>
      {isDash ? (
        <PublicShell>
          <DashShell title={title} sub={sub} admin={admin}>{el}</DashShell>
        </PublicShell>
      ) : el}
    </ProtectedRoute>
  );

  return (
    <Routes>
      {/* ── Public ────────────────────────────────────────────────── */}
      <Route path="/" element={<PublicShell><HomePage /></PublicShell>} />
      <Route path="/about" element={<PublicShell><AboutPage /></PublicShell>} />
      <Route path="/programs" element={<PublicShell><ProgramsPage /></PublicShell>} />
      <Route path="/machines" element={<PublicShell><MachinesPage /></PublicShell>} />
      <Route path="/machines/:slug" element={<PublicShell><MachineDetailPage /></PublicShell>} />
      <Route path="/workouts" element={<PublicShell><WorkoutsPage /></PublicShell>} />
      <Route path="/membership" element={<PublicShell><MembershipPage /></PublicShell>} />
      <Route path="/nutrition" element={<PublicShell><NutritionPage /></PublicShell>} />
      <Route path="/nutrition/:slug" element={<PublicShell><NutritionArticlePage /></PublicShell>} />
      <Route path="/progress" element={<PublicShell><WorkoutsPage /></PublicShell>} />
      <Route path="/contact" element={<PublicShell><ContactPage /></PublicShell>} />
      <Route path="/login" element={<PublicShell><LoginPage /></PublicShell>} />
      <Route path="/register" element={<PublicShell><RegisterPage /></PublicShell>} />
      <Route path="/forgot-password" element={<PublicShell><ForgotPasswordPage /></PublicShell>} />

      {/* ── Member dashboard ──────────────────────────────────────── */}
      <Route path="/dashboard" element={memberDash(<DashboardHome />, 'Dashboard', 'Your gym, at a glance.')} />
      <Route path="/dashboard/workout" element={memberDash(<MyWorkoutPage />, 'My Workout', 'Your personalised Monday–Saturday plan. Sunday is rest.')} />
      <Route path="/dashboard/machines" element={memberDash(<MyMachinesPage />, 'My Machines', 'Machines you saved for quick access.')} />
      <Route path="/dashboard/progress" element={memberDash(<ProgressPage />, 'Progress', 'Consistency, strength and performance — your real numbers.')} />
      <Route path="/dashboard/attendance" element={memberDash(<AttendancePage />, 'Attendance', 'QR check-in and your monthly attendance.')} />
      <Route path="/dashboard/membership" element={memberDash(<SubscriptionPage />, 'Subscription', 'Your plan, dates and history.')} />
      <Route path="/dashboard/history" element={memberDash(<HistoryPage />, 'Workout History', 'Every completed session, saved automatically.')} />
      <Route path="/dashboard/profile" element={memberDash(<ProfilePage />, 'Profile', 'Your details and fitness preferences.')} />
      <Route path="/dashboard/notifications" element={memberDash(<NotificationsPage />, 'Notifications', 'Updates from your gym.')} />

      {/* ── Admin panel ───────────────────────────────────────────── */}
      <Route path="/admin" element={memberDash(<AdminDashboard />, 'Admin Dashboard', 'The whole gym, in numbers.', true)} />
      <Route path="/admin/members" element={memberDash(<AdminMembers />, 'Members', 'Add, edit, assign plans and manage every member.', true)} />
      <Route path="/admin/machines" element={memberDash(<AdminMachines />, 'Machines', 'The machine guide database.', true)} />
      <Route path="/admin/exercises" element={memberDash(<AdminExercises />, 'Exercises', 'The exercise pool behind plan generation.', true)} />
      <Route path="/admin/workouts" element={memberDash(<AdminWorkouts />, 'Workout Plans', 'Template programmes members can be assigned.', true)} />
      <Route path="/admin/schedule" element={memberDash(<AdminSchedule />, 'Weekly Schedule', "The gym's default split (Sunday is always rest).", true)} />
      <Route path="/admin/memberships" element={memberDash(<AdminMemberships />, 'Membership Plans', 'Plans and prices — fully configurable.', true)} />
      <Route path="/admin/subscriptions" element={memberDash(<AdminSubscriptions />, 'Subscriptions', 'Every membership, every status.', true)} />
      <Route path="/admin/attendance" element={memberDash(<AdminAttendance />, 'Attendance', 'Mark, filter and verify QR check-ins.', true)} />
      <Route path="/admin/nutrition" element={memberDash(<AdminNutrition />, 'Nutrition Content', 'The education library.', true)} />
      <Route path="/admin/testimonials" element={memberDash(<AdminTestimonials />, 'Testimonials', 'Review and publish member feedback.', true)} />
      <Route path="/admin/messages" element={memberDash(<AdminMessages />, 'Contact Messages', 'Inbox and trainer requests.', true)} />
      <Route path="/admin/notifications" element={memberDash(<AdminNotifications />, 'Announcements', 'Send updates to all members.', true)} />
      <Route path="/admin/settings" element={memberDash(<AdminSettings />, 'Settings', 'Gym info, statistics, hours and more.', true)} />

      {/* ── 404 ───────────────────────────────────────────────────── */}
      <Route path="*" element={<PublicShell><NotFoundPage /></PublicShell>} />
    </Routes>
  );
}
