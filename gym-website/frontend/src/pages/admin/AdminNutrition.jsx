/** Admin nutrition — article CRUD. */
import { useState } from 'react';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { adminApi } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Loader, ErrorBox, EmptyState, Modal, ConfirmDialog } from '../../components/ui/Primitives.jsx';

const EMPTY = { title: '', category: 'Basics', readTime: 4, tags: [], published: true, summary: '', sections: [] };
const SECTIONS_TEXT = (sections) => (sections || []).map((s) => `## ${s.h}\n${(s.p || []).join('\n\n')}`).join('\n\n');

export default function AdminNutrition() {
  useTitle('Nutrition — Admin');
  const { push } = useToast();
  const { data, loading, error, refetch } = useApi(adminApi.articles, []);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [sectionsText, setSectionsText] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const openCreate = () => { setForm(EMPTY); setSectionsText(''); setModal('create'); };
  const openEdit = (a) => { setForm({ ...a, tags: a.tags || [] }); setSectionsText(SECTIONS_TEXT(a.sections)); setModal('edit'); };

  const parseSections = () => {
    const sections = [];
    let cur = null;
    for (const line of sectionsText.split('\n')) {
      if (line.startsWith('## ')) {
        cur = { h: line.slice(3).trim(), p: [] };
        sections.push(cur);
      } else if (cur && line.trim()) {
        cur.p.push(line.trim());
      }
    }
    return sections;
  };

  const save = async () => {
    if (!form.title.trim()) { push('Title is required.', 'error'); return; }
    setBusy(true);
    try {
      const payload = { ...form, sections: parseSections(), tags: String(form.tags).split(',').map((t) => t.trim()).filter(Boolean) };
      if (modal === 'create') await adminApi.createArticle(payload);
      else await adminApi.updateArticle(form.id, payload);
      push(modal === 'create' ? 'Article published!' : 'Article updated.', 'success');
      setModal(null);
      refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await adminApi.deleteArticle(deleting.id);
      push('Article deleted.', 'success');
      setDeleting(null);
      refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  if (loading) return <Loader label="Loading articles…" />;
  if (error) return <ErrorBox message={error} onRetry={refetch} />;

  const articles = data?.articles || [];

  return (
    <>
      <div className="flex-between mb-16">
        <span className="muted small">{articles.length} article(s). Remember: nutrition content is general education, never medical advice.</span>
        <button className="btn btn-primary" onClick={openCreate}><Icon name="plus" size={16} /> New article</button>
      </div>

      {articles.length === 0 ? <EmptyState icon="book" title="No articles yet" text="Write your first nutrition article." /> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Title</th><th>Category</th><th>Read time</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.title}</strong><div className="small dim">{a.tags?.join(', ')}</div></td>
                  <td><span className="badge badge-blue">{a.category}</span></td>
                  <td className="small">{a.readTime} min</td>
                  <td>{a.published ? <span className="badge badge-green">PUBLISHED</span> : <span className="badge badge-gray">DRAFT</span>}</td>
                  <td>
                    <div className="flex gap-6">
                      <button className="btn btn-ghost btn-sm" style={{ padding: '6px 9px' }} onClick={() => openEdit(a)} aria-label="Edit">
                        <Icon name="edit" size={15} />
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '6px 9px' }} onClick={async () => { await adminApi.updateArticle(a.id, { published: !a.published }); refetch(); }} aria-label="Toggle publish">
                        <Icon name="eye" size={15} />
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '6px 9px', color: 'var(--red)' }} onClick={() => setDeleting(a)} aria-label="Delete">
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'New article' : `Edit — ${form.title}`} wide
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save article'}</button>
          </>
        }>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Category</label>
            <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Read time (minutes)</label>
            <input type="number" min="1" className="input" value={form.readTime} onChange={(e) => setForm({ ...form, readTime: Number(e.target.value) })} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Tags (comma separated)</label>
            <input className="input" value={(form.tags || []).join(', ')} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label className="label">Summary</label>
          <textarea className="textarea" style={{ minHeight: 60 }} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        </div>
        <div className="field">
          <label className="label">Content — use "## Heading" for sections, paragraphs below</label>
          <textarea className="textarea" style={{ minHeight: 220 }} value={sectionsText} onChange={(e) => setSectionsText(e.target.value)}
            placeholder={'## Why protein matters\nProtein helps your muscles repair after training…'} />
        </div>
        <label className="check-row">
          <input type="checkbox" checked={!!form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
          Published (visible on the website)
        </label>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDelete} loading={busy}
        title={`Delete "${deleting?.title || 'article'}"?`} text="The article will be removed from the nutrition library." />
    </>
  );
}
