/** Admin members — search, filters, add/edit, deactivate, delete, assign plan,
 *  view attendance & progress. */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { adminApi, fmt } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Loader, ErrorBox, EmptyState, Modal, ConfirmDialog, Badge, Avatar } from '../../components/ui/Primitives.jsx';
import { FITNESS_LEVELS, GOALS } from '../../utils/labels.js';

const EMPTY_FORM = {
  name: '', email: '', password: '', phone: '', age: '', height: '',
  fitnessLevel: 'beginner', goal: 'general_fitness', workoutDuration: '60',
};

export default function AdminMembers() {
  useTitle('Members — Admin');
  const { push } = useToast();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('');
  const [goal, setGoal] = useState('');
  const [modal, setModal] = useState(null); // 'create' | editing member
  const [detail, setDetail] = useState(null); // member id being inspected
  const [assignPlanFor, setAssignPlanFor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, loading, error, refetch } = useApi(
    () => adminApi.members({ q: q.trim() || undefined, level: level || undefined, goal: goal || undefined }),
    [q, level, goal]
  );
  const plans = useApi(adminApi.plans, []);
  const detailData = useApi(() => (detail ? adminApi.member(detail) : Promise.resolve(null)), [detail]);

  // Open detail from URL (?open=id)
  useEffect(() => {
    const openId = params.get('open');
    if (openId) { setDetail(Number(openId)); setParams({}, { replace: true }); }
  }, []); // eslint-disable-line

  const openCreate = () => { setForm(EMPTY_FORM); setModal('create'); };
  const openEdit = (m) => { setForm({ ...m, password: '' }); setModal('edit'); };

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) { push('Name and email are required.', 'error'); return; }
    if (modal === 'create' && form.password.length < 8) { push('Password must be at least 8 characters.', 'error'); return; }
    setBusy(true);
    try {
      if (modal === 'create') {
        await adminApi.createMember(form);
        push('Member created and plan generated!', 'success');
      } else {
        await adminApi.updateMember(form.id, form);
        push('Member updated.', 'success');
      }
      setModal(null);
      refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await adminApi.deleteMember(deleting.id);
      push('Member deleted.', 'success');
      setDeleting(null);
      refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  const deactivate = async (m) => {
    try {
      const res = await adminApi.deactivateMember(m.id);
      push(res.message, 'success');
      refetch();
    } catch (e) { push(e.message, 'error'); }
  };

  const assignPlan = async () => {
    setBusy(true);
    try {
      const res = await adminApi.assignPlan(assignPlanFor.memberId, assignPlanFor.planId);
      push(res.message, 'success');
      setAssignPlanFor(null);
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <>
      <div className="flex-between mb-16">
        <div className="flex gap-8 flex-wrap">
          <div className="flex" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '0 10px' }}>
            <Icon name="search" size={16} className="dim" />
            <input className="input" style={{ border: 'none', background: 'transparent', boxShadow: 'none', minWidth: 200 }} placeholder="Search name, email, phone…"
              value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search members" />
          </div>
          <select className="select" style={{ width: 'auto' }} value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Filter by level">
            <option value="">All levels</option>
            {FITNESS_LEVELS.map((l) => <option key={l} value={l}>{fmt.levelLabel(l)}</option>)}
          </select>
          <select className="select" style={{ width: 'auto' }} value={goal} onChange={(e) => setGoal(e.target.value)} aria-label="Filter by goal">
            <option value="">All goals</option>
            {GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Icon name="plus" size={16} /> Add member</button>
      </div>

      {loading ? <Loader /> : error ? <ErrorBox message={error} onRetry={refetch} /> : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Member</th><th>Level</th><th>Goal</th><th>Membership</th><th>Workouts</th><th>Attendance</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {(data?.members || []).map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="flex gap-8">
                        <Avatar name={m.name} color={m.avatarColor} size={32} />
                        <div>
                          <div style={{ fontWeight: 700 }}>{m.name}</div>
                          <div className="small dim">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-orange">{fmt.levelLabel(m.fitnessLevel)}</span></td>
                    <td className="small">{fmt.goalLabel(m.goal)}</td>
                    <td>
                      {m.membership
                        ? <Badge tone={m.membershipStatus === 'active' ? 'green' : m.membershipStatus === 'pending' ? 'yellow' : 'red'}>{m.membership}</Badge>
                        : <span className="small dim">—</span>}
                    </td>
                    <td className="mono">{m.stats?.totalWorkouts ?? 0}</td>
                    <td className="mono">{m.stats?.attendancePct ?? 0}%</td>
                    <td>{m.deactivated ? <Badge tone="red">DEACTIVATED</Badge> : <Badge tone="green">ACTIVE</Badge>}</td>
                    <td>
                      <div className="flex gap-6">
                        <button className="btn btn-ghost btn-sm" style={{ padding: '6px 9px' }} onClick={() => setDetail(m.id)} aria-label="View member">
                          <Icon name="eye" size={15} />
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '6px 9px' }} onClick={() => openEdit(m)} aria-label="Edit member">
                          <Icon name="edit" size={15} />
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '6px 9px' }} onClick={() => setAssignPlanFor({ memberId: m.id, name: m.name, planId: '' })} aria-label="Assign plan">
                          <Icon name="clipboard" size={15} />
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '6px 9px' }} onClick={() => deactivate(m)} aria-label={m.deactivated ? 'Reactivate' : 'Deactivate'}>
                          <Icon name={m.deactivated ? 'circle-check' : 'pause'} size={15} />
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '6px 9px', color: 'var(--red)' }} onClick={() => setDeleting(m)} aria-label="Delete member">
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data?.members?.length && (
            <EmptyState icon="users" title="No members found" text="Try a different search or filter." />
          )}
        </>
      )}

      {/* Create / edit modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add member' : 'Edit member'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save member'}</button>
          </>
        }>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Email *</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">{modal === 'create' ? 'Password *' : 'New password (leave blank to keep)'}</label>
            <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Fitness level</label>
            <select className="select" value={form.fitnessLevel} onChange={(e) => setForm({ ...form, fitnessLevel: e.target.value })}>
              {FITNESS_LEVELS.map((l) => <option key={l} value={l}>{fmt.levelLabel(l)}</option>)}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Goal</label>
            <select className="select" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}>
              {GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      {/* Member detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Member overview" wide>
        {detailData.loading ? <Loader /> : detailData.data ? (
          <>
            <div className="flex gap-8 mb-16">
              <Avatar name={detailData.data.member.name} color={detailData.data.member.avatarColor} size={44} />
              <div>
                <strong>{detailData.data.member.name}</strong>
                <div className="small dim">{detailData.data.member.email} · {detailData.data.member.phone || 'no phone'}</div>
                <div className="flex gap-6 mt-8">
                  <span className="badge badge-orange">{fmt.levelLabel(detailData.data.member.fitnessLevel)}</span>
                  <span className="badge badge-blue">{fmt.goalLabel(detailData.data.member.goal)}</span>
                  {detailData.data.membership && (
                    <Badge tone={detailData.data.membership.status === 'active' ? 'green' : 'yellow'}>{detailData.data.membership.planName}</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-4" style={{ gap: 12, marginBottom: 20 }}>
              <div className="card card-pad-sm text-center"><strong>{detailData.data.stats.totalWorkouts}</strong><div className="small dim">Workouts</div></div>
              <div className="card card-pad-sm text-center"><strong>{detailData.data.stats.streak}</strong><div className="small dim">Streak</div></div>
              <div className="card card-pad-sm text-center"><strong>{detailData.data.stats.attendancePct}%</strong><div className="small dim">Attendance</div></div>
              <div className="card card-pad-sm text-center"><strong>{detailData.data.attendance.length}</strong><div className="small dim">Visits</div></div>
            </div>
            <h4 className="small" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 10 }}>Recent workouts</h4>
            {detailData.data.history.length === 0 && <p className="small dim">No workouts yet.</p>}
            {detailData.data.history.map((h) => (
              <div key={h.id} className="flex-between small" style={{ padding: '6px 0', borderBottom: '1px dashed var(--border)' }}>
                <span><strong>{h.focus}</strong> <span className="dim">· {h.day}</span></span>
                <span className="dim">{fmt.date(h.completedAt, { day: 'numeric', month: 'short' })} · {h.durationMin} min</span>
              </div>
            ))}
            <h4 className="small mt-24" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 10 }}>Recent attendance</h4>
            {detailData.data.attendance.length === 0 && <p className="small dim">No attendance yet.</p>}
            {detailData.data.attendance.slice(0, 8).map((a) => (
              <div key={a.id} className="flex-between small" style={{ padding: '6px 0', borderBottom: '1px dashed var(--border)' }}>
                <span>{fmt.date(a.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                <span className="dim">{fmt.time(a.checkInTime)} · {a.method}</span>
              </div>
            ))}
          </>
        ) : null}
      </Modal>

      {/* Assign plan modal */}
      <Modal open={!!assignPlanFor} onClose={() => setAssignPlanFor(null)} title={`Assign plan — ${assignPlanFor?.name || ''}`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setAssignPlanFor(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={assignPlan} disabled={busy || !assignPlanFor?.planId}>{busy ? 'Assigning…' : 'Assign plan'}</button>
          </>
        }>
        <p className="small muted mb-16">A fresh personalised weekly plan will be generated from the member's profile and the chosen programme. Their history is never deleted.</p>
        <div className="field" style={{ margin: 0 }}>
          <label className="label">Programme</label>
          <select className="select" value={assignPlanFor?.planId || ''} onChange={(e) => setAssignPlanFor({ ...assignPlanFor, planId: e.target.value })}>
            <option value="">Choose a programme…</option>
            {(plans.data?.plans || []).map((p) => <option key={p.id} value={p.id}>{p.name} ({fmt.levelLabel(p.fitnessLevel)})</option>)}
          </select>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDelete} loading={busy}
        title={`Delete ${deleting?.name || 'member'}?`}
        text="This permanently removes the member and all their data (workouts, attendance, subscriptions, goals, notifications). This cannot be undone."
        confirmLabel="Delete permanently" />
    </>
  );
}
