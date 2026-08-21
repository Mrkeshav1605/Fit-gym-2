/** Progress — charts (frequency, volume, muscle split), goals, heatmap. */
import { useState } from 'react';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { memberApi } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Loader, ErrorBox, EmptyState, Modal, ConfirmDialog } from '../../components/ui/Primitives.jsx';
import { BarChart, LineChart, DonutChart, Heatmap, ProgressRing, EmptyChart } from '../../components/charts/Charts.jsx';

export default function ProgressPage() {
  useTitle('Progress');
  const { push } = useToast();
  const { data, loading, error, refetch } = useApi(memberApi.stats, []);
  const [goalModal, setGoalModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [goalForm, setGoalForm] = useState({ title: '', type: 'workouts_per_week', target: 4, unit: 'workouts' });
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <Loader label="Crunching your numbers…" />;
  if (error) return <ErrorBox message={error} onRetry={refetch} />;

  const s = data?.stats || {};
  const goals = data?.goals || [];

  const openCreate = () => { setEditing(null); setGoalForm({ title: '', type: 'workouts_per_week', target: 4, unit: 'workouts' }); setGoalModal(true); };
  const openEdit = (g) => { setEditing(g); setGoalForm({ title: g.title, type: g.type, target: g.target, unit: g.unit }); setGoalModal(true); };

  const saveGoal = async () => {
    if (goalForm.title.trim().length < 3) { push('Please give your goal a title.', 'error'); return; }
    setBusy(true);
    try {
      if (editing) await memberApi.updateGoal(editing.id, goalForm);
      else await memberApi.createGoal(goalForm);
      push(editing ? 'Goal updated.' : 'Goal created!', 'success');
      setGoalModal(false);
      refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  const bumpGoal = async (g, delta) => {
    if (g.type !== 'custom') return;
    try { await memberApi.updateGoal(g.id, { current: Math.max(0, (g.current || 0) + delta) }); refetch(); }
    catch (e) { push(e.message, 'error'); }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try { await memberApi.deleteGoal(deleting.id); push('Goal deleted.', 'success'); setDeleting(null); refetch(); }
    catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  const hasHistory = s.totalWorkouts > 0;

  return (
    <>
      {/* Consistency focus */}
      <div className="grid grid-4" style={{ gap: 16, marginBottom: 24 }}>
        <div className="card"><ProgressRing value={s.thisWeek || 0} max={4} label="workouts/week" size={84} /></div>
        <div className="card">
          <div className="stat-value" style={{ fontSize: 22 }}>{s.streak || 0} <span className="small muted">days</span></div>
          <div className="stat-name">Current streak</div>
          <div className="small dim mt-8">Best: {s.bestStreak || 0} days</div>
        </div>
        <div className="card">
          <div className="stat-value" style={{ fontSize: 22 }}>{s.totalSets || 0}</div>
          <div className="stat-name">Total sets completed</div>
        </div>
        <div className="card">
          <div className="stat-value" style={{ fontSize: 22 }}>{s.avgDurationMin || 0} <span className="small muted">min</span></div>
          <div className="stat-name">Average session</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid mt-24" style={{ gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        <div className="chart-card">
          <h3 className="chart-title">Workout frequency — last 8 weeks</h3>
          {hasHistory ? <BarChart data={s.weekly} /> : <EmptyChart />}
        </div>
        <div className="chart-card">
          <h3 className="chart-title">Training volume — last sessions</h3>
          {hasHistory ? <LineChart data={s.volumeTrend} unit=" vol" /> : <EmptyChart />}
        </div>
      </div>
      <div className="grid mt-24" style={{ gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        <div className="chart-card">
          <h3 className="chart-title">Where your training goes</h3>
          {s.muscleSplit?.length ? <DonutChart data={s.muscleSplit} /> : <EmptyChart />}
        </div>
        <div className="chart-card">
          <h3 className="chart-title">Activity heatmap — last 8 weeks</h3>
          <Heatmap weeks={s.heatmap || []} />
          <div className="legend mt-16">
            <span><span className="legend-dot" style={{ background: 'var(--accent)' }} />Present</span>
            <span><span className="legend-dot" style={{ background: 'rgba(255,92,28,0.45)' }} />Workout logged</span>
            <span><span className="legend-dot" style={{ background: 'transparent', border: '1px dashed var(--border-2)' }} />Sunday (closed)</span>
          </div>
        </div>
      </div>

      {/* Goals */}
      <div className="card mt-24">
        <div className="flex-between mb-16">
          <h3>Personal goals</h3>
          <button className="btn btn-primary btn-sm" onClick={openCreate}><Icon name="plus" size={15} /> New goal</button>
        </div>
        {goals.length === 0 && (
          <EmptyState icon="target" title="No goals yet"
            text="Health-focused goals keep you consistent. Try “Complete 4 workouts per week”.">
            <button className="btn btn-outline" onClick={openCreate}>Create your first goal</button>
          </EmptyState>
        )}
        <div className="grid grid-3" style={{ gap: 16 }}>
          {goals.map((g) => (
            <div key={g.id} style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
              <div className="flex-between">
                <strong style={{ fontSize: 14.5 }}>{g.title}</strong>
                <div className="flex gap-6">
                  <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => openEdit(g)} aria-label="Edit goal">
                    <Icon name="edit" size={14} />
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => setDeleting(g)} aria-label="Delete goal">
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
              <div className="small dim mt-8">
                {g.type === 'workouts_per_week' ? 'Auto: workouts this week' : g.type === 'streak' ? 'Auto: current streak' : 'Manual tracking'}
              </div>
              <div className="flex-between mt-8 small">
                <span className="dim">{Math.min(g.progress, g.target)} / {g.target} {g.unit}</span>
                {g.type === 'custom' && (
                  <button className="btn btn-outline btn-sm" style={{ padding: '4px 10px' }} onClick={() => bumpGoal(g, 5)}>+5</button>
                )}
              </div>
              <div style={{ height: 8, background: 'var(--surface-3)', borderRadius: 99, marginTop: 10, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (g.progress / g.target) * 100)}%`, height: '100%', background: 'var(--grad-accent)', borderRadius: 99, transition: 'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={goalModal} onClose={() => setGoalModal(false)} title={editing ? 'Edit goal' : 'New goal'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setGoalModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveGoal} disabled={busy}>{busy ? 'Saving…' : 'Save goal'}</button>
          </>
        }>
        <div className="field">
          <label className="label" htmlFor="g-title">Goal</label>
          <input id="g-title" className="input" value={goalForm.title} placeholder="e.g. Complete 4 workouts per week"
            onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} />
        </div>
        <div className="field">
          <label className="label" htmlFor="g-type">Tracking type</label>
          <select id="g-type" className="select" value={goalForm.type}
            onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value, unit: e.target.value === 'workouts_per_week' ? 'workouts' : e.target.value === 'streak' ? 'days' : goalForm.unit })}>
            <option value="workouts_per_week">Auto — workouts per week</option>
            <option value="streak">Auto — current streak (days)</option>
            <option value="custom">Manual — I update it myself</option>
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="g-target">Target</label>
          <input id="g-target" type="number" min="1" className="input" value={goalForm.target}
            onChange={(e) => setGoalForm({ ...goalForm, target: Number(e.target.value) })} />
        </div>
        {goalForm.type === 'custom' && (
          <div className="field">
            <label className="label" htmlFor="g-unit">Unit (e.g. minutes, sessions)</label>
            <input id="g-unit" className="input" value={goalForm.unit} onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })} />
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDelete} loading={busy}
        title="Delete this goal?" text={`"${deleting?.title}" will be removed.`} confirmLabel="Delete" />
    </>
  );
}
