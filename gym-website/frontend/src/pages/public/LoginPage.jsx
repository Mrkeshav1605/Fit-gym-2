/** Login page. */
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useTitle } from '../../hooks/useApi.js';
import Icon from '../../components/ui/Icon.jsx';

export default function LoginPage() {
  useTitle('Login');
  const { login } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const from = location.state?.from || (location.state?.role === 'ADMIN' ? '/admin' : '/dashboard');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      push(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
      navigate(user.role === 'ADMIN' ? '/admin' : from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main>
      <div className="container">
        <div className="auth-card">
          <div className="card">
            <div className="text-center mb-16">
              <span className="logo-mark" style={{ margin: '0 auto 12px' }}><Icon name="dumbbell" size={20} /></span>
              <h1 className="h3">Member Login</h1>
              <p className="small muted">Welcome back — your plan is waiting.</p>
            </div>

            {error && (
              <div className="notif mb-16" style={{ borderColor: 'rgba(248,113,113,0.4)', background: 'var(--red-soft)' }}>
                <Icon name="warning" size={18} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 2 }} />
                <span className="small" style={{ color: 'var(--red)' }}>{error}</span>
              </div>
            )}

            <form onSubmit={submit} noValidate>
              <div className="field">
                <label className="label" htmlFor="l-email">Email</label>
                <input id="l-email" type="email" className="input" autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="field">
                <label className="label" htmlFor="l-password">Password</label>
                <input id="l-password" type="password" className="input" autoComplete="current-password" value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <button className="btn btn-primary btn-block btn-lg" disabled={busy}>
                {busy ? 'Logging in…' : 'Login'}
              </button>
            </form>

            <div className="flex-between mt-16 small">
              <Link to="/forgot-password" className="muted" style={{ color: 'var(--accent-2)' }}>Forgot password?</Link>
              <span className="dim">New here? <Link to="/register" style={{ color: 'var(--accent-2)' }}>Join Now</Link></span>
            </div>
          </div>

          <div className="card mt-16" style={{ background: 'var(--bg-2)' }}>
            <p className="small dim"><strong style={{ color: 'var(--text-2)' }}>Demo accounts:</strong></p>
            <p className="small dim">Member — member@ironpulse.fit / Member@123</p>
            <p className="small dim">Admin — admin@ironpulse.fit / Admin@123</p>
          </div>
        </div>
      </div>
    </main>
  );
}
