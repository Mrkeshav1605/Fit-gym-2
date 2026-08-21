/** Site footer with contact info, quick links, hours and disclaimer. */
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { DAY_LABELS_ORDER } from '../../utils/labels.js';

export default function Footer({ settings }) {
  const s = settings || {};
  const socials = [
    { key: 'instagram', icon: 'instagram' }, { key: 'facebook', icon: 'facebook' },
    { key: 'youtube', icon: 'youtube' }, { key: 'twitter', icon: 'twitter' },
  ].filter((x) => s.socials?.[x.key]);
  const hours = s.hours || {};

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link to="/" className="logo" style={{ marginBottom: 14 }}>
              <span className="logo-mark"><Icon name="dumbbell" size={19} strokeWidth={2.4} /></span>
              <span>{s.gymName || 'IronPulse Gym'}</span>
            </Link>
            <p className="small muted" style={{ maxWidth: 300 }}>
              {s.tagline || 'Smart training. Real results.'} Personalised workouts, machine-by-machine coaching and progress tracking.
            </p>
            <div className="flex gap-8" style={{ marginTop: 16 }}>
              {socials.map((x) => (
                <a key={x.key} className="social-btn" href={s.socials[x.key]} aria-label={x.key} target="_blank" rel="noreferrer">
                  <Icon name={x.icon} size={17} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4>Explore</h4>
            <Link className="footer-link" to="/about">About</Link>
            <Link className="footer-link" to="/programs">Programs</Link>
            <Link className="footer-link" to="/machines">Machines</Link>
            <Link className="footer-link" to="/workouts">Workouts</Link>
            <Link className="footer-link" to="/membership">Membership</Link>
            <Link className="footer-link" to="/nutrition">Nutrition</Link>
          </div>

          <div>
            <h4>Members</h4>
            <Link className="footer-link" to="/register">Join Now</Link>
            <Link className="footer-link" to="/login">Member Login</Link>
            <Link className="footer-link" to="/contact">Contact</Link>
            <Link className="footer-link" to="/progress">Progress</Link>
          </div>

          <div>
            <h4>Visit us</h4>
            <p className="footer-link" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Icon name="pin" size={15} className="dim" style={{ marginTop: 3 }} /> {s.address || 'Dabra, Chhattisgarh'}
            </p>
            <a className="footer-link" href={`tel:${s.phone || ''}`}><Icon name="phone" size={14} /> {s.phone || ''}</a>
            <a className="footer-link" href={`mailto:${s.email || ''}`}><Icon name="mail" size={14} /> {s.email || ''}</a>
            <p className="small dim" style={{ marginTop: 10 }}>
              {DAY_LABELS_ORDER.slice(0, 6).map((d) => (
                <span key={d} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <span>{d.slice(0, 3)}</span><span>{hours[d.toLowerCase()]}</span>
                </span>
              ))}
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 10, color: 'var(--red)', fontWeight: 700 }}>
                <span>Sun</span><span>CLOSED / HOLIDAY</span>
              </span>
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {s.gymName || 'IronPulse Gym'}. All rights reserved.</span>
          <span style={{ maxWidth: 560, textAlign: 'right' }}>
            Fitness education only — this platform does not replace a qualified trainer, doctor, physiotherapist, or dietitian.
          </span>
        </div>
      </div>
    </footer>
  );
}
