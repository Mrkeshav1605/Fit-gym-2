/** Workout Player — full-screen guided session: current exercise, sets,
 *  rest timer, workout stopwatch, finish & save. */
import { useMemo, useState } from 'react';
import { memberApi } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { fmtClock, useCountdown, useStopwatch } from '../../hooks/useApi.js';
import Icon from '../ui/Icon.jsx';

export default function WorkoutPlayer({ day, onFinish, onClose }) {
  const { push } = useToast();
  const exercises = day.exercises || [];

  // state[exerciseIndex] = sets completed
  const [done, setDone] = useState(() => exercises.map(() => 0));
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const stopwatch = useStopwatch();
  const rest = useCountdown(0);

  const currentExercise = exercises[current];
  const totalSets = exercises.reduce((s, e) => s + e.sets, 0);
  const doneSets = done.reduce((a, b) => a + b, 0);

  const startedAt = useMemo(() => Date.now(), []);

  const completeSet = () => {
    if (paused) setPaused(false);
    const ex = currentExercise;
    const newDone = [...done];
    newDone[current] = Math.min(ex.sets, newDone[current] + 1);
    setDone(newDone);

    if (newDone[current] >= ex.sets) {
      // exercise complete → move on or start rest
      if (current < exercises.length - 1) {
        setCurrent(current + 1);
        rest.start(ex.restSec || 75);
      } else {
        finishWorkout();
      }
    } else {
      rest.start(ex.restSec || 75);
    }
  };

  const finishWorkout = async () => {
    if (finished) return;
    setFinished(true);
    setSaving(true);
    stopwatch.pause();
    try {
      const payload = {
        day: day.day,
        durationMin: Math.max(1, Math.round(stopwatch.seconds / 60)),
        notes,
        exercises: exercises.map((e, i) => ({
          exerciseId: e.exerciseId, name: e.name,
          setsDone: done[i], setsTarget: e.sets, reps: parseInt(String(e.reps).split('–')[0]) || 10,
        })),
      };
      const res = await memberApi.complete(payload);
      push(`Workout completed! ${res.history.setsCompleted} sets finished. 🎉`, 'success');
      onFinish?.(res.history);
    } catch (e) {
      push(e.message, 'error');
      setSaving(false);
      setFinished(false);
    }
  };

  const skipRest = () => rest.reset();

  if (saving) {
    return (
      <div className="player-overlay" style={{ placeItems: 'center', display: 'grid' }}>
        <div className="text-center">
          <div className="spinner" style={{ margin: '0 auto 20px' }} />
          <h2>Saving your workout…</h2>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="player-overlay" style={{ placeItems: 'center', display: 'grid' }}>
        <div className="text-center card" style={{ maxWidth: 440, padding: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 10 }}>🎉</div>
          <h1 className="h3">Workout Completed!</h1>
          <div className="grid grid-3 mt-24" style={{ gap: 12 }}>
            <div><div style={{ fontSize: 26, fontWeight: 800 }}>{fmtClock(stopwatch.seconds)}</div><div className="small dim">Duration</div></div>
            <div><div style={{ fontSize: 26, fontWeight: 800 }}>{exercises.length}</div><div className="small dim">Exercises</div></div>
            <div><div style={{ fontSize: 26, fontWeight: 800 }}>{doneSets}</div><div className="small dim">Sets done</div></div>
          </div>
          <button className="btn btn-primary btn-block mt-24" onClick={() => { onFinish?.(); onClose?.(); }}>
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const showRest = rest.remaining > 0;

  return (
    <div className="player-overlay" role="dialog" aria-label="Workout player">
      <div className="player-head">
        <div>
          <div className="small dim">{day.day[0].toUpperCase() + day.day.slice(1)} · {day.focus}</div>
          <strong>Workout in progress</strong>
        </div>
        <div className="flex gap-8">
          <span className="badge badge-orange"><Icon name="timer" size={13} /> {fmtClock(stopwatch.seconds)}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { stopwatch.pause(); setPaused(true); onClose?.(); }}
            aria-label="Pause and exit">
            <Icon name="pause" size={15} /> Pause & exit
          </button>
        </div>
      </div>

      <div className="player-body" style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
        {showRest ? (
          <>
            <div className="text-center">
              <span className="badge badge-yellow">REST</span>
              <div className="player-timer">{fmtClock(rest.remaining)}</div>
              <p className="muted">Next up: <strong style={{ color: 'var(--text)' }}>{currentExercise.name}</strong></p>
              <div className="flex gap-16 mt-16" style={{ justifyContent: 'center' }}>
                <button className="btn btn-outline" onClick={skipRest}>Skip rest <Icon name="chevron-right" size={16} /></button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex-between">
              <div>
                <span className="small dim">Exercise {current + 1} of {exercises.length}</span>
                <h1 style={{ fontSize: 26 }}>{currentExercise.name}</h1>
              </div>
              <span className="badge badge-gray">{currentExercise.muscleGroup}</span>
            </div>

            <div className="flex gap-16 mt-16" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              <span className="badge badge-orange">{currentExercise.sets} sets</span>
              <span className="badge badge-blue">{currentExercise.reps} reps</span>
              <span className="badge badge-gray">Rest {currentExercise.restSec}s</span>
              <span className="badge badge-purple">{currentExercise.equipmentType}</span>
            </div>

            <div className="set-dots">
              {Array.from({ length: currentExercise.sets }).map((_, i) => (
                <div key={i} className={`set-dot ${i < done[current] ? 'done' : i === done[current] ? 'current' : ''}`}>{i + 1}</div>
              ))}
            </div>

            {currentExercise.instructions && (
              <div className="card mb-16" style={{ background: 'var(--bg-2)' }}>
                <p className="small muted">{currentExercise.instructions}</p>
                {currentExercise.safetyTip && (
                  <p className="small mt-8" style={{ color: '#fde68a' }}><Icon name="shield" size={14} style={{ verticalAlign: -2 }} /> {currentExercise.safetyTip}</p>
                )}
              </div>
            )}

            <button className="btn btn-primary btn-lg btn-block" onClick={completeSet}>
              {done[current] === 0 ? 'Start exercise — Complete Set 1' : `Complete Set ${done[current] + 1} of ${currentExercise.sets}`}
            </button>

            <div className="flex-between mt-16">
              <button className="btn btn-ghost btn-sm" disabled={current === 0} onClick={() => setCurrent(Math.max(0, current - 1))}>
                <Icon name="chevron-left" size={15} /> Previous
              </button>
              <div className="flex gap-8">
                <button className="btn btn-ghost btn-sm" onClick={() => { stopwatch.pause(); setPaused(true); }}
                  aria-label="Pause workout">
                  <Icon name="pause" size={15} /> Pause
                </button>
                <button className="btn btn-outline btn-sm" onClick={finishWorkout}>
                  <Icon name="check" size={15} /> Finish workout
                </button>
              </div>
              <button className="btn btn-ghost btn-sm" disabled={current >= exercises.length - 1} onClick={() => setCurrent(Math.min(exercises.length - 1, current + 1))}>
                Next <Icon name="chevron-right" size={15} />
              </button>
            </div>

            {paused && (
              <div className="card mt-16 text-center" style={{ borderColor: 'rgba(255,92,28,0.5)' }}>
                <strong>Workout paused</strong>
                <div className="flex gap-16 mt-8" style={{ justifyContent: 'center' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => { stopwatch.start(); setPaused(false); }}><Icon name="play" size={15} /> Resume</button>
                </div>
              </div>
            )}

            <div className="field mt-24">
              <label className="label" htmlFor="wp-notes">Session notes (optional)</label>
              <textarea id="wp-notes" className="textarea" style={{ minHeight: 70 }} value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='e.g. "Used 10 kg dumbbells today."' />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
