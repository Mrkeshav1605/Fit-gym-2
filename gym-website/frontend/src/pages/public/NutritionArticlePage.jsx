/** Single nutrition article. */
import { Link, useParams } from 'react-router-dom';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { publicApi } from '../../services/api.js';
import { Loader, ErrorBox } from '../../components/ui/Primitives.jsx';

export default function NutritionArticlePage() {
  const { slug } = useParams();
  const { data, loading, error, refetch } = useApi(() => publicApi.article(slug), [slug]);
  const article = data?.article;

  useTitle(article ? article.title : 'Nutrition');

  if (loading) return <Loader label="Loading article…" />;
  if (error) return <div className="container section"><ErrorBox message={error} onRetry={refetch} /></div>;

  return (
    <main>
      <section className="page-banner">
        <div className="container" style={{ maxWidth: 820 }}>
          <div className="crumb"><Link to="/">Home</Link> › <Link to="/nutrition">Nutrition</Link> › {article.title}</div>
          <div className="flex gap-8 flex-wrap" style={{ marginBottom: 10 }}>
            <span className="badge badge-blue">{article.category}</span>
            <span className="badge badge-gray">{article.readTime} min read</span>
          </div>
          <h1 className="h2">{article.title}</h1>
          <p className="muted" style={{ marginTop: 10 }}>{article.summary}</p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container" style={{ maxWidth: 820 }}>
          <article className="prose">
            {article.sections.map((s, i) => (
              <div key={i}>
                <h2>{s.h}</h2>
                {s.p.map((p, j) => <p key={j}>{p}</p>)}
              </div>
            ))}
            <div className="note">
              <strong>Important:</strong> This is general nutrition education, not a personalised plan and not medical advice.
              Individualised nutrition plans should be created with a qualified nutrition professional, especially for medical
              conditions, allergies, eating concerns, or special dietary requirements.
            </div>
          </article>

          {data.related.length > 0 && (
            <div className="mt-32">
              <h3 className="mb-16">Related reading</h3>
              <div className="grid grid-3">
                {data.related.map((a) => (
                  <Link to={`/nutrition/${a.slug}`} className="card card-pad-sm card-hover" key={a.id}>
                    <span className="badge badge-blue">{a.category}</span>
                    <div style={{ fontWeight: 700, marginTop: 8, fontSize: 14.5 }}>{a.title}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
