/** Workout history — list + calendar view of completed sessions. */
import { useState } from 'react';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { memberApi, fmt } from '../../services/api.js';
import { Loader, ErrorBox, EmptyState } from '../../components/ui/Primitives.jsx';
import { DAY_LABELS } from '../../utils/labels.js';
import Icon from '../../components/ui/Icon.jsx';

export default function HistoryPage() {
  useTitle('Workout History');
  const { data, loading, error, refetch } = useApi(memberApi.history, []);
  const [view, setView] = useState('list');

  if (loading) return <Loader label="Loading your history…" />;
  if (error) return <ErrorBox message={error} onRetry={refetch} />;

  const history = data?.history || [];
  const byMonth = {};
  history.forEach((h) => {
    const key = fmt.date(h.completedAt, { month: 'long', year: 'numeric' });
    (byMonth[key] = byMonth[key] || []).push(h);
  });


  return (
    <>
      <div className="tabs">
        <button className={`tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>List view</button>
        <button className={`tab ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>Calendar view</button>
      </div>

      {history.length === 0 && (
        <EmptyState icon="clock" title="No workout completed yet"
          text="Finish your first session in the workout player and it will show up here.">
          <a className="btn btn-primary" href="/dashboard/workout">Go to My Workout</a>
        </EmptyState>
      )}

      {view === 'list' && Object.entries(byMonth).map(([month, items]) => (
        <div key={month} className="mb-24">
          <div className="flex-between mb-8">
            <h3 style={{ fontSize: 16, textTransform: 'capitalize' }}>{month}</h3>
            <span className="badge badge-gray">{items.length} sessions</span>
          </div>
          {items.map((h) => (
            <div className="card card-pad-sm mb-8" key={h.id}>
              <div className="flex-between" style={{ flexWrap: 'wrap', gap: 8 }}>
                <div className="flex gap-8">
                  <span className="badge badge-orange">{DAY_LABELS[h.day]?.slice(0, 3)}</span>
                  <strong>{h.focus}</strong>
                </div>
                <span className="small dim">{fmt.date(h.completedAt, { day: 'numeric', month: 'short' })} · {fmt.time(h.completedAt)}</span>
              </div>
              <div className="flex gap-8 flex-wrap mt-8 small dim">
                <span>{h.exercises.length} exercises</span>·
                <span>{h.setsCompleted} sets</span>·
                <span>{h.durationMin} min</span>
                {h.notes && <span style={{ color: 'var(--text-2)' }}>“{h.notes}”</span>}
              </div>
            </div>
          ))}
        </div>
      ))}

      {view === 'calendar' && history.length > 0 && (
        <div className="grid grid-4" style={{ gap: 14 }}>
          {history.map((h) => (
            <div key={h.id} className="card card-pad-sm" style={{ borderColor: 'rgba(255,92,28,0.25)' }}>
              <div className="small dim">{fmt.date(h.completedAt, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
              <div style={{ fontWeight: 700, margin: '4px 0' }}>{h.focus}</div>
              <div className="flex gap-6 flex-wrap small dim">
                <span><Icon name="activity" size={13} style={{ verticalAlign: -2 }} /> {h.setsCompleted} sets</span>
                <span><Icon name="clock" size={13} style={{ verticalAlign: -2 }} /> {h.durationMin} min</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
