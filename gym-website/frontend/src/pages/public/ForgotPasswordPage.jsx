/** Forgot password — requests a reset token (demo: shown on screen). */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useTitle } from '../../hooks/useApi.js';
import Icon from '../../components/ui/Icon.jsx';

export default function ForgotPasswordPage() {
  useTitle('Forgot Password');
  const { push } = useToast();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [demoToken, setDemoToken] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await authApi.forgot(email);
      if (res.demoResetToken) {
        setDemoToken(res.demoResetToken);
        push('Reset token generated (demo: shown below).', 'info');
      } else {
        push(res.message, 'success');
      }
    } catch (err) { push(err.message, 'error'); }
    finally { setBusy(false); }
  };

  const doReset = async (e) => {
    e.preventDefault();
    setResetting(true);
    try {
      const res = await authApi.reset(demoToken, newPassword);
      push(res.message, 'success');
      setDemoToken(null);
      setNewPassword('');
    } catch (err) { push(err.message, 'error'); }
    finally { setResetting(false); }
  };

  return (
    <main>
      <div className="container">
        <div className="auth-card">
          <div className="card">
            <h1 className="h3 mb-8">Forgot your password?</h1>
            <p className="small muted mb-16">Enter your account email and we'll generate a reset link. In production this is emailed to you — in this demo the token is shown below.</p>

            <form onSubmit={submit} noValidate>
              <div className="field">
                <label className="label" htmlFor="f-email">Email</label>
                <input id="f-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <button className="btn btn-primary btn-block" disabled={busy}>
                {busy ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            {demoToken && (
              <form onSubmit={doReset} className="mt-24" noValidate>
                <div className="notif mb-16" style={{ borderColor: 'rgba(96,165,250,0.4)', background: 'var(--blue-soft)' }}>
                  <Icon name="info" size={18} style={{ color: 'var(--blue)', flexShrink: 0, marginTop: 2 }} />
                  <div className="small">
                    <strong>Demo reset token (normally emailed):</strong>
                    <div style={{ wordBreak: 'break-all', fontSize: 12.5 }}>{demoToken}</div>
                  </div>
                </div>
                <div className="field">
                  <label className="label" htmlFor="f-new">New password</label>
                  <input id="f-new" type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" required />
                </div>
                <button className="btn btn-primary btn-block" disabled={resetting}>
                  {resetting ? 'Updating…' : 'Reset my password'}
                </button>
              </form>
            )}

            <div className="text-center mt-16 small">
              <Link to="/login" className="muted" style={{ color: 'var(--accent-2)' }}>← Back to login</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
