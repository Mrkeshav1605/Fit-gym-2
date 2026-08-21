/** Admin attendance — mark present, filter by date, search, verify QR. */
import { useState } from 'react';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { adminApi, fmt } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Loader, ErrorBox, EmptyState, Modal } from '../../components/ui/Primitives.jsx';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function AdminAttendance() {
  useTitle('Attendance — Admin');
  const { push } = useToast();
  const [date, setDate] = useState(todayStr());
  const [memberId, setMemberId] = useState('');
  const [q, setQ] = useState('');
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [markOpen, setMarkOpen] = useState(false);
  const [markBusy, setMarkBusy] = useState(false);

  const members = useApi(() => adminApi.members({}), []);
  const attendance = useApi(
    () => adminApi.attendance({ date: date || undefined, memberId: memberId || undefined }),
    [date, memberId]
  );

  const markPresent = async (userId) => {
    setMarkBusy(true);
    try {
      const res = await adminApi.markAttendance(userId, date);
      push(res.message || 'Marked present.', 'success');
      setMarkOpen(false);
      attendance.refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setMarkBusy(false); }
  };

  const verifyQr = async () => {
    if (!qrCode.trim()) { push('Paste the QR code first.', 'error'); return; }
    setVerifying(true);
    try {
      const res = await adminApi.verifyCheckIn(qrCode.trim());
      push(res.message, 'success');
      setQrCode('');
      setVerifyOpen(false);
      attendance.refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setVerifying(false); }
  };

  const filteredMembers = (members.data?.members || []).filter((m) =>
    !q.trim() || `${m.name} ${m.email}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <div className="flex-between mb-16">
        <div className="flex gap-8 flex-wrap">
          <input type="date" className="input" style={{ width: 'auto' }} value={date} onChange={(e) => setDate(e.target.value)} aria-label="Filter by date" />
          <select className="select" style={{ width: 'auto' }} value={memberId} onChange={(e) => setMemberId(e.target.value)} aria-label="Filter by member">
            <option value="">All members</option>
            {(members.data?.members || []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="flex gap-8">
          <button className="btn btn-outline" onClick={() => setVerifyOpen(true)}><Icon name="qr" size={16} /> Verify QR check-in</button>
          <button className="btn btn-primary" onClick={() => setMarkOpen(true)}><Icon name="plus" size={16} /> Mark attendance</button>
        </div>
      </div>

      {attendance.loading ? <Loader /> : attendance.error ? <ErrorBox message={attendance.error} onRetry={attendance.refetch} /> : (
        <>
          <p className="small muted mb-16">
            {attendance.data?.open
              ? <span className="badge badge-green">GYM OPEN</span>
              : <span className="badge badge-red">SUNDAY — CLOSED / HOLIDAY</span>}
            {' '}· {attendance.data?.total || 0} record(s) for {fmt.date(attendance.data?.today, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {attendance.data?.attendance?.length === 0 ? (
            <EmptyState icon="calendar" title="No attendance records" text="No check-ins for this date yet." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Member</th><th>Date</th><th>Check-in time</th><th>Method</th></tr></thead>
                <tbody>
                  {attendance.data.attendance.map((a) => (
                    <tr key={a.id}>
                      <td><strong>{a.member}</strong><div className="small dim">{a.email}</div></td>
                      <td>{fmt.date(a.date, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                      <td className="mono">{fmt.time(a.checkInTime)}</td>
                      <td><span className={`badge ${a.method === 'qr' ? 'badge-blue' : a.method === 'workout' ? 'badge-green' : 'badge-purple'}`}>{a.method}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Verify QR modal */}
      <Modal open={verifyOpen} onClose={() => setVerifyOpen(false)} title="Verify member QR check-in"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setVerifyOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={verifyQr} disabled={verifying}>{verifying ? 'Verifying…' : 'Verify & check in'}</button>
          </>
        }>
        <p className="small muted mb-16">Scan the member's QR code (or paste the code text) to check them in for today.</p>
        <div className="field" style={{ margin: 0 }}>
          <label className="label">QR code text</label>
          <textarea className="textarea" style={{ minHeight: 80 }} value={qrCode} onChange={(e) => setQrCode(e.target.value)} placeholder="Paste code here…" />
        </div>
      </Modal>

      {/* Mark attendance modal */}
      <Modal open={markOpen} onClose={() => setMarkOpen(false)} title="Mark attendance"
        footer={<button className="btn btn-ghost" onClick={() => setMarkOpen(false)}>Close</button>}>
        <div className="field">
          <label className="label">Date</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Search member</label>
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a name…" />
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {filteredMembers.slice(0, 40).map((m) => (
            <div key={m.id} className="flex-between" style={{ padding: '9px 4px', borderBottom: '1px dashed var(--border)' }}>
              <div>
                <strong style={{ fontSize: 14.5 }}>{m.name}</strong>
                <div className="small dim">{m.email}</div>
              </div>
              <button className="btn btn-outline btn-sm" disabled={markBusy} onClick={() => markPresent(m.id)}>Mark present</button>
            </div>
          ))}
          {filteredMembers.length === 0 && <p className="small dim">No members match.</p>}
        </div>
      </Modal>
    </>
  );
}
