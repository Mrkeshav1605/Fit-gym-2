/** Admin announcements — send a notification to every member. */
import { useState } from 'react';
import { useTitle } from '../../hooks/useApi.js';
import { adminApi } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import Icon from '../../components/ui/Icon.jsx';

export default function AdminNotifications() {
  useTitle('Announcements — Admin');
  const { push } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    if (title.trim().length < 2 || message.trim().length < 5) {
      push('Please enter both a title and a message.', 'error');
      return;
    }
    setBusy(true);
    try {
      const res = await adminApi.announce({ title, message, link: link || '' });
      push(res.message, 'success');
      setTitle(''); setMessage(''); setLink('');
    } catch (err) { push(err.message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: 22 }}>
      <form className="card" onSubmit={send}>
        <h3 className="mb-16">Send announcement</h3>
        <div className="field">
          <label className="label" htmlFor="a-title">Title *</label>
          <input id="a-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Holiday hours this week" />
        </div>
        <div className="field">
          <label className="label" htmlFor="a-msg">Message *</label>
          <textarea id="a-msg" className="textarea" value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. The gym will close at 6 PM on Friday for maintenance. Saturday hours are normal." />
        </div>
        <div className="field">
          <label className="label" htmlFor="a-link">Link (optional)</label>
          <input id="a-link" className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/dashboard/workout" />
        </div>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : <>Send to all members <Icon name="send" size={16} /></>}</button>
      </form>

      <div className="card" style={{ alignSelf: 'start' }}>
        <h3 className="mb-8">Automatic notifications</h3>
        <p className="small muted" style={{ marginBottom: 14 }}>
          The system already sends notifications to members automatically for:
        </p>
        <ul className="small muted" style={{ listStyle: 'none' }}>
          <li className="flex gap-8" style={{ padding: '5px 0' }}><Icon name="check" size={14} style={{ color: 'var(--green)' }} /> Workout reminders & rest-day reminders</li>
          <li className="flex gap-8" style={{ padding: '5px 0' }}><Icon name="check" size={14} style={{ color: 'var(--green)' }} /> New workout plans assigned</li>
          <li className="flex gap-8" style={{ padding: '5px 0' }}><Icon name="check" size={14} style={{ color: 'var(--green)' }} /> Membership expiry & renewal notices</li>
          <li className="flex gap-8" style={{ padding: '5px 0' }}><Icon name="check" size={14} style={{ color: 'var(--green)' }} /> Attendance check-in confirmations</li>
          <li className="flex gap-8" style={{ padding: '5px 0' }}><Icon name="check" size={14} style={{ color: 'var(--green)' }} /> Workout completion celebrations</li>
        </ul>
        <p className="small dim mt-8">Use the form to add gym-wide announcements on top of these.</p>
      </div>
    </div>
  );
}
