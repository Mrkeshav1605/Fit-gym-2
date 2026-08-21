/** Sidebar shells for the member dashboard and admin panel. */
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Icon from '../ui/Icon.jsx';
import { Avatar } from '../ui/Primitives.jsx';

const MEMBER_LINKS = [
  { section: 'Overview', items: [
    { to: '/dashboard', label: 'Dashboard', icon: 'home', end: true },
    { to: '/dashboard/workout', label: 'My Workout', icon: 'clipboard' },
    { to: '/dashboard/machines', label: 'My Machines', icon: 'dumbbell' },
    { to: '/dashboard/history', label: 'Workout History', icon: 'clock' },
  ]},
  { section: 'Tracking', items: [
    { to: '/dashboard/progress', label: 'Progress', icon: 'chart' },
    { to: '/dashboard/attendance', label: 'Attendance', icon: 'calendar' },
  ]},
  { section: 'Account', items: [
    { to: '/dashboard/membership', label: 'Subscription', icon: 'card' },
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'bell' },
    { to: '/dashboard/profile', label: 'Profile', icon: 'user' },
  ]},
];

const ADMIN_LINKS = [
  { section: 'Overview', items: [
    { to: '/admin', label: 'Dashboard', icon: 'home', end: true },
    { to: '/admin/members', label: 'Members', icon: 'users' },
    { to: '/admin/attendance', label: 'Attendance', icon: 'calendar' },
    { to: '/admin/subscriptions', label: 'Subscriptions', icon: 'card' },
  ]},
  { section: 'Content', items: [
    { to: '/admin/machines', label: 'Machines', icon: 'dumbbell' },
    { to: '/admin/exercises', label: 'Exercises', icon: 'activity' },
    { to: '/admin/workouts', label: 'Workout Plans', icon: 'clipboard' },
    { to: '/admin/schedule', label: 'Weekly Schedule', icon: 'list' },
    { to: '/admin/memberships', label: 'Membership Plans', icon: 'award' },
    { to: '/admin/nutrition', label: 'Nutrition Content', icon: 'book' },
    { to: '/admin/testimonials', label: 'Testimonials', icon: 'star' },
  ]},
  { section: 'Communication', items: [
    { to: '/admin/messages', label: 'Contact Messages', icon: 'message' },
    { to: '/admin/notifications', label: 'Announcements', icon: 'bell' },
  ]},
  { section: 'System', items: [
    { to: '/admin/settings', label: 'Settings', icon: 'settings' },
  ]},
];

export function DashboardLayout({ children, admin = false, title, sub, actions }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const links = admin ? ADMIN_LINKS : MEMBER_LINKS;

  return (
    <div className="dash">
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label={admin ? 'Admin menu' : 'Member menu'}>
        <div className="flex" style={{ padding: '0 12px 14px', gap: 10 }}>
          <Avatar name={user?.name} color={user?.avatarColor} size={34} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div className="small dim">{admin ? 'Administrator' : user?.role === 'TRAINER' ? 'Trainer' : 'Member'}</div>
          </div>
        </div>
        {links.map((group) => (
          <div key={group.section}>
            <div className="side-section">{group.section}</div>
            {group.items.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
                onClick={() => setOpen(false)}>
                <Icon name={l.icon} size={19} className="icon" />
                {l.label}
              </NavLink>
            ))}
          </div>
        ))}
        <div className="side-section">Shortcuts</div>
        <NavLink to={admin ? '/' : '/machines'} className="side-link" onClick={() => setOpen(false)}>
          <Icon name="arrow-right" size={19} className="icon" /> {admin ? 'View website' : 'Browse machines'}
        </NavLink>
      </aside>

      <main className="dash-main">
        <div className="dash-head">
          <div className="flex-between">
            <div>
              <button className="btn btn-ghost btn-sm hamburger" style={{ display: 'grid', placeItems: 'center', marginBottom: 10 }} onClick={() => setOpen(true)} aria-label="Open menu">
                <Icon name="menu" size={18} />
              </button>
              <h1 className="dash-title">{title}</h1>
              {sub && <p className="dash-sub">{sub}</p>}
            </div>
            {actions}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
