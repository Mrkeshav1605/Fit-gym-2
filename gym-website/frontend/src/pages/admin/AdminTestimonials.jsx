/** Admin testimonials — approve / edit / delete member reviews. */
import { useState } from 'react';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { adminApi } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Loader, ErrorBox, EmptyState, Modal, ConfirmDialog, RatingStars, Avatar } from '../../components/ui/Primitives.jsx';

const EMPTY = { name: '', role: 'Member', rating: 5, text: '', color: '#ff5c1c', approved: true };

export default function AdminTestimonials() {
  useTitle('Testimonials — Admin');
  const { push } = useToast();
  const { data, loading, error, refetch } = useApi(adminApi.testimonials, []);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit = (t) => { setForm(t); setModal('edit'); };

  const save = async () => {
    if (!form.name.trim() || form.text.trim().length < 10) { push('Name and a testimonial of at least 10 characters are required.', 'error'); return; }
    setBusy(true);
    try {
      if (modal === 'create') await adminApi.createTestimonial(form);
      else await adminApi.updateTestimonial(form.id, form);
      push(modal === 'create' ? 'Testimonial added!' : 'Testimonial updated.', 'success');
      setModal(null);
      refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  const toggleApproval = async (t) => {
    try {
      await adminApi.updateTestimonial(t.id, { approved: !t.approved });
      push(t.approved ? 'Testimonial hidden from the website.' : 'Testimonial approved & published!', 'success');
      refetch();
    } catch (e) { push(e.message, 'error'); }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await adminApi.deleteTestimonial(deleting.id);
      push('Testimonial deleted.', 'success');
      setDeleting(null);
      refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  if (loading) return <Loader label="Loading testimonials…" />;
  if (error) return <ErrorBox message={error} onRetry={refetch} />;

  const testimonials = data?.testimonials || [];

  return (
    <>
      <div className="flex-between mb-16">
        <span className="muted small">{testimonials.length} testimonial(s) — only approved ones appear publicly.</span>
        <button className="btn btn-primary" onClick={openCreate}><Icon name="plus" size={16} /> Add testimonial</button>
      </div>

      {testimonials.length === 0 ? <EmptyState icon="star" title="No testimonials yet" text="Add your first member testimonial." /> : (
        <div className="grid grid-2" style={{ gap: 16 }}>
          {testimonials.map((t) => (
            <div className="card" key={t.id} style={!t.approved ? { opacity: 0.65 } : undefined}>
              <div className="flex-between mb-8">
                <div className="flex gap-8">
                  <Avatar name={t.name} color={t.color} size={34} />
                  <div>
                    <strong>{t.name}</strong>
                    <div className="small dim">{t.role}</div>
                  </div>
                </div>
                {t.approved ? <span className="badge badge-green">APPROVED</span> : <span className="badge badge-yellow">PENDING</span>}
              </div>
              <RatingStars value={t.rating} />
              <p className="small muted mt-8">“{t.text}”</p>
              <div className="flex gap-6 mt-16">
                <button className="btn btn-ghost btn-sm" onClick={() => toggleApproval(t)}>
                  <Icon name={t.approved ? 'eye' : 'check'} size={14} /> {t.approved ? 'Hide' : 'Approve'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}><Icon name="edit" size={14} /> Edit</button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => setDeleting(t)}><Icon name="trash" size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add testimonial' : 'Edit testimonial'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </>
        }>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Role</label>
            <input className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Member since 2024" />
          </div>
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label className="label">Rating (1–5)</label>
          <input type="number" min="1" max="5" className="input" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
        </div>
        <div className="field">
          <label className="label">Testimonial text *</label>
          <textarea className="textarea" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
        </div>
        <label className="check-row">
          <input type="checkbox" checked={!!form.approved} onChange={(e) => setForm({ ...form, approved: e.target.checked })} />
          Approved (visible on the website)
        </label>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDelete} loading={busy}
        title={`Delete ${deleting?.name || 'testimonial'}?`} text="This testimonial will be removed permanently." />
    </>
  );
}
