/** Admin dashboard — totals, charts, recent registrations, expiry alerts. */
import { Link } from 'react-router-dom';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { adminApi, fmt } from '../../services/api.js';
import { Loader, ErrorBox, StatCard, Avatar } from '../../components/ui/Primitives.jsx';
import { BarChart, EmptyChart } from '../../components/charts/Charts.jsx';

export default function AdminDashboard() {
  useTitle('Admin Dashboard');
  const { data, loading, error, refetch } = useApi(adminApi.stats, []);

  if (loading) return <Loader label="Loading gym analytics…" />;
  if (error) return <ErrorBox message={error} onRetry={refetch} />;

  const t = data.totals;

  return (
    <>
      <div className="grid grid-4" style={{ gap: 16, marginBottom: 24 }}>
        <StatCard icon="users" label="Total members" value={t.members} tone="blue" />
        <StatCard icon="card" label="Active memberships" value={t.activeSubscriptions} tone="green" sub={`${t.expiredSubscriptions} expired · ${t.pendingSubscriptions} pending`} />
        <StatCard icon="calendar" label="Today's attendance" value={t.todayAttendance} tone="orange" />
        <StatCard icon="dumbbell" label="Workouts this month" value={t.workoutsThisMonth} tone="purple" sub={`${fmt.money(t.revenuePlaceholder)} active-plan revenue (demo)`} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', gap: 22 }}>
        <div className="chart-card">
          <h3 className="chart-title">Workout completions — last 8 weeks</h3>
          {data.weekly.some((w) => w.value > 0) ? <BarChart data={data.weekly} /> : <EmptyChart />}
        </div>

        <div className="card">
          <h3 className="mb-16">Memberships expiring soon</h3>
          {data.expiringSoon.length === 0 ? (
            <p className="small dim">No memberships expire in the next 14 days. 🎉</p>
          ) : (
            data.expiringSoon.map((s) => (
              <div key={s.id} className="flex-between" style={{ padding: '9px 0', borderBottom: '1px dashed var(--border)' }}>
                <div className="flex gap-8">
                  <Avatar name={s.member} color="#60a5fa" size={30} />
                  <div>
                    <div className="small" style={{ fontWeight: 700 }}>{s.member}</div>
                    <div className="small dim">{s.planName}</div>
                  </div>
                </div>
                <span className="badge badge-yellow">{fmt.date(s.expiryDate)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid mt-24" style={{ gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        <div className="card">
          <h3 className="mb-16">Recent registrations</h3>
          {data.recentRegistrations.map((m) => (
            <div key={m.id} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
              <div className="flex gap-8">
                <Avatar name={m.name} color={m.avatarColor} size={30} />
                <div>
                  <div className="small" style={{ fontWeight: 700 }}>{m.name}</div>
                  <div className="small dim">{m.email}</div>
                </div>
              </div>
              <Link to={`/admin/members?open=${m.id}`} className="small" style={{ color: 'var(--accent-2)' }}>View</Link>
            </div>
          ))}
        </div>

        <div className="grid" style={{ gap: 22, alignContent: 'start' }}>
          <div className="card">
            <h3 className="mb-16">Popular workouts</h3>
            {data.popularWorkouts.map((w, i) => (
              <div key={i} className="flex-between small" style={{ padding: '6px 0', borderBottom: '1px dashed var(--border)' }}>
                <span style={{ fontWeight: 600 }}>{w.label}</span>
                <span className="badge badge-orange">{w.value} sessions</span>
              </div>
            ))}
            {!data.popularWorkouts.length && <p className="small dim">No workout data yet.</p>}
          </div>
          <div className="card">
            <h3 className="mb-16">Most saved machines</h3>
            {data.machineUsage.map((m, i) => (
              <div key={i} className="flex-between small" style={{ padding: '6px 0', borderBottom: '1px dashed var(--border)' }}>
                <span style={{ fontWeight: 600 }}>{m.label}</span>
                <span className="badge badge-blue">{m.value} saves</span>
              </div>
            ))}
            {!data.machineUsage.length && <p className="small dim">No machine saves yet.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
