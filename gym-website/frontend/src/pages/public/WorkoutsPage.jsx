/** Workouts — the default weekly split + how personalisation works. */
import { Link } from 'react-router-dom';
import { useApi, useReveal, useTitle } from '../../hooks/useApi.js';
import { publicApi } from '../../services/api.js';
import Icon from '../../components/ui/Icon.jsx';
import { PageBanner, Loader, ErrorBox } from '../../components/ui/Primitives.jsx';
import { DAY_LABELS, DAY_ORDER } from '../../utils/labels.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function WorkoutsPage() {
  useTitle('Workouts');
  useReveal();
  const { user } = useAuth();
  const { data, loading, error, refetch } = useApi(publicApi.settings, []);
  const schedule = data?.settings?.weeklySchedule || {};

  return (
    <main>
      <PageBanner crumb={<Link to="/">Home</Link>} title="Weekly Workout Structure"
        sub="Every member trains on a smart weekly split. This is the gym's default template — your personal plan is generated from your level, goal and available days." />

      <section className="section-tight">
        <div className="container">
          {loading && <Loader />}
          {error && <ErrorBox message={error} onRetry={refetch} />}

          {!loading && !error && (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
              {DAY_ORDER.map((day) => {
                const conf = schedule[day] || { focus: day === 'sunday' ? 'Rest Day / Gym Holiday' : 'Training day', mode: 'strength' };
                const isRest = day === 'sunday' || conf.rest || conf.mode === 'rest';
                return (
                  <div key={day} className={`day-card reveal ${isRest ? 'rest' : ''}`}>
                    <div className="day-card-head">
                      <div className="flex gap-8">
                        <span className="badge badge-gray">{DAY_LABELS[day].slice(0, 3).toUpperCase()}</span>
                        <strong>{isRest ? 'Rest' : 'Training'}</strong>
                      </div>
                      {day === 'sunday' && <Icon name="flame" size={17} style={{ color: 'var(--accent-2)' }} />}
                    </div>
                    <div className="day-card-body">
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{conf.focus}</div>
                      <p className="small dim">
                        {isRest
                          ? 'The gym is closed on Sunday. Recovery, sleep and light movement — that is the plan.'
                          : `${(conf.muscles || []).join(' · ') || 'Full body'} — personalised exercises, sets, reps and rest based on your level.`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-3 mt-32">
            {[
              { icon: 'user', t: 'Level-matched', d: 'Beginner, intermediate and advanced members get different exercises, sets and rest times.' },
              { icon: 'refresh', t: 'Machine unavailable?', d: 'Every machine page lists alternatives — swap any exercise with one tap.' },
              { icon: 'timer', t: 'Timers built in', d: 'The workout player handles rest timers and set tracking automatically.' },
            ].map((f, i) => (
              <div className="card card-hover reveal" key={i}>
                <span className="stat-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent-2)', marginBottom: 12 }}>
                  <Icon name={f.icon} size={20} />
                </span>
                <h3 style={{ fontSize: 16, marginBottom: 6 }}>{f.t}</h3>
                <p className="muted small">{f.d}</p>
              </div>
            ))}
          </div>

          <div className="card mt-32 text-center" style={{ padding: 40 }}>
            <h3 style={{ marginBottom: 8 }}>{user ? 'Your personal plan is ready on your dashboard' : 'Get your personal weekly plan'}</h3>
            <p className="muted small" style={{ marginBottom: 18 }}>
              {user ? 'Open My Workout to see today\u2019s session.' : 'Join IronPulse and the smart engine builds your Monday–Saturday plan instantly. Sunday stays rest.'}
            </p>
            <Link to={user ? '/dashboard/workout' : '/register'} className="btn btn-primary">
              {user ? 'Open My Workout' : 'Join Now'} <Icon name="arrow-right" size={17} />
            </Link>
          </div>

          <p className="small dim text-center mt-24" style={{ maxWidth: 700, marginInline: 'auto' }}>
            The default split is a sensible general structure — it is not medically or universally optimal for every person.
            Your plan adapts to your profile, and our trainers can adjust it further if needed.
          </p>
        </div>
      </section>
    </main>
  );
}
