/** Machine detail — full coaching guide + alternatives + Add to My Workout. */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { publicApi, memberApi } from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Loader, ErrorBox, Badge } from '../../components/ui/Primitives.jsx';
import MachineArt from '../../components/workout/MachineArt.jsx';

const LEVELS = ['beginner', 'intermediate', 'advanced'];

export default function MachineDetailPage() {
  const { slug } = useParams();
  useTitle('Machine Guide');
  const { user } = useAuth();
  const { push } = useToast();
  const [level, setLevel] = useState('beginner');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const { data, loading, error, refetch } = useApi(() => publicApi.machine(slug), [slug]);
  const machine = data?.machine;

  useTitle(machine ? machine.name : 'Machine Guide');

  const addToMine = async () => {
    if (!user) { push('Please log in to add machines to your workout.', 'info'); return; }
    setAdding(true);
    try {
      await memberApi.addFavorite(machine.id);
      setAdded(true);
      push(`"${machine.name}" added to My Workout.`, 'success');
    } catch (e) { push(e.message, 'error'); }
    finally { setAdding(false); }
  };

  if (loading) return <Loader label="Loading machine guide…" />;
  if (error) return (
    <div className="container section">
      <ErrorBox message={error} onRetry={refetch} />
    </div>
  );

  const ld = machine.levelDetails?.[level] || { sets: 3, reps: '10–12', restSec: 90 };
  const diffTone = machine.difficulty === 'Easy' ? 'green' : machine.difficulty === 'Moderate' ? 'yellow' : 'red';

  return (
    <main>
      <section className="page-banner">
        <div className="container">
          <div className="crumb"><Link to="/">Home</Link> › <Link to="/machines">Machines</Link> › {machine.name}</div>
          <div className="grid" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: 32, alignItems: 'center' }}>
            <div>
              <div className="flex gap-8 flex-wrap" style={{ marginBottom: 12 }}>
                <Badge tone="orange">{machine.muscleGroup}</Badge>
                <Badge tone="gray">{machine.equipmentType}</Badge>
                <Badge tone={diffTone}>{machine.difficulty}</Badge>
                {machine.popular && <Badge tone="blue">★ Popular</Badge>}
              </div>
              <h1 className="h2">{machine.name}</h1>
              <p className="muted" style={{ marginTop: 10, maxWidth: 620 }}>{machine.description}</p>
              <div className="flex gap-8 flex-wrap" style={{ marginTop: 14 }}>
                {machine.targetMuscles.map((t) => <span key={t} className="badge badge-gray">{t}</span>)}
              </div>
              <div className="flex gap-8 mt-24 flex-wrap">
                <button className="btn btn-primary" onClick={addToMine} disabled={adding || added}>
                  <Icon name={added ? 'check' : 'plus'} size={17} />
                  {added ? 'Added to My Workout' : 'Add to My Workout'}
                </button>
                {!user && <Link to="/login" className="btn btn-outline">Login to save</Link>}
              </div>
            </div>
            <MachineArt category={machine.category} label={machine.muscleGroup} />
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          {/* Level tabs */}
          <div className="tabs" role="tablist" aria-label="Fitness level">
            {LEVELS.map((l) => (
              <button key={l} role="tab" aria-selected={level === l} className={`tab ${level === l ? 'active' : ''}`} onClick={() => setLevel(l)}>
                {l[0].toUpperCase() + l.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 22 }}>
            <div className="card">
              <h3 className="mb-16"><Icon name="dumbbell" size={18} style={{ verticalAlign: -4, marginRight: 8, color: 'var(--accent-2)' }} />How to use</h3>
              <p className="small muted" style={{ marginBottom: 14 }}><strong style={{ color: 'var(--text)' }}>Starting position:</strong> {machine.startingPosition}</p>
              <ol className="steps">
                {machine.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
              <div className="divider" />
              <p className="small muted"><strong style={{ color: 'var(--text)' }}>Breathing:</strong> {machine.breathing}</p>
              <p className="small muted mt-8"><strong style={{ color: 'var(--text)' }}>Level guidance:</strong> {ld.note}</p>
            </div>

            <div>
              <div className="card mb-16">
                <h3 className="mb-16"><Icon name="target" size={18} style={{ verticalAlign: -4, marginRight: 8, color: 'var(--accent-2)' }} />Recommended for your level</h3>
                <div className="grid grid-3" style={{ gap: 12 }}>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{ld.sets}</div>
                    <div className="small dim">sets</div>
                  </div>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{ld.reps}</div>
                    <div className="small dim">reps</div>
                  </div>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{ld.restSec}s</div>
                    <div className="small dim">rest</div>
                  </div>
                </div>
                <p className="small dim mt-16">These are general guidelines, not prescriptions — adjust to your ability and always prioritise technique.</p>
              </div>
              {machine.videoUrl && (
                <div className="card mb-16">
                  <h3 className="mb-8">Tutorial</h3>
                  <a href={machine.videoUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"><Icon name="play" size={15} /> Watch video</a>
                </div>
              )}
            </div>
          </div>

          <div className="grid mt-24" style={{ gridTemplateColumns: '1fr 1fr', gap: 22 }}>
            <div className="card" style={{ borderColor: 'rgba(248,113,113,0.3)' }}>
              <h3 className="mb-16" style={{ color: 'var(--red)' }}>⚠ Common mistakes</h3>
              <ol className="steps danger-list">
                {machine.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}
              </ol>
            </div>
            <div className="card" style={{ borderColor: 'rgba(52,211,153,0.3)' }}>
              <h3 className="mb-16" style={{ color: 'var(--green)' }}>🛡 Safety & when to stop</h3>
              <ol className="steps safe-list">
                {machine.safetyTips.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
              <div className="divider" />
              <p className="small muted"><strong style={{ color: 'var(--text)' }}>Stop immediately if you feel:</strong></p>
              <ul className="small muted" style={{ margin: '6px 0 0 18px' }}>
                {machine.whenToStop.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          </div>

          <div className="card mt-24" style={{ background: 'rgba(251,191,36,0.05)', borderColor: 'rgba(251,191,36,0.35)' }}>
            <div className="flex" style={{ gap: 12, alignItems: 'flex-start' }}>
              <Icon name="info" size={20} style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: 2 }} />
              <p className="small" style={{ color: '#fde68a' }}>
                {machine.tip} {machine.difficulty === 'Advanced' && 'This is a technical exercise — learn proper technique from a qualified trainer before performing it independently.'}
              </p>
            </div>
          </div>

          {/* Alternatives */}
          <div className="mt-32">
            <h3 className="mb-16">Machine unavailable? Try these alternatives</h3>
            {data.alternatives.length ? (
              <div className="grid grid-3">
                {data.alternatives.map((a) => (
                  <Link to={`/machines/${a.slug}`} className="card card-pad-sm card-hover" key={a.id}>
                    <div className="flex" style={{ gap: 10 }}>
                      <MachineArt category={a.muscleGroup} className="small-art" />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{a.name}</div>
                        <div className="small dim">{a.muscleGroup} · {a.difficulty}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid grid-3">
                {data.similar.map((a) => (
                  <Link to={`/machines/${a.slug}`} className="card card-pad-sm card-hover" key={a.id}>
                    <div className="flex" style={{ gap: 10 }}>
                      <MachineArt category={a.muscleGroup} className="small-art" />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{a.name}</div>
                        <div className="small dim">{a.muscleGroup} · {a.difficulty}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <p className="small dim mt-32">
            General fitness education only. This guide does not replace a qualified personal trainer, doctor, or physiotherapist.
            If you are new to this exercise, have an injury, or are unsure of your technique, ask a trainer for supervision.
          </p>
        </div>
      </section>
    </main>
  );
}
