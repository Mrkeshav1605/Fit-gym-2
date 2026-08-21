/** Register — 3 steps: account → fitness profile → preferences.
 *  On submit, the backend generates the personalised weekly plan. */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useTitle } from '../../hooks/useApi.js';
import Icon from '../../components/ui/Icon.jsx';
import { FITNESS_LEVELS, GOALS, DAY_ORDER, DAY_LABELS, EQUIPMENT_TYPES } from '../../utils/labels.js';
import { fmt } from '../../services/api.js';

const STEPS = ['Account', 'Fitness Profile', 'Preferences'];

export default function RegisterPage() {
  useTitle('Join Now');
  const { register } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    age: '', height: '', fitnessLevel: 'beginner', goal: 'general_fitness',
    activityLevel: 'moderate', workoutDuration: '60',
    workoutDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    equipment: ['Machine', 'Dumbbell', 'Cable', 'Cardio', 'Bodyweight'],
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleDay = (d) => set('workoutDays',
    form.workoutDays.includes(d) ? form.workoutDays.filter((x) => x !== d) : [...form.workoutDays, d]);
  const toggleEq = (e) => set('equipment',
    form.equipment.includes(e) ? form.equipment.filter((x) => x !== e) : [...form.equipment, e]);

  const validateStep = () => {
    const errs = {};
    if (step === 0) {
      if (form.name.trim().length < 2) errs.name = 'Please enter your full name.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) errs.email = 'Please enter a valid email address.';
      if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    }
    if (step === 1) {
      if (form.age && (Number(form.age) < 10 || Number(form.age) > 100)) errs.age = 'Age must be between 10 and 100.';
      if (form.height && (Number(form.height) < 100 || Number(form.height) > 250)) errs.height = 'Height must be between 100 and 250 cm.';
      if (!form.workoutDays.length) errs.workoutDays = 'Pick at least one training day.';
    }
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const submit = async () => {
    setBusy(true);
    setErrors({});
    try {
      await register({
        ...form,
        age: form.age ? Number(form.age) : null,
        height: form.height ? Number(form.height) : null,
        phone: form.phone || undefined,
      });
      push('Account created! Your personalised weekly plan is ready. 💪', 'success');
      navigate('/dashboard');
    } catch (e) {
      setErrors({ global: e.message });
      setBusy(false);
    }
  };

  const next = () => { if (validateStep()) setStep(step + 1); };

  return (
    <main>
      <div className="container">
        <div className="auth-card" style={{ maxWidth: 560 }}>
          <div className="card">
            <div className="text-center mb-16">
              <h1 className="h3">Join IronPulse</h1>
              <p className="small muted">Create your account — your smart workout plan is generated instantly.</p>
            </div>

            {/* Stepper */}
            <div className="flex mb-24" style={{ justifyContent: 'center', gap: 0 }}>
              {STEPS.map((s, i) => (
                <div key={s} className="flex gap-8" style={{ alignItems: 'center' }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center',
                    fontSize: 13, fontWeight: 800,
                    background: i <= step ? 'var(--grad-accent)' : 'var(--surface-3)',
                    color: i <= step ? '#14100c' : 'var(--text-3)',
                  }}>{i + 1}</div>
                  <span className={`small ${i === step ? '' : 'dim'}`} style={{ fontWeight: 700 }}>{s}</span>
                  {i < 2 && <span style={{ width: 26, height: 1, background: 'var(--border-2)', margin: '0 8px' }} />}
                </div>
              ))}
            </div>

            {errors.global && (
              <div className="notif mb-16" style={{ borderColor: 'rgba(248,113,113,0.4)', background: 'var(--red-soft)' }}>
                <Icon name="warning" size={18} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 2 }} />
                <span className="small" style={{ color: 'var(--red)' }}>{errors.global}</span>
              </div>
            )}

            {/* STEP 1 — account */}
            {step === 0 && (
              <>
                <div className="field">
                  <label className="label" htmlFor="r-name">Full name *</label>
                  <input id="r-name" className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Your name" autoComplete="name" />
                  {errors.name && <p className="form-error">{errors.name}</p>}
                </div>
                <div className="grid grid-2" style={{ gap: 14 }}>
                  <div className="field" style={{ margin: 0 }}>
                    <label className="label" htmlFor="r-email">Email *</label>
                    <input id="r-email" type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" autoComplete="email" />
                    {errors.email && <p className="form-error">{errors.email}</p>}
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label className="label" htmlFor="r-phone">Phone (optional)</label>
                    <input id="r-phone" className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 …" />
                  </div>
                </div>
                <div className="field" style={{ marginTop: 14 }}>
                  <label className="label" htmlFor="r-pass">Password *</label>
                  <input id="r-pass" type="password" className="input" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
                  {errors.password && <p className="form-error">{errors.password}</p>}
                </div>
              </>
            )}

            {/* STEP 2 — fitness profile */}
            {step === 1 && (
              <>
                <div className="field">
                  <label className="label">Fitness level *</label>
                  <div className="grid grid-3" style={{ gap: 10 }}>
                    {FITNESS_LEVELS.map((l) => (
                      <button type="button" key={l}
                        className={`chip ${form.fitnessLevel === l ? 'active' : ''}`}
                        style={{ justifyContent: 'center', padding: '12px 8px', textTransform: 'capitalize' }}
                        onClick={() => set('fitnessLevel', l)}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label className="label" htmlFor="r-goal">Workout goal *</label>
                  <select id="r-goal" className="select" value={form.goal} onChange={(e) => set('goal', e.target.value)}>
                    {GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-2" style={{ gap: 14 }}>
                  <div className="field" style={{ margin: 0 }}>
                    <label className="label" htmlFor="r-age">Age</label>
                    <input id="r-age" type="number" className="input" value={form.age} onChange={(e) => set('age', e.target.value)} placeholder="e.g. 24" min="10" max="100" />
                    {errors.age && <p className="form-error">{errors.age}</p>}
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label className="label" htmlFor="r-height">Height (cm)</label>
                    <input id="r-height" type="number" className="input" value={form.height} onChange={(e) => set('height', e.target.value)} placeholder="e.g. 172" min="100" max="250" />
                    {errors.height && <p className="form-error">{errors.height}</p>}
                  </div>
                </div>
                <div className="field" style={{ marginTop: 14 }}>
                  <label className="label" htmlFor="r-activity">General activity level</label>
                  <select id="r-activity" className="select" value={form.activityLevel} onChange={(e) => set('activityLevel', e.target.value)}>
                    <option value="low">Low — mostly sitting</option>
                    <option value="moderate">Moderate — some daily movement</option>
                    <option value="high">High — active job or sports</option>
                  </select>
                </div>
              </>
            )}

            {/* STEP 3 — preferences */}
            {step === 2 && (
              <>
                <div className="field">
                  <label className="label">Available workout days * (Sunday is always rest)</label>
                  <div className="flex flex-wrap gap-8">
                    {DAY_ORDER.filter((d) => d !== 'sunday').map((d) => (
                      <button type="button" key={d} className={`chip ${form.workoutDays.includes(d) ? 'active' : ''}`}
                        onClick={() => toggleDay(d)}>
                        {DAY_LABELS[d].slice(0, 3)}
                      </button>
                    ))}
                  </div>
                  {errors.workoutDays && <p className="form-error">{errors.workoutDays}</p>}
                </div>
                <div className="field">
                  <label className="label" htmlFor="r-dur">Preferred workout duration</label>
                  <select id="r-dur" className="select" value={form.workoutDuration} onChange={(e) => set('workoutDuration', e.target.value)}>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label">Equipment you can use</label>
                  <div className="flex flex-wrap gap-8">
                    {EQUIPMENT_TYPES.map((e) => (
                      <button type="button" key={e} className={`chip ${form.equipment.includes(e) ? 'active' : ''}`}
                        onClick={() => toggleEq(e)}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="small dim">
                  <Icon name="shield" size={14} style={{ verticalAlign: -2 }} /> Your plan is generated from these answers.
                  You can change everything later from your profile. We never push crash diets or extreme training.
                </p>
              </>
            )}

            <div className="flex-between mt-24">
              {step > 0
                ? <button className="btn btn-ghost" onClick={() => setStep(step - 1)} disabled={busy}><Icon name="chevron-left" size={17} /> Back</button>
                : <Link to="/login" className="btn btn-ghost">I have an account</Link>}
              {step < 2
                ? <button className="btn btn-primary" onClick={next}>Continue <Icon name="arrow-right" size={17} /></button>
                : <button className="btn btn-primary btn-lg" onClick={submit} disabled={busy}>
                  {busy ? 'Creating your plan…' : 'Create my account & plan'}
                </button>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
