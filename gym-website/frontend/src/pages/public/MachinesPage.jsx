/** Machines catalogue — search + filters (muscle, equipment, difficulty). */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi, useReveal, useTitle } from '../../hooks/useApi.js';
import { publicApi } from '../../services/api.js';
import Icon from '../../components/ui/Icon.jsx';
import { PageBanner, Loader, ErrorBox, EmptyState, SkeletonCard } from '../../components/ui/Primitives.jsx';
import MachineArt from '../../components/workout/MachineArt.jsx';

export default function MachinesPage() {
  useTitle('Machines & Exercises');
  useReveal();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const muscle = params.get('muscle') || '';
  const equipment = params.get('equipment') || '';
  const difficulty = params.get('difficulty') || '';

  const { data, loading, error, refetch } = useApi(
    () => publicApi.machines({ q: params.get('q') || '', muscle, equipment, difficulty }),
    [params]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams();
      if (q.trim()) next.set('q', q.trim());
      if (muscle) next.set('muscle', muscle);
      if (equipment) next.set('equipment', equipment);
      if (difficulty) next.set('difficulty', difficulty);
      setParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line

  const set = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  };

  const filters = data?.filters || { categories: [], muscles: [], equipment: [], difficulties: [] };

  return (
    <main>
      <PageBanner crumb={<Link to="/">Home</Link>} title="Machine & Exercise Library"
        sub={`${data?.machines?.length ?? '—'} pieces of equipment with complete coaching guides: instructions, sets & reps, breathing, mistakes and safety.`} />

      <section className="section-tight">
        <div className="container">
          {/* Search */}
          <div className="flex mb-16" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '4px 8px 4px 16px', maxWidth: 480 }}>
            <Icon name="search" size={18} className="dim" />
            <input
              className="input" placeholder="Search machines… e.g. “chest”" value={q}
              onChange={(e) => setQ(e.target.value)} aria-label="Search machines"
              style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
            />
            {q && <button className="btn btn-ghost btn-sm" onClick={() => setQ('')} aria-label="Clear search"><Icon name="close" size={15} /></button>}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-8 mb-24">
            <span className="small dim" style={{ alignSelf: 'center' }}>Muscle:</span>
            <button className={`chip ${!muscle ? 'active' : ''}`} onClick={() => set('muscle', '')}>All</button>
            {filters.muscles.map((m) => (
              <button key={m} className={`chip ${muscle === m ? 'active' : ''}`} onClick={() => set('muscle', m)}>{m}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-8 mb-24">
            <span className="small dim" style={{ alignSelf: 'center' }}>Equipment:</span>
            <button className={`chip ${!equipment ? 'active' : ''}`} onClick={() => set('equipment', '')}>All</button>
            {filters.equipment.map((e) => (
              <button key={e} className={`chip ${equipment === e ? 'active' : ''}`} onClick={() => set('equipment', e)}>{e}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-8 mb-24">
            <span className="small dim" style={{ alignSelf: 'center' }}>Difficulty:</span>
            <button className={`chip ${!difficulty ? 'active' : ''}`} onClick={() => set('difficulty', '')}>All</button>
            {filters.difficulties.map((d) => (
              <button key={d} className={`chip ${difficulty === d ? 'active' : ''}`} onClick={() => set('difficulty', d)}>{d}</button>
            ))}
          </div>

          {loading && <div className="grid grid-auto"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}
          {error && <ErrorBox message={error} onRetry={refetch} />}
          {!loading && !error && (!data?.machines?.length) && (
            <EmptyState icon="dumbbell" title="No machines found" text="Try a different search term or clear the filters.">
              <button className="btn btn-outline" onClick={() => { setQ(''); setParams({}); }}>Clear filters</button>
            </EmptyState>
          )}
          {!loading && (
            <div className="grid grid-auto">
              {data.machines.map((m) => (
                <Link to={`/machines/${m.slug}`} className="card card-pad-sm card-hover reveal" key={m.id}>
                  <MachineArt category={m.category} label={m.muscleGroup} />
                  <h3 style={{ fontSize: 16, margin: '12px 0 4px' }}>{m.name}</h3>
                  <p className="small dim" style={{ marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {m.description}
                  </p>
                  <div className="flex gap-6 flex-wrap">
                    <span className="badge badge-orange">{m.muscleGroup}</span>
                    <span className="badge badge-gray">{m.equipmentType}</span>
                    <span className="badge badge-blue">{m.difficulty}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
