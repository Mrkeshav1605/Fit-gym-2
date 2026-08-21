/** Notifications — list + mark read + trainer request. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { memberApi, fmt } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { Loader, ErrorBox, EmptyState, Modal } from '../../components/ui/Primitives.jsx';
import Icon from '../../components/ui/Icon.jsx';

const TYPE_ICON = {
  welcome: 'sparkle', workout: 'dumbbell', membership: 'card', attendance: 'calendar',
  announcement: 'bell', trainer: 'users',
};
const TYPE_TONE = { welcome: 'green', workout: 'orange', membership: 'purple', attendance: 'blue', announcement: 'yellow', trainer: 'red' };

export default function NotificationsPage() {
  useTitle('Notifications');
  const { push } = useToast();
  const { data, loading, error, refetch } = useApi(memberApi.notifications, []);
  const [requestOpen, setRequestOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const markAll = async () => {
    try { await memberApi.markRead({ all: true }); push('All notifications marked as read.', 'success'); refetch(); }
    catch (e) { push(e.message, 'error'); }
  };

  const sendRequest = async () => {
    if (message.trim().length < 10) { push('Please describe your question (at least 10 characters).', 'error'); return; }
    setBusy(true);
    try {
      const res = await memberApi.trainerRequest(message);
      push(res.message, 'success');
      setRequestOpen(false); setMessage('');
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  if (loading) return <Loader label="Loading notifications…" />;
  if (error) return <ErrorBox message={error} onRetry={refetch} />;

  const notifications = data?.notifications || [];

  return (
    <>
      <div className="flex-between mb-16">
        <span className="muted small">{data?.unread || 0} unread</span>
        <div className="flex gap-8">
          <button className="btn btn-outline btn-sm" onClick={() => setRequestOpen(true)}>
            <Icon name="users" size={15} /> Request trainer help
          </button>
          {notifications.some((n) => !n.read) && (
            <button className="btn btn-ghost btn-sm" onClick={markAll}>Mark all read</button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon="bell" title="No notifications" text="Workout reminders, membership updates and gym announcements will appear here." />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {notifications.map((n) => (
            <div key={n.id} className={`notif ${n.read ? '' : 'unread'}`}>
              <span className="notif-icon" style={{ background: `var(--${TYPE_TONE[n.type] || 'blue'}-soft)`, color: `var(--${TYPE_TONE[n.type] || 'blue'})` }}>
                <Icon name={TYPE_ICON[n.type] || 'bell'} size={18} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex-between">
                  <strong style={{ fontSize: 14.5 }}>{n.title}</strong>
                  <span className="small dim">{fmt.date(n.createdAt, { day: 'numeric', month: 'short' })}</span>
                </div>
                <p className="small muted">{n.message}</p>
                {n.link && <Link to={n.link} className="small" style={{ color: 'var(--accent-2)' }}>Open →</Link>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Request trainer consultation"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setRequestOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={sendRequest} disabled={busy}>{busy ? 'Sending…' : 'Send request'}</button>
          </>
        }>
        <p className="small muted mb-16">
          A qualified trainer will review your question and get back to you. For technique, injuries or medical conditions,
          professional supervision is always the safest choice — the platform can't replace it.
        </p>
        <div className="field" style={{ margin: 0 }}>
          <label className="label" htmlFor="tr-msg">What do you need help with?</label>
          <textarea id="tr-msg" className="textarea" value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. I'd like someone to check my squat technique, or I have questions about training with a knee injury…" />
        </div>
      </Modal>
    </>
  );
}
