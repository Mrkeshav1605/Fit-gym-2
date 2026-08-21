/** Admin subscriptions — list, filter by status, change status. */
import { useState } from 'react';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { adminApi, fmt } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Loader, ErrorBox, EmptyState, Badge } from '../../components/ui/Primitives.jsx';

const STATUS_TONE = { active: 'green', pending: 'yellow', expired: 'red', cancelled: 'red' };

export default function AdminSubscriptions() {
  useTitle('Subscriptions — Admin');
  const { push } = useToast();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const { data, loading, error, refetch } = useApi(
    () => adminApi.subscriptions({ status: status || undefined, q: q.trim() || undefined }),
    [status, q]
  );

  const changeStatus = async (sub, newStatus) => {
    try {
      await adminApi.updateSubscription(sub.id, newStatus);
      push(`Subscription for ${sub.member} set to ${newStatus}.`, 'success');
      refetch();
    } catch (e) { push(e.message, 'error'); }
  };

  if (loading) return <Loader label="Loading subscriptions…" />;
  if (error) return <ErrorBox message={error} onRetry={refetch} />;

  const subs = data?.subscriptions || [];

  return (
    <>
      <div className="flex-between mb-16">
        <div className="flex gap-8 flex-wrap">
          <div className="flex" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '0 10px' }}>
            <Icon name="search" size={16} className="dim" />
            <input className="input" style={{ border: 'none', background: 'transparent', boxShadow: 'none', minWidth: 180 }}
              placeholder="Search member…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search subscriptions" />
          </div>
          <select className="select" style={{ width: 'auto' }} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {['active', 'pending', 'expired', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <span className="muted small">{subs.length} record(s)</span>
      </div>

      {subs.length === 0 ? (
        <EmptyState icon="card" title="No subscriptions found" text="No records match your filter." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Member</th><th>Plan</th><th>Amount</th><th>Start</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{s.member}</div>
                    <div className="small dim">{s.memberEmail}</div>
                  </td>
                  <td><strong>{s.planName}</strong></td>
                  <td className="mono">{fmt.money(s.price, s.currency)}</td>
                  <td className="small">{fmt.date(s.startDate)}</td>
                  <td className="small">{fmt.date(s.expiryDate)}</td>
                  <td><Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge></td>
                  <td>
                    <select className="select" style={{ width: 'auto', padding: '6px 28px 6px 10px' }} value={s.status}
                      onChange={(e) => changeStatus(s, e.target.value)} aria-label={`Change status for ${s.member}`}>
                      {['active', 'pending', 'expired', 'cancelled'].map((x) => <option key={x} value={x}>{x}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
