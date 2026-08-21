/** Subscription — current plan, dates, status, history + upgrade path. */
import { Link } from 'react-router-dom';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { memberApi, publicApi, fmt } from '../../services/api.js';
import { Loader, ErrorBox, EmptyState, Badge } from '../../components/ui/Primitives.jsx';
import Icon from '../../components/ui/Icon.jsx';

const STATUS_TONE = { active: 'green', pending: 'yellow', expired: 'red', cancelled: 'red' };

export default function SubscriptionPage() {
  useTitle('Subscription');
  const sub = useApi(memberApi.subscription, []);
  const plans = useApi(publicApi.memberships, []);

  if (sub.loading) return <Loader label="Loading your membership…" />;
  if (sub.error) return <ErrorBox message={sub.error} onRetry={sub.refetch} />;

  const current = sub.data?.subscription;
  const history = sub.data?.history || [];
  const daysLeft = current?.expiryDate ? Math.max(0, Math.ceil((new Date(current.expiryDate) - new Date()) / 86400000)) : 0;

  return (
    <>
      {!current ? (
        <EmptyState icon="card" title="No active membership"
          text="You don't have an active subscription yet. Pick a plan to unlock your smart training experience.">
          <Link to="/membership" className="btn btn-primary">View plans</Link>
        </EmptyState>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: 22 }}>
          <div className="card" style={{ borderColor: current.status === 'active' ? 'rgba(52,211,153,0.35)' : 'var(--border)' }}>
            <div className="flex-between mb-16">
              <h3>Current plan</h3>
              <Badge tone={STATUS_TONE[current.status]}>{current.status.toUpperCase()}</Badge>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '0.04em' }}>{current.planName}</div>
            <div className="muted small mt-8">{fmt.money(current.price, current.currency)} / month</div>
            <div className="grid grid-2 mt-24" style={{ gap: 12 }}>
              <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                <div className="small dim">Start date</div>
                <div style={{ fontWeight: 700 }}>{fmt.date(current.startDate)}</div>
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                <div className="small dim">Expiry date</div>
                <div style={{ fontWeight: 700 }}>{fmt.date(current.expiryDate)}</div>
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                <div className="small dim">Payment status</div>
                <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{current.status}</div>
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                <div className="small dim">Days remaining</div>
                <div style={{ fontWeight: 700 }}>{current.status === 'active' ? `${daysLeft} days` : '—'}</div>
              </div>
            </div>
            {current.status === 'active' && (
              <div className="mt-16">
                <div style={{ height: 8, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, 100 - (daysLeft / 30) * 100)}%`, height: '100%', background: 'var(--grad-accent)' }} />
                </div>
                <p className="small dim mt-8">Renewal reminders are sent before your plan expires.</p>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="mb-8">Want more?</h3>
            <p className="small muted mb-16">Upgrade or extend your plan anytime. Your current plan stays active until the new one begins.</p>
            {(plans.data?.memberships || []).filter((p) => p.name !== current.planName).map((p) => (
              <div key={p.id} className="flex-between" style={{ padding: '10px 0', borderBottom: '1px dashed var(--border)' }}>
                <div>
                  <strong>{p.name}</strong>
                  <div className="small dim">{fmt.money(p.price, p.currency)} / month</div>
                </div>
                <Link to="/membership" className="btn btn-outline btn-sm">Choose</Link>
              </div>
            ))}
            <p className="small dim mt-16" style={{ fontSize: 12.5 }}>
              <Icon name="shield" size={13} style={{ verticalAlign: -2 }} /> We never store card details. Payments go through a secure
              gateway (Razorpay/Stripe ready).
            </p>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="card mt-24">
          <h3 className="mb-16">Subscription history</h3>
          <div className="table-wrap" style={{ border: 'none', background: 'transparent' }}>
            <table className="table" style={{ minWidth: 520 }}>
              <thead><tr><th>Plan</th><th>Start</th><th>Expiry</th><th>Status</th><th>Reference</th></tr></thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td><strong>{h.planName}</strong></td>
                    <td>{fmt.date(h.startDate)}</td>
                    <td>{fmt.date(h.expiryDate)}</td>
                    <td><Badge tone={STATUS_TONE[h.status]}>{h.status}</Badge></td>
                    <td className="dim small">{h.paymentRef}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
