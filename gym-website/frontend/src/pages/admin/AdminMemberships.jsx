/** Admin memberships — plan catalogue CRUD (prices are configurable). */
import { useState } from 'react';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { adminApi, fmt } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Loader, ErrorBox, EmptyState, Modal, ConfirmDialog } from '../../components/ui/Primitives.jsx';

const EMPTY = { name: '', price: 999, currency: '₹', durationMonths: 1, description: '', features: [], popular: false, active: true, order: 99 };

export default function AdminMemberships() {
  useTitle('Membership Plans — Admin');
  const { push } = useToast();
  const { data, loading, error, refetch } = useApi(adminApi.memberships, []);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit = (m) => { setForm({ ...m, features: m.features || [] }); setModal('edit'); };

  const save = async () => {
    if (!form.name.trim()) { push('Plan name is required.', 'error'); return; }
    setBusy(true);
    try {
      const payload = { ...form, price: Number(form.price), durationMonths: Number(form.durationMonths), order: Number(form.order) };
      if (modal === 'create') await adminApi.createMembership(payload);
      else await adminApi.updateMembership(form.id, payload);
      push(modal === 'create' ? 'Membership plan created!' : 'Membership plan updated.', 'success');
      setModal(null);
      refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await adminApi.deleteMembership(deleting.id);
      push('Membership plan deleted.', 'success');
      setDeleting(null);
      refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  if (loading) return <Loader label="Loading plans…" />;
  if (error) return <ErrorBox message={error} onRetry={refetch} />;

  const plans = data?.memberships || [];

  return (
    <>
      <div className="flex-between mb-16">
        <span className="muted small">Prices shown on the website come from here — nothing is hard-coded.</span>
        <button className="btn btn-primary" onClick={openCreate}><Icon name="plus" size={16} /> Add plan</button>
      </div>

      {plans.length === 0 ? <EmptyState icon="award" title="No membership plans" text="Create your first membership plan." /> : (
        <div className="grid grid-3" style={{ gap: 16 }}>
          {plans.map((m) => (
            <div className="card" key={m.id} style={m.popular ? { borderColor: 'rgba(255,92,28,0.5)' } : undefined}>
              <div className="flex-between mb-8">
                <strong style={{ letterSpacing: '0.05em' }}>{m.name}</strong>
                <div className="flex gap-6">
                  <button className="btn btn-ghost btn-sm" style={{ padding: '6px 9px' }} onClick={() => openEdit(m)} aria-label="Edit plan">
                    <Icon name="edit" size={15} />
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '6px 9px', color: 'var(--red)' }} onClick={() => setDeleting(m)} aria-label="Delete plan">
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{fmt.money(m.price, m.currency)}<span className="small dim"> / {m.durationMonths} mo</span></div>
              <div className="flex gap-6 flex-wrap mt-8">
                {m.popular && <span className="badge badge-orange">POPULAR</span>}
                {!m.active && <span className="badge badge-gray">HIDDEN</span>}
                <span className="badge badge-blue">{m.features?.length || 0} features</span>
              </div>
              <ul className="small muted mt-8" style={{ listStyle: 'none' }}>
                {(m.features || []).slice(0, 3).map((f, i) => <li key={i}>• {f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add membership plan' : `Edit — ${form.name}`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save plan'}</button>
          </>
        }>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Price (per month)</label>
            <input type="number" min="0" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Currency</label>
            <select className="select" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              <option value="₹">₹ (INR)</option><option value="$">$ (USD)</option><option value="€">€ (EUR)</option>
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Duration (months)</label>
            <input type="number" min="1" max="60" className="input" value={form.durationMonths} onChange={(e) => setForm({ ...form, durationMonths: e.target.value })} />
          </div>
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label className="label">Description</label>
          <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="field">
          <label className="label">Features (one per line)</label>
          <textarea className="textarea" value={(form.features || []).join('\n')}
            onChange={(e) => setForm({ ...form, features: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
        </div>
        <div className="flex gap-16">
          <label className="check-row"><input type="checkbox" checked={!!form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} /> Popular</label>
          <label className="check-row"><input type="checkbox" checked={!!form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Visible on website</label>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDelete} loading={busy}
        title={`Delete ${deleting?.name || 'plan'}?`} text="The plan disappears from the website. Existing subscriptions keep working." />
    </>
  );
}
