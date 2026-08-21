/** Programs — the training programme catalogue with weekly structures. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi, useReveal, useTitle } from '../../hooks/useApi.js';
import { publicApi, fmt } from '../../services/api.js';
import Icon from '../../components/ui/Icon.jsx';
import { PageBanner, Loader, ErrorBox, EmptyState } from '../../components/ui/Primitives.jsx';
import { DAY_SHORT } from '../../utils/labels.js';

const GOAL_ORDER = { strength: 0, muscle_development: 1, general_fitness: 2, weight_management: 3, endurance: 4, mobility: 5 };

export default function ProgramsPage() {
  useTitle('Programs');
  useReveal();
  const { data, loading, error, refetch } = useApi(publicApi.plans, []);
  const [level, setLevel] = useState('');
  const [goal, setGoal] = useState('');

  const plans = (data?.plans || [])
    .filter((p) => (level ? p.fitnessLevel === level : true))
    .filter((p) => (goal ? p.goal === goal : true));

  const levels = [...new Set((data?.plans || []).map((p) => p.fitnessLevel))];
  const goals = [...new Set((data?.plans || []).map((p) => p.goal))].sort((a, b) => (GOAL_ORDER[a] ?? 9) - (GOAL_ORDER[b] ?? 9));

  return (
    <main>
      <PageBanner crumb={<Link to="/">Home</Link>} title="Training Programs"
        sub="Structured programmes for every goal and level. Pick one at registration — or let the smart engine match you." />

      <section className="section-tight">
        <div className="container">
          <div className="flex flex-wrap gap-8 mb-24">
            <button className={`chip ${!level ? 'active' : ''}`} onClick={() => setLevel('')}>All levels</button>
            {levels.map((l) => (
              <button key={l} className={`chip ${level === l ? 'active' : ''}`} onClick={() => setLevel(l)}>
                {fmt.levelLabel(l)}
              </button>
            ))}
            <span style={{ width: 1, height: 26, background: 'var(--border)' }} />
            <button className={`chip ${!goal ? 'active' : ''}`} onClick={() => setGoal('')}>All goals</button>
            {goals.map((g) => (
              <button key={g} className={`chip ${goal === g ? 'active' : ''}`} onClick={() => setGoal(g)}>
                {fmt.goalLabel(g)}
              </button>
            ))}
          </div>

          {loading && <Loader />}
          {error && <ErrorBox message={error} onRetry={refetch} />}
          {!loading && !error && plans.length === 0 && (
            <EmptyState icon="clipboard" title="No programmes found" text="Try a different level or goal filter." />
          )}
          {!loading && plans.map((p) => (
            <div className="card card-hover reveal mb-16" key={p.id}>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1.6fr', gap: 28 }}>
                <div>
                  <div className="flex gap-8 flex-wrap">
                    <span className="badge badge-orange">{fmt.levelLabel(p.fitnessLevel)}</span>
                    <span className="badge badge-blue">{fmt.goalLabel(p.goal)}</span>
                    <span className="badge badge-gray">{p.daysPerWeek} days / week</span>
                  </div>
                  <h3 style={{ fontSize: 22, margin: '12px 0 8px' }}>{p.name}</h3>
                  <p className="muted small">{p.description}</p>
                  <div className="flex gap-8 mt-16" style={{ flexWrap: 'wrap' }}>
                    <span className="small dim"><Icon name="clock" size={14} /> {p.durationPerDay} min sessions</span>
                  </div>
                </div>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {p.weekDays.map((d) => (
                    <div key={d.day} style={{
                      border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px',
                      background: d.rest || d.mode === 'rest' ? 'var(--bg-2)' : 'var(--surface)',
                      opacity: d.rest || d.mode === 'rest' ? 0.75 : 1,
                    }}>
                      <div className="small dim" style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.08em' }}>
                        {DAY_SHORT[d.day]}{d.rest || d.mode === 'rest' ? ' · REST' : ''}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{d.focus}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="container" style={{ paddingBottom: 60 }}>
        <div className="card text-center" style={{ padding: 40 }}>
          <h3 style={{ marginBottom: 8 }}>Not sure which programme fits you?</h3>
          <p className="muted small" style={{ marginBottom: 18 }}>Answer a few questions at registration and the smart engine will build your plan automatically.</p>
          <Link to="/register" className="btn btn-primary">Build my plan <Icon name="arrow-right" size={17} /></Link>
        </div>
      </div>
    </main>
  );
}
