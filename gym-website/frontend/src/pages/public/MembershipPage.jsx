/** Membership — plan catalogue with configurable prices from the backend. */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi, useReveal, useTitle } from '../../hooks/useApi.js';
import { publicApi, memberApi, fmt } from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { PageBanner, Loader, ErrorBox, ConfirmDialog } from '../../components/ui/Primitives.jsx';

export default function MembershipPage() {
  useTitle('Membership Plans');
  useReveal();
  const { user } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApi(publicApi.memberships, []);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const confirmSubscribe = async () => {
    setSubmitting(true);
    try {
      const res = await memberApi.subscribe(selected.id);
      setSelected(null);
      push(res.subscription ? `Welcome to ${res.subscription.planName}! Your membership is active.` : 'Membership activated!', 'success');
      navigate('/dashboard/membership');
    } catch (e) { push(e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  return (
    <main>
      <PageBanner crumb={<Link to="/">Home</Link>} title="Membership Plans"
        sub="Transparent plans, no hidden fees. Prices are set by the gym and shown live from the system." />

      <section className="section-tight">
        <div className="container">
          {loading && <Loader />}
          {error && <ErrorBox message={error} onRetry={refetch} />}
          {!loading && !error && (
            <>
              <div className="grid grid-3" style={{ alignItems: 'stretch' }}>
                {(data?.memberships || []).map((m) => (
                  <div className="card card-hover reveal" key={m.id} style={m.popular ? { borderColor: 'rgba(255,92,28,0.55)' } : undefined}>
                    {m.popular && (
                      <div className="flex-between">
                        <span className="badge badge-orange">MOST POPULAR</span>
                      </div>
                    )}
                    <h3 style={{ fontSize: 18, letterSpacing: '0.05em', marginTop: m.popular ? 10 : 0 }}>{m.name}</h3>
                    <div className="flex" style={{ alignItems: 'baseline', gap: 4, margin: '10px 0 4px' }}>
                      <span style={{ fontSize: 36, fontWeight: 800 }}>{fmt.money(m.price, m.currency)}</span>
                      <span className="muted small">/ {m.durationMonths} month{m.durationMonths > 1 ? 's' : ''}</span>
                    </div>
                    <p className="muted small" style={{ marginBottom: 14 }}>{m.description}</p>
                    <ul className="small muted" style={{ listStyle: 'none', marginBottom: 18 }}>
                      {m.features.map((f, i) => (
                        <li key={i} className="flex gap-8" style={{ padding: '4px 0' }}>
                          <Icon name="check" size={15} style={{ color: 'var(--green)', flexShrink: 0 }} /> {f}
                        </li>
                      ))}
                    </ul>
                    {user ? (
                      <button className={`btn btn-block ${m.popular ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSelected(m)}>
                        Subscribe to {m.name}
                      </button>
                    ) : (
                      <Link to="/register" className={`btn btn-block ${m.popular ? 'btn-primary' : 'btn-outline'}`}>Join with {m.name}</Link>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-2 mt-32" style={{ gap: 22 }}>
                <div className="card">
                  <h3 className="mb-8"><Icon name="info" size={18} style={{ verticalAlign: -3, marginRight: 6, color: 'var(--blue)' }} />How subscriptions work</h3>
                  <p className="muted small">
                    Your membership shows live in your dashboard: plan, start date, expiry date, payment status and renewal date.
                    We never store card details — payments are processed by a payment gateway, and the platform is built ready for
                    Razorpay/Stripe integration.
                  </p>
                </div>
                <div className="card">
                  <h3 className="mb-8"><Icon name="shield" size={18} style={{ verticalAlign: -3, marginRight: 6, color: 'var(--green)' }} />Fair policies</h3>
                  <p className="muted small">
                    Sunday is always a rest day and the gym is closed. Memberships pause, not pressure: we'd rather you train
                    consistently for years than burn out in a month. No hidden charges, no auto-renewal surprises without notice.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={!!selected} onClose={() => setSelected(null)} onConfirm={confirmSubscribe} loading={submitting}
        title={`Subscribe to ${selected?.name || ''}?`}
        text={`This demo activates your ${selected?.name} membership immediately (${selected ? fmt.money(selected.price, selected.currency) : ''}/month). In production this step is handled by the payment gateway.`}
        confirmLabel="Confirm subscription"
      />
    </main>
  );
}
