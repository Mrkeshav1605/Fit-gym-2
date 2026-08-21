/** Admin settings — gym info, hero, stats, hours, socials, safety note. */
import { useEffect, useState } from 'react';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { adminApi } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { Loader, ErrorBox } from '../../components/ui/Primitives.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { DAY_ORDER, DAY_LABELS } from '../../utils/labels.js';

export default function AdminSettings() {
  useTitle('Settings — Admin');
  const { push } = useToast();
  const { data, loading, error, refetch } = useApi(adminApi.settings, []);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data?.settings && !form) {
      const s = data.settings;
      setForm({
        gymName: s.gymName, tagline: s.tagline, heroTitle: s.heroTitle, heroSubtitle: s.heroSubtitle,
        announcement: s.announcement, address: s.address, phone: s.phone, email: s.email,
        mapEmbedUrl: s.mapEmbedUrl, hours: { ...s.hours },
        stats: { ...s.stats }, socials: { ...s.socials }, safetyNote: s.safetyNote,
      });
    }
  }, [data, form]);

  if (loading) return <Loader label="Loading settings…" />;
  if (error) return <ErrorBox message={error} onRetry={refetch} />;
  if (!form) return null;

  const set = (k, v) => setForm({ ...form, [k]: v });
  const setStat = (k, v) => set('stats', { ...form.stats, [k]: v });
  const setHour = (k, v) => set('hours', { ...form.hours, [k]: v });
  const setSocial = (k, v) => set('socials', { ...form.socials, [k]: v });

  const save = async () => {
    setBusy(true);
    try {
      await adminApi.updateSettings(form);
      push('Settings saved — the website updates immediately.', 'success');
      refetch();
    } catch (e) { push(e.message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <div className="card">
        <h3 className="mb-16">Branding & hero</h3>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Gym name</label>
            <input className="input" value={form.gymName} onChange={(e) => set('gymName', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Tagline</label>
            <input className="input" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Hero title</label>
            <input className="input" value={form.heroTitle} onChange={(e) => set('heroTitle', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Announcement (top bar)</label>
            <input className="input" value={form.announcement} onChange={(e) => set('announcement', e.target.value)} />
          </div>
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label className="label">Hero subtitle</label>
          <textarea className="textarea" style={{ minHeight: 70 }} value={form.heroSubtitle} onChange={(e) => set('heroSubtitle', e.target.value)} />
        </div>
      </div>

      <div className="card">
        <h3 className="mb-16">Home-page statistics</h3>
        <p className="small dim mb-16">Only show claims the gym can stand behind — these numbers feed the home page directly.</p>
        <div className="grid grid-4" style={{ gap: 14 }}>
          {['machines', 'trainers', 'members', 'years'].map((k) => (
            <div className="field" key={k} style={{ margin: 0 }}>
              <label className="label">{form.stats[`${k}Label`] || k}</label>
              <input className="input" value={form.stats[k]} onChange={(e) => setStat(k, e.target.value)} />
            </div>
          ))}
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Machines label</label>
            <input className="input" value={form.stats.machinesLabel} onChange={(e) => setStat('machinesLabel', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Trainers label</label>
            <input className="input" value={form.stats.trainersLabel} onChange={(e) => setStat('trainersLabel', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Members label</label>
            <input className="input" value={form.stats.membersLabel} onChange={(e) => setStat('membersLabel', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Years label</label>
            <input className="input" value={form.stats.yearsLabel} onChange={(e) => setStat('yearsLabel', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-16">Contact & hours</h3>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Address</label>
            <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Email</label>
            <input className="input" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Map embed URL (optional)</label>
            <input className="input" value={form.mapEmbedUrl} onChange={(e) => set('mapEmbedUrl', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-2 mt-16" style={{ gap: 14 }}>
          {DAY_ORDER.map((d) => (
            <div className="field" key={d} style={{ margin: 0 }}>
              <label className="label">{DAY_LABELS[d]}</label>
              <input className="input" value={form.hours[d] || ''} disabled={d === 'sunday'}
                onChange={(e) => setHour(d, e.target.value)} placeholder="5:30 AM – 10:00 PM" />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="mb-16">Social links & safety note</h3>
        <div className="grid grid-4" style={{ gap: 14 }}>
          {['instagram', 'facebook', 'youtube', 'twitter'].map((k) => (
            <div className="field" key={k} style={{ margin: 0 }}>
              <label className="label">{k[0].toUpperCase() + k.slice(1)}</label>
              <input className="input" value={form.socials[k]} onChange={(e) => setSocial(k, e.target.value)} placeholder="https://…" />
            </div>
          ))}
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label className="label">Safety disclaimer (shown in the site footer)</label>
          <textarea className="textarea" style={{ minHeight: 80 }} value={form.safetyNote} onChange={(e) => set('safetyNote', e.target.value)} />
        </div>
      </div>

      <button className="btn btn-primary btn-lg" onClick={save} disabled={busy}>
        {busy ? 'Saving…' : <><Icon name="check" size={17} /> Save all settings</>}
      </button>
    </div>
  );
}
