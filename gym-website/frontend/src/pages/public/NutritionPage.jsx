/** Nutrition — education articles with the professional-advice disclaimer. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi, useReveal, useTitle } from '../../hooks/useApi.js';
import { publicApi } from '../../services/api.js';
import Icon from '../../components/ui/Icon.jsx';
import { PageBanner, Loader, ErrorBox, EmptyState, SkeletonCard } from '../../components/ui/Primitives.jsx';

export default function NutritionPage() {
  useTitle('Nutrition Education');
  useReveal();
  const [category, setCategory] = useState('');
  const { data, loading, error, refetch } = useApi(() => publicApi.nutrition({ category }), [category]);

  return (
    <main>
      <PageBanner crumb={<Link to="/">Home</Link>} title="Nutrition Education"
        sub="Balanced, evidence-based guidance on eating for training — no crash diets, no starvation, no extremes." />

      <section className="section-tight">
        <div className="container">
          <div className="card mb-24" style={{ borderColor: 'rgba(251,191,36,0.4)', background: 'rgba(251,191,36,0.05)' }}>
            <div className="flex" style={{ gap: 12, alignItems: 'flex-start' }}>
              <Icon name="info" size={20} style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: 2 }} />
              <p className="small" style={{ color: '#fde68a' }}>
                This section provides general nutrition information for education only. It is not medical advice, and it does not
                prescribe calories or supplements. Individualised nutrition plans should be created with a qualified nutrition
                professional — especially if you have medical conditions, allergies, eating concerns, or special dietary requirements.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-8 mb-24">
            <button className={`chip ${!category ? 'active' : ''}`} onClick={() => setCategory('')}>All topics</button>
            {(data?.categories || []).map((c) => (
              <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>

          {loading && <div className="grid grid-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}
          {error && <ErrorBox message={error} onRetry={refetch} />}
          {!loading && !error && !data?.articles?.length && <EmptyState icon="book" title="No articles here yet" text="Check back soon — our nutrition library is growing." />}
          {!loading && (
            <div className="grid grid-3">
              {data.articles.map((a) => (
                <Link to={`/nutrition/${a.slug}`} className="card card-hover reveal" key={a.id}>
                  <div className="flex-between">
                    <span className="badge badge-blue">{a.category}</span>
                    <span className="small dim">{a.readTime} min read</span>
                  </div>
                  <h3 style={{ fontSize: 17, margin: '12px 0 8px' }}>{a.title}</h3>
                  <p className="muted small" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.summary}</p>
                  <div className="flex gap-6 flex-wrap mt-16">
                    {a.tags.map((t) => <span key={t} className="badge badge-gray">{t}</span>)}
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
