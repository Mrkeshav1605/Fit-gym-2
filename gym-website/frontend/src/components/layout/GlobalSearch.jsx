/** Global search — searches machines, exercises, programmes & articles. */
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { publicApi } from '../../services/api.js';
import Icon from '../ui/Icon.jsx';

export default function GlobalSearch() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (q.trim().length < 2) { setResults(null); setOpen(false); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const d = await publicApi.search(q.trim());
        setResults(d.results);
        setOpen(true);
      } catch { /* quiet */ }
      finally { setLoading(false); }
    }, 280);
    return () => clearTimeout(timerRef.current);
  }, [q]);

  const total = results
    ? results.machines.length + results.exercises.length + results.programmes.length + results.articles.length
    : 0;

  const go = (path) => { setOpen(false); setQ(''); navigate(path); };

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <div className="flex" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '0 10px' }}>
        <Icon name="search" size={16} className="dim" />
        <input
          className="input" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search machines, workouts…"
          aria-label="Search machines, exercises, programmes and nutrition"
          style={{ border: 'none', background: 'transparent', padding: '9px 8px', minWidth: 170, boxShadow: 'none' }}
          onFocus={() => results && setOpen(true)}
        />
      </div>

      {open && (
        <div className="card card-pad-sm" style={{ position: 'absolute', top: 46, right: 0, width: 340, maxWidth: '88vw', zIndex: 99, maxHeight: '70vh', overflowY: 'auto', boxShadow: 'var(--shadow)' }}>
          {loading && <p className="small muted">Searching…</p>}
          {!loading && results && total === 0 && <p className="small muted">No results for “{q}”.</p>}
          {!loading && results && (
            <>
              {results.machines.length > 0 && (
                <>
                  <p className="small dim" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', margin: '8px 0 6px' }}>Machines</p>
                  {results.machines.map((m) => (
                    <button key={m.id} className="nav-link" style={{ display: 'flex', width: '100%', textAlign: 'left', gap: 8, alignItems: 'center' }} onClick={() => go(`/machines/${m.slug}`)}>
                      <Icon name="dumbbell" size={15} className="dim" /> {m.name}
                      <span className="badge badge-gray" style={{ marginLeft: 'auto' }}>{m.muscleGroup}</span>
                    </button>
                  ))}
                </>
              )}
              {results.programmes.length > 0 && (
                <>
                  <p className="small dim" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', margin: '10px 0 6px' }}>Programmes</p>
                  {results.programmes.map((p) => (
                    <button key={p.id} className="nav-link" style={{ display: 'flex', width: '100%', textAlign: 'left', gap: 8, alignItems: 'center' }} onClick={() => go('/programs')}>
                      <Icon name="clipboard" size={15} className="dim" /> {p.name}
                    </button>
                  ))}
                </>
              )}
              {results.articles.length > 0 && (
                <>
                  <p className="small dim" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', margin: '10px 0 6px' }}>Nutrition</p>
                  {results.articles.map((a) => (
                    <button key={a.id} className="nav-link" style={{ display: 'flex', width: '100%', textAlign: 'left', gap: 8, alignItems: 'center' }} onClick={() => go(`/nutrition/${a.slug}`)}>
                      <Icon name="book" size={15} className="dim" /> {a.title}
                    </button>
                  ))}
                </>
              )}
              {results.exercises.length > 0 && (
                <>
                  <p className="small dim" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', margin: '10px 0 6px' }}>Exercises</p>
                  {results.exercises.map((e) => (
                    <button key={e.id} className="nav-link" style={{ display: 'flex', width: '100%', textAlign: 'left', gap: 8, alignItems: 'center' }} onClick={() => go('/workouts')}>
                      <Icon name="activity" size={15} className="dim" /> {e.name}
                      <span className="badge badge-gray" style={{ marginLeft: 'auto' }}>{e.muscleGroup}</span>
                    </button>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
