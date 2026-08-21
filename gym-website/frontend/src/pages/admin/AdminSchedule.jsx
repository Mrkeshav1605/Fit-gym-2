/** Admin weekly schedule — the gym-wide default split used by the engine. */
import { useState } from 'react';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { adminApi } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Loader, ErrorBox } from '../../components/ui/Primitives.jsx';
import { DAY_ORDER, DAY_LABELS, MUSCLE_GROUPS } from '../../utils/labels.js';

export default function AdminSchedule() {
  useTitle('Weekly Schedule — Admin');
  const { push } = useToast();
  const { data, loading, error, refetch } = useApi(adminApi.schedule, []);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <Loader label="Loading schedule…" />;
  if (error) return <ErrorBox message={error} onRetry={refetch} />;

  const schedule = form || data?.schedule || {};

  const setDay = (day, patch) => setForm({ ...(form || data?.schedule || {}), [day]: { ...schedule[day], ...patch } });

  const toggleMuscle = (day, m) => {
    const cur = schedule[day]?.muscles || [];
    setDay(day, { muscles: cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m] });
  };

  const save = async () => {
    setBusy(true);
    try {
      await adminApi.updateSchedule({ ...schedule, sunday: { ...schedule.sunday, focus: 'Rest Day / Gym Holiday', muscles: [], mode: 'rest', rest: true } });
      push('Weekly schedule saved. New plans will follow this structure.', 'success');
      setForm(null);
      refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <>
      <div className="card mb-24" style={{ borderColor: 'rgba(96,165,250,0.35)', background: 'rgba(96,165,250,0.04)' }}>
        <p className="small muted">
          <Icon name="info" size={15} style={{ verticalAlign: -2, color: 'var(--blue)' }} /> This is the gym's default weekly
          structure. The workout engine uses it whenever a member's programme has no structure of its own — and every plan honours
          Sunday as a rest day no matter what. Existing member plans keep their structure until regenerated.
        </p>
      </div>

      {DAY_ORDER.map((day) => {
        const conf = schedule[day] || { focus: '', muscles: [], mode: 'strength' };
        const isSunday = day === 'sunday';
        return (
          <div key={day} className="card mb-16" style={isSunday ? { opacity: 0.75 } : undefined}>
            <div className="grid" style={{ gridTemplateColumns: '110px 1.4fr 1fr', gap: 14, alignItems: 'center' }}>
              <strong>{DAY_LABELS[day]}</strong>
              {isSunday ? (
                <input className="input" value="Rest Day / Gym Holiday" disabled aria-label="Sunday is rest day" />
              ) : (
                <input className="input" value={conf.focus || ''} placeholder="e.g. Chest + Triceps"
                  onChange={(e) => setDay(day, { focus: e.target.value })} aria-label={`${DAY_LABELS[day]} focus`} />
              )}
              {isSunday ? (
                <span className="badge badge-red" style={{ justifySelf: 'start' }}>CLOSED / HOLIDAY</span>
              ) : (
                <select className="select" value={conf.mode || 'strength'} onChange={(e) => setDay(day, { mode: e.target.value, muscles: e.target.value === 'cardio' ? ['Cardio'] : conf.muscles })}>
                  <option value="strength">Strength day</option>
                  <option value="cardio">Cardio day</option>
                </select>
              )}
            </div>
            {!isSunday && conf.mode !== 'cardio' && (
              <div className="flex gap-8 flex-wrap mt-16">
                {MUSCLE_GROUPS.filter((m) => m !== 'Cardio').map((m) => (
                  <button key={m} className={`chip ${(conf.muscles || []).includes(m) ? 'active' : ''}`} onClick={() => toggleMuscle(day, m)}>
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex gap-8">
        <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save schedule'}</button>
        {form && <button className="btn btn-ghost" onClick={() => setForm(null)}>Discard changes</button>}
      </div>
    </>
  );
}
