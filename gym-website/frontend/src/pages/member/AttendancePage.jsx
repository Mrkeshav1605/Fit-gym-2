/** Attendance — QR check-in card, today's status, monthly stats, history. */
import { useEffect, useState } from 'react';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { memberApi, fmt } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Loader, ErrorBox, EmptyState, StatCard } from '../../components/ui/Primitives.jsx';

/** Deterministic decorative matrix derived from the code (visual only). */
function QrMatrix({ code }) {
  const [cells, setCells] = useState([]);
  useEffect(() => {
    let h = 0;
    for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const arr = [];
    let seed = h || 1;
    const rand = () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed; };
    for (let i = 0; i < 21 * 21; i++) arr.push(rand() % 3 === 0);
    setCells(arr);
  }, [code]);
  return (
    <svg viewBox="0 0 21 21" style={{ width: 190, height: 190, background: '#fff', borderRadius: 14, padding: 0 }} aria-hidden="true">
      {cells.map((on, i) => {
        const x = i % 21; const y = Math.floor(i / 21);
        const corner = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
        if (corner) return null;
        return on ? <rect key={i} x={x} y={y} width="1" height="1" fill="#0b0c0f" /> : null;
      })}
      {[[0, 0], [14, 0], [0, 14]].map(([cx, cy]) => (
        <g key={`${cx}${cy}`} fill="none" stroke="#0b0c0f" strokeWidth="0.7">
          <rect x={cx + 1} y={cy + 1} width="5" height="5" />
          <rect x={cx + 2.4} y={cy + 2.4} width="2.2" height="2.2" fill="#0b0c0f" />
        </g>
      ))}
    </svg>
  );
}

export default function AttendancePage() {
  useTitle('Attendance');
  const { user } = useAuth();
  const { push } = useToast();
  const { data, loading, error, refetch } = useApi(memberApi.attendance, []);
  const [code, setCode] = useState(null);
  const [codeBusy, setCodeBusy] = useState(false);
  const [checking, setChecking] = useState(false);

  if (loading) return <Loader label="Loading attendance…" />;
  if (error) return <ErrorBox message={error} onRetry={refetch} />;

  const today = data?.today;
  const isSunday = new Date().getDay() === 0;

  const getCode = async () => {
    setCodeBusy(true);
    try {
      const res = await memberApi.checkinCode();
      setCode(res);
    } catch (e) { push(e.message, 'error'); }
    finally { setCodeBusy(false); }
  };

  const selfCheckin = async () => {
    if (!code) return;
    setChecking(true);
    try {
      const res = await memberApi.checkin(code.code);
      push(res.message, 'success');
      setCode(null);
      refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setChecking(false); }
  };

  return (
    <>
      <div className="grid grid-3" style={{ gap: 16, marginBottom: 24 }}>
        <StatCard icon="calendar" label="Today" value={today ? `Checked in at ${fmt.time(today.checkInTime)}` : (isSunday ? 'Gym closed' : 'Not checked in')} tone={today ? 'green' : 'gray'} />
        <StatCard icon="chart" label="Visits this month" value={data?.thisMonth || 0} tone="blue" />
        <StatCard icon="target" label="Monthly attendance" value={`${data?.percentage || 0}%`} tone="orange" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1.4fr', gap: 22 }}>
        {/* QR check-in */}
        <div className="card text-center">
          <h3 className="mb-8">QR Check-In</h3>
          <p className="small muted mb-16">
            {isSunday
              ? 'The gym is closed on Sundays. Enjoy your rest day!'
              : today
                ? 'You are already checked in for today. Have a great session!'
                : 'Show this code at the reception desk — the staff will scan it and mark your attendance.'}
          </p>
          {!isSunday && !today && (
            code ? (
              <>
                <div style={{ display: 'grid', placeItems: 'center', marginBottom: 14 }}>
                  <QrMatrix code={code.code} />
                </div>
                <div className="flex-between small" style={{ maxWidth: 240, margin: '0 auto 14px' }}>
                  <span className="dim">Expires in</span>
                  <span className="badge badge-orange">{code.expiresInSec}s</span>
                </div>
                <p className="small dim mb-16" style={{ wordBreak: 'break-all', fontSize: 11 }}>{code.code}</p>
                <div className="flex gap-8" style={{ justifyContent: 'center' }}>
                  <button className="btn btn-primary" onClick={selfCheckin} disabled={checking}>
                    {checking ? 'Checking in…' : 'Check in (demo)'}
                  </button>
                  <button className="btn btn-outline" onClick={() => setCode(null)}>Discard</button>
                </div>
              </>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={getCode} disabled={codeBusy}>
                <Icon name="qr" size={18} /> {codeBusy ? 'Generating…' : 'Generate check-in QR'}
              </button>
            )
          )}
        </div>

        {/* History */}
        <div className="card">
          <h3 className="mb-16">Attendance history</h3>
          {(data?.history || []).length === 0 ? (
            <EmptyState icon="calendar" title="No attendance yet" text="Your visits will appear here once you start checking in." />
          ) : (
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              <div className="table-wrap" style={{ borderRadius: 0, border: 'none', background: 'transparent' }}>
                <table className="table" style={{ minWidth: 420 }}>
                  <thead><tr><th>Date</th><th>Time</th><th>Method</th></tr></thead>
                  <tbody>
                    {data.history.slice(0, 60).map((a) => (
                      <tr key={a.id}>
                        <td>{fmt.date(a.date, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                        <td>{fmt.time(a.checkInTime)}</td>
                        <td><span className={`badge ${a.method === 'qr' ? 'badge-blue' : a.method === 'workout' ? 'badge-green' : 'badge-purple'}`}>{a.method}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
