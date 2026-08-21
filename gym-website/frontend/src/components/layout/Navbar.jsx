/** Public navbar — responsive with mobile menu; switches to logged-in
 *  links (Dashboard / Admin) based on auth state. */
import { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import Icon from '../ui/Icon.jsx';
import { Avatar } from '../ui/Primitives.jsx';
import GlobalSearch from './GlobalSearch.jsx';

const PUBLIC_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/programs', label: 'Programs' },
  { to: '/machines', label: 'Machines' },
  { to: '/workouts', label: 'Workouts' },
  { to: '/membership', label: 'Membership' },
  { to: '/nutrition', label: 'Nutrition' },
  { to: '/progress', label: 'Progress' },
  { to: '/contact', label: 'Contact' },
];

const MEMBER_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/dashboard/workout', label: 'My Workout' },
  { to: '/dashboard/machines', label: 'My Machines' },
  { to: '/dashboard/progress', label: 'Progress' },
  { to: '/dashboard/attendance', label: 'Attendance' },
  { to: '/dashboard/membership', label: 'Subscription' },
  { to: '/dashboard/profile', label: 'Profile' },
];

const ADMIN_LINKS = [
  { to: '/admin', label: 'Admin Dashboard' },
];

export default function Navbar({ gymName = 'IronPulse' }) {
  const { user, logout } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setOpen(false); }, [user]);

  const handleLogout = async () => {
    await logout();
    push('Logged out. See you soon!', 'success');
    navigate('/');
  };

  const links = user
    ? (user.role === 'ADMIN' ? ADMIN_LINKS : MEMBER_LINKS)
    : PUBLIC_LINKS;

  return (
    <header className="nav" style={scrolled ? { background: 'rgba(11,12,15,0.94)' } : undefined}>
      <div className="container nav-inner">
        <Link to="/" className="logo" aria-label={`${gymName} home`}>
          <span className="logo-mark"><Icon name="dumbbell" size={19} strokeWidth={2.4} /></span>
          <span>{gymName}</span>
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/' || l.to === '/dashboard' || l.to === '/admin'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          <GlobalSearch />
          {user ? (
            <>
              <Link to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} className="nav-user" aria-label="Open my account">
                <Avatar name={user.name} color={user.avatarColor} />
                <span className="small" style={{ fontWeight: 700 }}>{user.name.split(' ')[0]}</span>
              </Link>
              <button className="btn btn-outline btn-sm" onClick={handleLogout} aria-label="Log out">
                <Icon name="logout" size={16} /> <span className="small">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Join Now</Link>
            </>
          )}
          <button className="hamburger" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle menu">
            <Icon name={open ? 'close' : 'menu'} size={20} />
          </button>
        </div>
      </div>

      {open && (
        <nav className={`mobile-menu ${open ? 'open' : ''}`} aria-label="Mobile navigation">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/' || l.to === '/dashboard' || l.to === '/admin'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          {user && (
            <button className="btn btn-outline btn-sm" onClick={handleLogout} style={{ alignSelf: 'flex-start' }}>
              <Icon name="logout" size={16} /> Logout
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
