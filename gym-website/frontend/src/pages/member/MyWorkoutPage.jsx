/** My Workout — full weekly plan (Mon–Sat training, Sun rest) + player. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { memberApi } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Loader, ErrorBox, EmptyState, ConfirmDialog } from '../../components/ui/Primitives.jsx';
import WorkoutPlayer from '../../components/workout/WorkoutPlayer.jsx';
import { DAY_LABELS, DAY_ORDER } from '../../utils/labels.js';

export default function MyWorkoutPage() {
  useTitle('My Workout');
  const { push } = useToast();
  const { data, loading, error, refetch } = useApi(memberApi.workout, []);
  const [sessionDay, setSessionDay] = useState(null);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [regenBusy, setRegenBusy] = useState(false);

  const workout = data?.workout;

  if (loading) return <Loader label="Loading your weekly plan…" />;
  if (error) return <ErrorBox message={error} onRetry={refetch} />;

  const regenerate = async () => {
    setRegenBusy(true);
    try {
      await memberApi.regenerate();
      push('Your plan has been regenerated!', 'success');
      setConfirmRegen(false);
      refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setRegenBusy(false); }
  };

  const onSessionClose = () => { setSessionDay(null); refetch(); };

  return (
    <>
      <div className="flex flex-wrap gap-8 mb-24">
        <span className="badge badge-orange">{workout?.name}</span>
        <span className="badge badge-blue">Level: {(workout?.fitnessLevel || 'beginner').replace(/^\w/, (c) => c.toUpperCase())}</span>
        <span className="badge badge-gray">Goal: {workout?.goal?.replace(/_/g, ' ')}</span>
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setConfirmRegen(true)}>
          <Icon name="refresh" size={15} /> Regenerate plan
        </button>
      </div>

      {!workout?.days?.length ? (
        <EmptyState icon="clipboard" title="No workout plan yet" text="Generate your personalised plan to get started.">
          <button className="btn btn-primary" onClick={() => setConfirmRegen(true)}>Generate my plan</button>
        </EmptyState>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          {DAY_ORDER.map((d) => {
            const day = workout.days.find((x) => x.day === d);
            if (!day) return null;
            const isRest = day.rest;
            return (
              <div key={d} className={`day-card ${day.isToday ? 'today' : ''} ${isRest ? 'rest' : ''}`}>
                <div className="day-card-head">
                  <div className="flex gap-8">
                    <span className={`badge ${day.isToday ? 'badge-orange' : 'badge-gray'}`}>{DAY_LABELS[d].slice(0, 3).toUpperCase()}</span>
                    {day.isToday && <span className="badge badge-orange">TODAY</span>}
                    {!isRest && <span className="small dim" style={{ alignSelf: 'center' }}>~{day.estDuration} min</span>}
                  </div>
                  {isRest ? <Icon name="flame" size={16} style={{ color: 'var(--text-3)' }} /> : null}
                </div>
                <div className="day-card-body">
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{day.focus}</div>
                  {isRest ? (
                    <p className="small dim">{d === 'sunday' ? 'Gym holiday — full rest and recovery.' : 'Rest day (you did not select this day).'}</p>
                  ) : (
                    <>
                      {(day.exercises || []).map((e, i) => (
                        <div className="ex-row" key={i}>
                          <span className="ex-index">{i + 1}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>
                              {e.machineSlug ? <Link to={`/machines/${e.machineSlug}`} style={{ color: 'var(--accent-2)' }}>{e.name}</Link> : e.name}
                            </div>
                            <div className="small dim">{e.sets} × {e.reps} · rest {e.restSec}s · {e.equipmentType}</div>
                          </div>
                        </div>
                      ))}
                      <button className="btn btn-primary btn-sm btn-block mt-16" onClick={() => setSessionDay(day)}>
                        <Icon name="play" size={15} /> Start Workout
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="small dim mt-24" style={{ maxWidth: 640 }}>
        <Icon name="shield" size={14} style={{ verticalAlign: -2 }} /> Your plan is generated from your profile — it is general
        guidance, not a medical prescription. If an exercise feels wrong or causes pain, swap it or ask a trainer.
      </p>

      {sessionDay && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110 }}>
          <WorkoutPlayer day={sessionDay} onClose={onSessionClose} onFinish={onSessionClose} />
        </div>
      )}

      <ConfirmDialog
        open={confirmRegen} onClose={() => setConfirmRegen(false)} onConfirm={regenerate} loading={regenBusy}
        title="Regenerate your plan?"
        text="A fresh plan will be generated from your current level, goal, available days and the gym's weekly schedule. Your workout history is never deleted."
        confirmLabel="Regenerate"
      />
    </>
  );
}
