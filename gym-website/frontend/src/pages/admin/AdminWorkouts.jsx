/** Admin workout plans — create/edit/delete template programmes. */
import { useState } from 'react';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { adminApi, fmt } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Loader, ErrorBox, EmptyState, Modal, ConfirmDialog } from '../../components/ui/Primitives.jsx';
import { DAY_ORDER, DAY_LABELS, MUSCLE_GROUPS } from '../../utils/labels.js';

const EMPTY = {
  name: '', goal: 'general_fitness', fitnessLevel: 'beginner', active: true, popular: false,
  description: '', durationPerDay: 60, daysPerWeek: 5,
  schedule: Object.fromEntries(DAY_ORDER.map((d) => [d, {
    focus: d === 'sunday' ? 'Rest Day / Gym Holiday' : 'Training',
    muscles: d === 'sunday' ? [] : ['Full Body'], mode: d === 'sunday' ? 'rest' : 'strength',
  }])),
};

export default function AdminWorkouts() {
  useTitle('Workout Plans — Admin');
  const { push } = useToast();
  const { data, loading, error, refetch } = useApi(adminApi.plans, []);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit = (p) => { setForm({ ...p, schedule: { ...EMPTY.schedule, ...p.schedule } }); setModal('edit'); };

  const setDay = (day, patch) => setForm({ ...form, schedule: { ...form.schedule, [day]: { ...form.schedule[day], ...patch } } });

  const save = async () => {
    if (!form.name.trim()) { push('Plan name is required.', 'error'); return; }
    setBusy(true);
    try {
      const payload = { ...form, schedule: { ...form.schedule, sunday: { focus: 'Rest Day / Gym Holiday', muscles: [], mode: 'rest', rest: true } } };
      if (modal === 'create') await adminApi.createPlan(payload);
      else await adminApi.updatePlan(form.id, payload);
      push(modal === 'create' ? 'Plan created!' : 'Plan updated.', 'success');
      setModal(null);
      refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await adminApi.deletePlan(deleting.id);
      push('Plan deleted.', 'success');
      setDeleting(null);
      refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  if (loading) return <Loader label="Loading plans…" />;
  if (error) return <ErrorBox message={error} onRetry={refetch} />;

  const plans = data?.plans || [];

  return (
    <>
      <div className="flex-between mb-16">
        <span className="muted small">{plans.length} template programmes</span>
        <button className="btn btn-primary" onClick={openCreate}><Icon name="plus" size={16} /> Create plan</button>
      </div>

      {plans.length === 0 ? (
        <EmptyState icon="clipboard" title="No workout plans yet" text="Create template programmes that members can be assigned." />
      ) : (
        <div className="grid grid-2" style={{ gap: 16 }}>
          {plans.map((p) => (
            <div className="card" key={p.id}>
              <div className="flex-between mb-8">
                <div className="flex gap-8">
                  <strong>{p.name}</strong>
                  {p.popular && <span className="badge badge-orange">POPULAR</span>}
                  {!p.active && <span className="badge badge-gray">INACTIVE</span>}
                </div>
                <div className="flex gap-6">
                  <button className="btn btn-ghost btn-sm" style={{ padding: '6px 9px' }} onClick={() => openEdit(p)} aria-label="Edit plan">
                    <Icon name="edit" size={15} />
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '6px 9px', color: 'var(--red)' }} onClick={() => setDeleting(p)} aria-label="Delete plan">
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </div>
              <div className="flex gap-8 flex-wrap mb-8">
                <span className="badge badge-blue">{fmt.levelLabel(p.fitnessLevel)}</span>
                <span className="badge badge-gray">{fmt.goalLabel(p.goal)}</span>
                <span className="badge badge-gray">{p.daysPerWeek} days/week</span>
              </div>
              <p className="small dim" style={{ marginBottom: 10 }}>{p.description}</p>
              <div className="small dim">
                {Object.entries(p.schedule || {}).map(([d, c]) => (
                  <div key={d} className="flex-between" style={{ padding: '2px 0' }}>
                    <span>{DAY_LABELS[d]}</span>
                    <span style={{ color: 'var(--text-2)' }}>{c.focus}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Create plan' : `Edit — ${form.name}`} wide
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save plan'}</button>
          </>
        }>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Goal</label>
            <select className="select" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}>
              {['general_fitness', 'strength', 'muscle_development', 'endurance', 'mobility', 'weight_management', 'sports_conditioning'].map((g) => (
                <option key={g} value={g}>{fmt.goalLabel(g)}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Fitness level</label>
            <select className="select" value={form.fitnessLevel} onChange={(e) => setForm({ ...form, fitnessLevel: e.target.value })}>
              <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Sessions per week</label>
            <input type="number" min="1" max="6" className="input" value={form.daysPerWeek} onChange={(e) => setForm({ ...form, daysPerWeek: Number(e.target.value) })} />
          </div>
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label className="label">Description</label>
          <textarea className="textarea" style={{ minHeight: 70 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="field">
          <label className="label">Weekly structure (Sunday is always rest — cannot be changed)</label>
          {DAY_ORDER.filter((d) => d !== 'sunday').map((d) => (
            <div key={d} className="grid" style={{ gridTemplateColumns: '90px 1.4fr 1fr', gap: 10, marginBottom: 8 }}>
              <span className="small" style={{ alignSelf: 'center', fontWeight: 700 }}>{DAY_LABELS[d].slice(0, 3)}</span>
              <input className="input" style={{ padding: '8px 10px' }} value={form.schedule[d]?.focus || ''}
                onChange={(e) => setDay(d, { focus: e.target.value })} aria-label={`${DAY_LABELS[d]} focus`} />
              <select className="select" style={{ padding: '8px 10px' }} value={form.schedule[d]?.mode || 'strength'}
                onChange={(e) => setDay(d, { mode: e.target.value, muscles: e.target.value === 'cardio' ? ['Cardio'] : form.schedule[d]?.muscles || [] })}>
                <option value="strength">Strength day</option>
                <option value="cardio">Cardio day</option>
                <option value="rest">Rest (skip)</option>
              </select>
            </div>
          ))}
          <div className="grid" style={{ gridTemplateColumns: '90px 1fr', gap: 10, opacity: 0.7 }}>
            <span className="small" style={{ alignSelf: 'center', fontWeight: 700 }}>Sun</span>
            <input className="input" style={{ padding: '8px 10px' }} value="Rest Day / Gym Holiday" disabled />
          </div>
        </div>
        <div className="flex gap-16" style={{ flexWrap: 'wrap' }}>
          <label className="check-row"><input type="checkbox" checked={!!form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
          <label className="check-row"><input type="checkbox" checked={!!form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} /> Popular</label>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDelete} loading={busy}
        title={`Delete ${deleting?.name || 'plan'}?`} text="The template programme will be removed. Existing member plans are not affected." />
    </>
  );
}
