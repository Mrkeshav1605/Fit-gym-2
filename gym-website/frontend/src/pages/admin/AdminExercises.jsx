/** Admin exercises — CRUD for the exercise pool used by the workout engine. */
import { useState } from 'react';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { adminApi } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Loader, ErrorBox, EmptyState, Modal, ConfirmDialog } from '../../components/ui/Primitives.jsx';
import { MUSCLE_GROUPS, EQUIPMENT_TYPES, DIFFICULTIES } from '../../utils/labels.js';

const EMPTY = { name: '', muscleGroup: 'Chest', secondaryMuscles: [], equipmentType: 'Machine', difficulty: 'Easy', popular: false, instructions: '', safetyTip: '' };

export default function AdminExercises() {
  useTitle('Exercises — Admin');
  const { push } = useToast();
  const { data, loading, error, refetch } = useApi(adminApi.exercises, []);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit = (e) => { setForm({ ...e, secondaryMuscles: e.secondaryMuscles || [] }); setModal('edit'); };

  const save = async () => {
    if (!form.name.trim()) { push('Exercise name is required.', 'error'); return; }
    setBusy(true);
    try {
      const payload = {
        ...form,
        levelInfo: {
          beginner: { sets: 3, reps: '10–12', restSec: 90 },
          intermediate: { sets: 3, reps: '8–12', restSec: 75 },
          advanced: { sets: 4, reps: '8–10', restSec: 90 },
        },
      };
      if (modal === 'create') await adminApi.createExercise(payload);
      else await adminApi.updateExercise(form.id, payload);
      push(modal === 'create' ? 'Exercise created!' : 'Exercise updated.', 'success');
      setModal(null);
      refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  const toggleArchive = async (ex) => {
    try {
      await adminApi.updateExercise(ex.id, { archived: !ex.archived });
      push(ex.archived ? 'Exercise restored to the pool.' : 'Exercise archived (hidden from plan generation).', 'success');
      refetch();
    } catch (e) { push(e.message, 'error'); }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await adminApi.deleteExercise(deleting.id);
      push('Exercise deleted.', 'success');
      setDeleting(null);
      refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  if (loading) return <Loader label="Loading exercises…" />;
  if (error) return <ErrorBox message={error} onRetry={refetch} />;

  const exercises = data?.exercises || [];

  return (
    <>
      <div className="flex-between mb-16">
        <span className="muted small">{exercises.length} exercises in the plan-generation pool</span>
        <button className="btn btn-primary" onClick={openCreate}><Icon name="plus" size={16} /> Add exercise</button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Name</th><th>Muscle</th><th>Equipment</th><th>Difficulty</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {exercises.map((e) => (
              <tr key={e.id} style={e.archived ? { opacity: 0.5 } : undefined}>
                <td><strong>{e.name}</strong>{e.machineId && <span className="small dim"> · from machine DB</span>}</td>
                <td><span className="badge badge-orange">{e.muscleGroup}</span></td>
                <td className="small">{e.equipmentType}</td>
                <td className="small">{e.difficulty}</td>
                <td>{e.archived ? <span className="badge badge-gray">ARCHIVED</span> : <span className="badge badge-green">ACTIVE</span>}</td>
                <td>
                  <div className="flex gap-6">
                    <button className="btn btn-ghost btn-sm" style={{ padding: '6px 9px' }} onClick={() => openEdit(e)} aria-label="Edit">
                      <Icon name="edit" size={15} />
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '6px 9px' }} onClick={() => toggleArchive(e)} aria-label="Archive/restore">
                      <Icon name={e.archived ? 'refresh' : 'pause'} size={15} />
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '6px 9px', color: 'var(--red)' }} onClick={() => setDeleting(e)} aria-label="Delete">
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {exercises.length === 0 && <EmptyState icon="activity" title="No exercises yet" text="Add exercises to power the workout engine." />}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add exercise' : `Edit — ${form.name}`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save exercise'}</button>
          </>
        }>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Muscle group</label>
            <select className="select" value={form.muscleGroup} onChange={(e) => setForm({ ...form, muscleGroup: e.target.value })}>
              {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Equipment type</label>
            <select className="select" value={form.equipmentType} onChange={(e) => setForm({ ...form, equipmentType: e.target.value })}>
              {EQUIPMENT_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Difficulty</label>
            <select className="select" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label className="label">Instructions</label>
          <textarea className="textarea" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
        </div>
        <div className="field">
          <label className="label">Safety tip</label>
          <input className="input" value={form.safetyTip} onChange={(e) => setForm({ ...form, safetyTip: e.target.value })} />
        </div>
        <label className="check-row">
          <input type="checkbox" checked={!!form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} />
          Prefer this exercise in generated plans
        </label>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDelete} loading={busy}
        title={`Delete ${deleting?.name || 'exercise'}?`} text="This exercise will be removed from the plan-generation pool." />
    </>
  );
}
