/** Profile — view & update member information and fitness preferences. */
import { useState } from 'react';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { memberApi, fmt } from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { Avatar, Loader, ErrorBox } from '../../components/ui/Primitives.jsx';
import { FITNESS_LEVELS, GOALS, DAY_ORDER, DAY_LABELS, EQUIPMENT_TYPES } from '../../utils/labels.js';
import Icon from '../../components/ui/Icon.jsx';

export default function ProfilePage() {
  useTitle('Profile');
  const { user, updateUser } = useAuth();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '',
    age: user?.age || '', height: user?.height || '',
    fitnessLevel: user?.fitnessLevel || 'beginner', goal: user?.goal || 'general_fitness',
    activityLevel: user?.activityLevel || 'moderate',
    workoutDuration: String(user?.workoutDuration || 60),
    workoutDays: user?.workoutDays || [],
    equipment: user?.equipment || [],
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (key, arr, v) => set(key, arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const save = async () => {
    setBusy(true);
    try {
      const res = await memberApi.updateProfile({
        ...form, age: form.age ? Number(form.age) : null, height: form.height ? Number(form.height) : null,
        workoutDuration: Number(form.workoutDuration),
      });
      updateUser(res.user);
      push('Profile updated!', 'success');
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: '0.9fr 1.1fr', gap: 22 }}>
      {/* Summary card */}
      <div className="card" style={{ alignSelf: 'start' }}>
        <div className="text-center mb-16">
          <div style={{ display: 'grid', placeItems: 'center', marginBottom: 10 }}>
            <Avatar name={user?.name} color={user?.avatarColor} size={72} />
          </div>
          <h3>{user?.name}</h3>
          <p className="small dim">{user?.email}</p>
          <div className="flex gap-8 mt-8" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            <span className="badge badge-orange">{fmt.levelLabel(user?.fitnessLevel)}</span>
            <span className="badge badge-blue">{fmt.goalLabel(user?.goal)}</span>
            <span className="badge badge-gray">{user?.role}</span>
          </div>
        </div>
        <div className="divider" />
        <p className="small muted" style={{ lineHeight: 1.9 }}>
          <strong style={{ color: 'var(--text)' }}>Member since:</strong> {fmt.date(user?.createdAt)}<br />
          <strong style={{ color: 'var(--text)' }}>Age:</strong> {user?.age || '—'}<br />
          <strong style={{ color: 'var(--text)' }}>Height:</strong> {user?.height ? `${user.height} cm` : '—'}<br />
          <strong style={{ color: 'var(--text)' }}>Phone:</strong> {user?.phone || '—'}<br />
          <strong style={{ color: 'var(--text)' }}>Workout duration:</strong> {user?.workoutDuration || 60} min
        </p>
        <div className="card mt-16" style={{ background: 'var(--bg-2)' }}>
          <p className="small dim">
            <Icon name="shield" size={14} style={{ verticalAlign: -2 }} /> Your details are only used to personalise your plan
            and are never shared. Passwords are stored as secure hashes — never as plain text.
          </p>
        </div>
      </div>

      {/* Edit form */}
      <div className="card">
        <h3 className="mb-16">Update your profile</h3>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <div className="field" style={{ margin: 0 }}>
            <label className="label" htmlFor="p-name">Name</label>
            <input id="p-name" className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label" htmlFor="p-phone">Phone</label>
            <input id="p-phone" className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label" htmlFor="p-age">Age</label>
            <input id="p-age" type="number" className="input" value={form.age} onChange={(e) => set('age', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label" htmlFor="p-height">Height (cm)</label>
            <input id="p-height" type="number" className="input" value={form.height} onChange={(e) => set('height', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-3" style={{ gap: 14, marginTop: 14 }}>
          <div className="field" style={{ margin: 0 }}>
            <label className="label" htmlFor="p-level">Fitness level</label>
            <select id="p-level" className="select" value={form.fitnessLevel} onChange={(e) => set('fitnessLevel', e.target.value)}>
              {FITNESS_LEVELS.map((l) => <option key={l} value={l}>{fmt.levelLabel(l)}</option>)}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label" htmlFor="p-goal">Goal</label>
            <select id="p-goal" className="select" value={form.goal} onChange={(e) => set('goal', e.target.value)}>
              {GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label" htmlFor="p-dur">Duration</label>
            <select id="p-dur" className="select" value={form.workoutDuration} onChange={(e) => set('workoutDuration', e.target.value)}>
              <option value="30">30 min</option><option value="45">45 min</option>
              <option value="60">60 min</option><option value="90">90 min</option>
            </select>
          </div>
        </div>

        <div className="field" style={{ marginTop: 14 }}>
          <label className="label">Available days (Sunday is rest)</label>
          <div className="flex flex-wrap gap-8">
            {DAY_ORDER.filter((d) => d !== 'sunday').map((d) => (
              <button type="button" key={d} className={`chip ${form.workoutDays.includes(d) ? 'active' : ''}`}
                onClick={() => toggle('workoutDays', form.workoutDays, d)}>{DAY_LABELS[d].slice(0, 3)}</button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label">Equipment available</label>
          <div className="flex flex-wrap gap-8">
            {EQUIPMENT_TYPES.map((e) => (
              <button type="button" key={e} className={`chip ${form.equipment.includes(e) ? 'active' : ''}`}
                onClick={() => toggle('equipment', form.equipment, e)}>{e}</button>
            ))}
          </div>
        </div>

        <div className="flex gap-8 mt-16">
          <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
          <button className="btn btn-outline" onClick={() => push('Tip: changing your level or goal works best when you also regenerate your plan from My Workout.', 'info')}>
            <Icon name="info" size={16} /> Tip
          </button>
        </div>
      </div>
    </div>
  );
}
