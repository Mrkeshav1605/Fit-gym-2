/** Admin machines — full CRUD for the machine database. */
import { useState } from 'react';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { adminApi } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Loader, ErrorBox, EmptyState, Modal, ConfirmDialog } from '../../components/ui/Primitives.jsx';
import MachineArt from '../../components/workout/MachineArt.jsx';
import { MUSCLE_GROUPS, EQUIPMENT_TYPES, DIFFICULTIES } from '../../utils/labels.js';

const EMPTY = {
  name: '', category: 'Chest', muscleGroup: 'Chest', targetMuscles: [], equipmentType: 'Machine',
  difficulty: 'Easy', popular: false, description: '', startingPosition: '',
  steps: [], breathing: '', commonMistakes: [], safetyTips: [], whenToStop: [], alternatives: [], tip: '', videoUrl: '',
};

export default function AdminMachines() {
  useTitle('Machines — Admin');
  const { push } = useToast();
  const list = useApi(() => fetch('/api/machines').then((r) => r.json()), []);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit = (m) => {
    setForm({
      ...m,
      targetMuscles: m.targetMuscles || [], steps: m.steps || [], commonMistakes: m.commonMistakes || [],
      safetyTips: m.safetyTips || [], whenToStop: m.whenToStop || [], alternatives: m.alternatives || [],
      videoUrl: m.videoUrl || '',
    });
    setModal('edit');
  };

  const setArr = (key, value) => setForm({ ...form, [key]: value.split('\n').map((s) => s.trim()).filter(Boolean) });
  const setArrComma = (key, value) => setForm({ ...form, [key]: value.split(',').map((s) => s.trim()).filter(Boolean) });

  const save = async () => {
    if (!form.name.trim()) { push('Machine name is required.', 'error'); return; }
    setBusy(true);
    try {
      const payload = {
        ...form,
        levelDetails: {
          beginner: { sets: 3, reps: '10–12', restSec: 90, note: 'Start light and master the movement.' },
          intermediate: { sets: 3, reps: '8–12', restSec: 90, note: 'Progress gradually.' },
          advanced: { sets: 4, reps: '8–10', restSec: 90, note: 'Prioritise technique.' },
        },
      };
      if (modal === 'create') await adminApi.createMachine(payload);
      else await adminApi.updateMachine(form.id, payload);
      push(modal === 'create' ? 'Machine created!' : 'Machine updated.', 'success');
      setModal(null);
      list.refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await adminApi.deleteMachine(deleting.id);
      push('Machine deleted.', 'success');
      setDeleting(null);
      list.refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  if (list.loading) return <Loader label="Loading machines…" />;
  if (list.error) return <ErrorBox message={list.error} onRetry={list.refetch} />;

  const machinesList = list.data?.machines || [];

  return (
    <>
      <div className="flex-between mb-16">
        <span className="muted small">{machinesList.length} machines in the database</span>
        <button className="btn btn-primary" onClick={openCreate}><Icon name="plus" size={16} /> Add machine</button>
      </div>

      {machinesList.length === 0 ? (
        <EmptyState icon="dumbbell" title="No machines found" text="Add your first machine to build the guide library." />
      ) : (
        <div className="grid grid-4" style={{ gap: 16 }}>
          {machinesList.map((m) => (
            <div className="card card-pad-sm" key={m.id}>
              <MachineArt category={m.category} label={m.muscleGroup} />
              <div style={{ fontWeight: 700, margin: '10px 0 4px' }}>{m.name}</div>
              <div className="flex gap-6 flex-wrap mb-8">
                <span className="badge badge-orange">{m.muscleGroup}</span>
                <span className="badge badge-gray">{m.difficulty}</span>
              </div>
              <div className="flex gap-6">
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => openEdit(m)}>
                  <Icon name="edit" size={14} /> Edit
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => setDeleting(m)} aria-label="Delete machine">
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add machine' : `Edit — ${form.name}`} wide
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save machine'}</button>
          </>
        }>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Category</label>
            <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, muscleGroup: e.target.value })}>
              {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
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
              {EQUIPMENT_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Difficulty</label>
            <select className="select" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Target muscles (comma separated)</label>
            <input className="input" value={(form.targetMuscles || []).join(', ')} onChange={(e) => setArrComma('targetMuscles', e.target.value)} />
          </div>
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label className="label">Short description</label>
          <textarea className="textarea" style={{ minHeight: 70 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="field">
          <label className="label">Starting position</label>
          <input className="input" value={form.startingPosition} onChange={(e) => setForm({ ...form, startingPosition: e.target.value })} />
        </div>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Steps (one per line)</label>
            <textarea className="textarea" value={(form.steps || []).join('\n')} onChange={(e) => setArr('steps', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Breathing guidance</label>
            <textarea className="textarea" style={{ minHeight: 60 }} value={form.breathing} onChange={(e) => setForm({ ...form, breathing: e.target.value })} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Common mistakes (one per line)</label>
            <textarea className="textarea" value={(form.commonMistakes || []).join('\n')} onChange={(e) => setArr('commonMistakes', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Safety tips (one per line)</label>
            <textarea className="textarea" value={(form.safetyTips || []).join('\n')} onChange={(e) => setArr('safetyTips', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">When to stop (one per line)</label>
            <textarea className="textarea" value={(form.whenToStop || []).join('\n')} onChange={(e) => setArr('whenToStop', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Alternatives (one per line)</label>
            <textarea className="textarea" value={(form.alternatives || []).join('\n')} onChange={(e) => setArr('alternatives', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-2" style={{ gap: 14, marginTop: 14 }}>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Trainer tip</label>
            <input className="input" value={form.tip} onChange={(e) => setForm({ ...form, tip: e.target.value })} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Video URL (optional)</label>
            <input className="input" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
          </div>
        </div>
        <label className="check-row mt-16">
          <input type="checkbox" checked={!!form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} />
          Mark as popular (featured on the home page)
        </label>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDelete} loading={busy}
        title={`Delete ${deleting?.name || 'machine'}?`}
        text="The machine guide will be removed from the public site and member favorites." />
    </>
  );
}
