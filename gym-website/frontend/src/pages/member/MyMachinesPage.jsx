/** My Machines — favorites ("Add to My Workout") list. */
import { Link } from 'react-router-dom';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { memberApi } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { Loader, ErrorBox, EmptyState } from '../../components/ui/Primitives.jsx';
import MachineArt from '../../components/workout/MachineArt.jsx';
import Icon from '../../components/ui/Icon.jsx';

export default function MyMachinesPage() {
  useTitle('My Machines');
  const { push } = useToast();
  const { data, loading, error, refetch } = useApi(memberApi.favorites, []);

  const remove = async (id, name) => {
    try { await memberApi.removeFavorite(id); push(`"${name}" removed from My Workout.`, 'info'); refetch(); }
    catch (e) { push(e.message, 'error'); }
  };

  if (loading) return <Loader label="Loading your machines…" />;
  if (error) return <ErrorBox message={error} onRetry={refetch} />;

  const favorites = data?.favorites || [];

  return (
    <>
      <p className="muted small mb-24">
        Machines you saved with <strong>“Add to My Workout”</strong>. Use them as quick access to your favourite guides —
        and remember: if a machine is busy, every guide lists safe alternatives.
      </p>
      {favorites.length === 0 ? (
        <EmptyState icon="dumbbell" title="No machines saved yet"
          text='Open any machine page and press "Add to My Workout" to save it here.'>
          <Link to="/machines" className="btn btn-primary">Browse machines</Link>
        </EmptyState>
      ) : (
        <div className="grid grid-auto">
          {favorites.map((m) => (
            <div className="card card-pad-sm" key={m.id}>
              <Link to={`/machines/${m.slug}`}>
                <MachineArt category={m.category} label={m.muscleGroup} />
                <h3 style={{ fontSize: 16, margin: '12px 0 4px' }}>{m.name}</h3>
                <div className="flex gap-6 flex-wrap">
                  <span className="badge badge-orange">{m.muscleGroup}</span>
                  <span className="badge badge-gray">{m.difficulty}</span>
                </div>
              </Link>
              <button className="btn btn-ghost btn-sm btn-block mt-16" onClick={() => remove(m.id, m.name)}>
                <Icon name="trash" size={14} /> Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
