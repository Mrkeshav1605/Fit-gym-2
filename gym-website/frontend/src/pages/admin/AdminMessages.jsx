/** Admin messages — contact form entries & trainer requests inbox. */
import { useState } from 'react';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { adminApi, fmt } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Loader, ErrorBox, EmptyState, Modal, ConfirmDialog } from '../../components/ui/Primitives.jsx';

export default function AdminMessages() {
  useTitle('Messages — Admin');
  const { push } = useToast();
  const { data, loading, error, refetch } = useApi(adminApi.messages, []);
  const [openMsg, setOpenMsg] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const markRead = async (id) => {
    try { await adminApi.markMessageRead(id); refetch(); }
    catch (e) { push(e.message, 'error'); }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await adminApi.deleteMessage(deleting.id);
      push('Message deleted.', 'success');
      setDeleting(null);
      refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  if (loading) return <Loader label="Loading inbox…" />;
  if (error) return <ErrorBox message={error} onRetry={refetch} />;

  const messages = data?.messages || [];

  return (
    <>
      <p className="muted small mb-16">{data?.unread || 0} unread message(s) from the contact form and trainer requests.</p>

      {messages.length === 0 ? <EmptyState icon="message" title="Inbox zero" text="No contact messages yet." /> : (
        <div style={{ display: 'grid', gap: 10 }}>
          {messages.map((m) => (
            <div key={m.id} className={`notif ${m.read ? '' : 'unread'}`} style={{ cursor: 'pointer' }}
              onClick={() => { setOpenMsg(m); if (!m.read) markRead(m.id); }}>
              <span className="notif-icon" style={{ background: m.kind === 'trainer-request' ? 'var(--purple-soft)' : 'var(--blue-soft)', color: m.kind === 'trainer-request' ? 'var(--purple)' : 'var(--blue)' }}>
                <Icon name={m.kind === 'trainer-request' ? 'users' : 'message'} size={18} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex-between">
                  <strong style={{ fontSize: 14.5 }}>{m.name} — {m.subject}</strong>
                  <span className="small dim">{fmt.date(m.createdAt, { day: 'numeric', month: 'short' })}</span>
                </div>
                <p className="small muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.message}</p>
                <span className="small dim">{m.email}{m.phone ? ` · ${m.phone}` : ''}</span>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', alignSelf: 'center' }}
                onClick={(e) => { e.stopPropagation(); setDeleting(m); }} aria-label="Delete message">
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!openMsg} onClose={() => setOpenMsg(null)} title={openMsg?.subject || 'Message'}>
        {openMsg && (
          <>
            <p className="small dim mb-16">
              From <strong style={{ color: 'var(--text-2)' }}>{openMsg.name}</strong> · {openMsg.email}
              {openMsg.phone && ` · ${openMsg.phone}`} · {fmt.date(openMsg.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <p style={{ whiteSpace: 'pre-wrap' }}>{openMsg.message}</p>
            {openMsg.kind === 'trainer-request' && (
              <p className="small mt-16" style={{ color: '#fde68a' }}>
                <Icon name="shield" size={14} style={{ verticalAlign: -2 }} /> Trainer request — reply personally, and remember
                technique guidance and medical questions should be handled by qualified staff.
              </p>
            )}
          </>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDelete} loading={busy}
        title="Delete message?" text="The message will be removed permanently." />
    </>
  );
}
