/** Member dashboard home — today's workout, stats, membership, goals, notifications. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { memberApi, fmt } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Loader, ErrorBox, StatCard, EmptyState } from '../../components/ui/Primitives.jsx';
import { DAY_LABELS } from '../../utils/labels.js';
import WorkoutPlayer from '../../components/workout/WorkoutPlayer.jsx';

export default function DashboardHome() {
  useTitle('Dashboard');
  const { push } = useToast();
  const [sessionDay, setSessionDay] = useState(null);

  const workout = useApi(memberApi.workout, []);
  const stats = useApi(memberApi.stats, []);
  const sub = useApi(memberApi.subscription, []);
  const notifs = useApi(memberApi.notifications, []);
  const recommendations = useApi(memberApi.recommendations, []);

  const today = workout.data?.today;
  const todayPlan = workout.data?.workout?.days?.find((d) => d.day === today);
  const loading = workout.loading || stats.loading || sub.loading;

  if (loading) return <Loader label="Loading your dashboard…" />;
  if (workout.error) return <ErrorBox message={workout.error} onRetry={workout.refetch} />;

  const s = stats.data?.stats || {};
  const currentSub = sub.data?.subscription;
  const isActive = currentSub?.status === 'active';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      {/* Greeting + quick status */}
      <div className="grid grid-4" style={{ gap: 16, marginBottom: 24 }}>
        <StatCard icon="flame" label="Current streak" value={`${s.streak || 0} days`} tone="orange" />
        <StatCard icon="chart" label="Workouts this week" value={s.thisWeek || 0} tone="blue" sub={`${s.totalWorkouts || 0} total all-time`} />
        <StatCard icon="calendar" label="Attendance this month" value={`${s.attendance?.attendancePct || 0}%`} tone="green" sub={`${s.attendance?.attendedThisMonth || 0} visits`} />
        <StatCard icon="card" label="Membership" value={isActive ? currentSub.planName : 'None'} tone={isActive ? 'purple' : 'red'} sub={isActive ? `Expires ${fmt.date(currentSub.expiryDate)}` : 'No active membership'} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.6fr 1fr', gap: 22 }}>
        {/* Today's workout */}
        <div className="day-card today">
          <div className="day-card-head">
            <div>
              <div className="small dim">TODAY · {DAY_LABELS[today]}</div>
              <strong style={{ fontSize: 17 }}>{todayPlan?.focus || 'Rest Day / Gym Holiday'}</strong>
            </div>
            {todayPlan && !todayPlan.rest && <span className="badge badge-orange">{todayPlan.exercises.length} exercises · ~{todayPlan.estDuration} min</span>}
          </div>
          <div className="day-card-body">
            {today === 'sunday' || todayPlan?.rest ? (
              <>
                <p className="muted small">Sunday is your rest day — the gym is closed. Sleep well, hydrate, take a walk. Recovery is where strength is built.</p>
                <Link to="/dashboard/workout" className="btn btn-ghost btn-sm mt-16">View full week</Link>
              </>
            ) : (
              <>
                {(todayPlan?.exercises || []).slice(0, 4).map((e, i) => (
                  <div className="ex-row" key={i}>
                    <span className="ex-index">{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{e.name}</div>
                      <div className="small dim">{e.sets} sets × {e.reps} reps · rest {e.restSec}s</div>
                    </div>
                    <span className="badge badge-gray">{e.muscleGroup}</span>
                  </div>
                ))}
                {todayPlan?.exercises?.length > 4 && <p className="small dim mt-8">+ {todayPlan.exercises.length - 4} more exercises…</p>}
                <div className="flex gap-8 mt-16">
                  <button className="btn btn-primary" onClick={() => setSessionDay(todayPlan)}>
                    <Icon name="play" size={17} /> Start Workout
                  </button>
                  <Link to="/dashboard/workout" className="btn btn-outline">Full plan</Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Goals */}
        <div className="card">
          <div className="flex-between mb-16">
            <h3>My goals</h3>
            <Link to="/dashboard/progress" className="small" style={{ color: 'var(--accent-2)' }}>Manage</Link>
          </div>
          {(stats.data?.goals || []).slice(0, 3).map((g) => (
            <div key={g.id} className="mb-16">
              <div className="flex-between small">
                <span style={{ fontWeight: 600 }}>{g.title}</span>
                <span className="dim">{Math.min(g.progress, g.target)} / {g.target} {g.unit}</span>
              </div>
              <div style={{ height: 8, background: 'var(--surface-3)', borderRadius: 99, marginTop: 6, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (g.progress / g.target) * 100)}%`, height: '100%', background: 'var(--grad-accent)', borderRadius: 99, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          ))}
          {!stats.data?.goals?.length && (
            <EmptyState icon="target" title="No goals yet" text="Set a goal like “Complete 4 workouts per week”.">
              <Link to="/dashboard/progress" className="btn btn-outline btn-sm">Create a goal</Link>
            </EmptyState>
          )}
        </div>
      </div>

      <div className="grid mt-24" style={{ gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        {/* Notifications */}
        <div className="card">
          <div className="flex-between mb-16">
            <h3>Notifications</h3>
            <Link to="/dashboard/notifications" className="small" style={{ color: 'var(--accent-2)' }}>All</Link>
          </div>
          {(notifs.data?.notifications || []).slice(0, 4).map((n) => (
            <div key={n.id} className="flex gap-8" style={{ padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
              <Icon name={n.type === 'welcome' ? 'sparkle' : n.type === 'workout' ? 'dumbbell' : n.type === 'membership' ? 'card' : n.type === 'attendance' ? 'calendar' : 'bell'} size={17} className="dim" style={{ flexShrink: 0, marginTop: 3 }} />
              <div style={{ minWidth: 0 }}>
                <div className="small" style={{ fontWeight: 600 }}>{n.title}</div>
                <div className="small dim" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
              </div>
              {!n.read && <span className="badge badge-orange" style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 10 }}>NEW</span>}
            </div>
          ))}
          {!notifs.data?.notifications?.length && <p className="small dim">No notifications. You're all caught up!</p>}
        </div>

        {/* Smart recommendations */}
        <div className="card">
          <div className="flex-between mb-16">
            <h3>Recommended for you</h3>
            <span className="badge badge-blue">Smart picks</span>
          </div>
          {(recommendations.data?.recommendations || []).slice(0, 4).map((m) => (
            <Link key={m.id} to={`/machines/${m.slug}`} className="flex gap-8" style={{ padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
              <Icon name="dumbbell" size={17} className="dim" style={{ flexShrink: 0, marginTop: 3 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="small" style={{ fontWeight: 600 }}>{m.name}</div>
                <div className="small dim">{m.muscleGroup} · {m.difficulty}</div>
              </div>
              <Icon name="chevron-right" size={15} className="dim" />
            </Link>
          ))}
          {!recommendations.data?.recommendations?.length && <p className="small dim">Recommendations appear as you train.</p>}
        </div>
      </div>

      {sessionDay && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110 }}>
          <WorkoutPlayer
            day={sessionDay}
            onClose={() => { setSessionDay(null); workout.refetch(); stats.refetch(); notifs.refetch(); }}
            onFinish={() => { push('Saved to your history!', 'success'); }}
          />
        </div>
      )}
    </>
  );
}
