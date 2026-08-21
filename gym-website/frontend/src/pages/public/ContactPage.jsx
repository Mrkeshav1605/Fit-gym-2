/** Contact — info, hours (Sunday closed), form, map placeholder. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi, useTitle } from '../../hooks/useApi.js';
import { publicApi } from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { PageBanner, Loader, ErrorBox } from '../../components/ui/Primitives.jsx';
import { DAY_LABELS_ORDER } from '../../utils/labels.js';

export default function ContactPage() {
  useTitle('Contact Us');
  const { push } = useToast();
  const settings = useApi(publicApi.settings, []);
  const s = settings.data?.settings || {};

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) errs.email = 'Please enter a valid email address.';
    if (form.message.trim().length < 10) errs.message = 'Please write a message of at least 10 characters.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSending(true);
    try {
      const res = await publicApi.contact(form);
      push(res.message, 'success');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) { push(err.message, 'error'); }
    finally { setSending(false); }
  };

  if (settings.loading) return <Loader />;
  if (settings.error) return <div className="container section"><ErrorBox message={settings.error} onRetry={settings.refetch} /></div>;

  return (
    <main>
      <PageBanner crumb={<Link to="/">Home</Link>} title="Contact Us"
        sub="Questions about memberships, machines or your plan? We reply within one working day." />

      <section className="section-tight">
        <div className="container grid" style={{ gridTemplateColumns: '1fr 1.15fr', gap: 28 }}>
          <div>
            <div className="card mb-16">
              <h3 className="mb-16">Find us</h3>
              <div className="small muted" style={{ display: 'grid', gap: 12 }}>
                <span className="flex" style={{ gap: 10 }}><Icon name="pin" size={17} className="dim" style={{ flexShrink: 0 }} /> {s.address}</span>
                <a className="flex" style={{ gap: 10 }} href={`tel:${s.phone}`}><Icon name="phone" size={17} className="dim" /> {s.phone}</a>
                <a className="flex" style={{ gap: 10 }} href={`mailto:${s.email}`}><Icon name="mail" size={17} className="dim" /> {s.email}</a>
              </div>
              <div className="divider" />
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-2)', marginBottom: 10 }}>Opening hours</h4>
              <div className="small muted">
                {DAY_LABELS_ORDER.map((d) => {
                  const key = d.toLowerCase();
                  const isSunday = key === 'sunday';
                  return (
                    <div key={d} className="flex-between" style={{ padding: '3px 0' }}>
                      <span>{d}</span>
                      <span style={{ color: isSunday ? 'var(--red)' : 'var(--text)', fontWeight: isSunday ? 700 : 500 }}>
                        {s.hours?.[key] || '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h3 className="mb-8">Location</h3>
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-2)', minHeight: 200, display: 'grid', placeItems: 'center' }}>
                <div className="text-center small dim" style={{ padding: 24 }}>
                  <Icon name="pin" size={26} style={{ marginBottom: 8, opacity: 0.6 }} />
                  <div>Google Maps placeholder</div>
                  <div className="small" style={{ fontSize: 12 }}>{s.address}</div>
                </div>
              </div>
            </div>
          </div>

          <form className="card" onSubmit={submit} noValidate>
            <h3 className="mb-16">Send us a message</h3>
            <div className="grid grid-2" style={{ gap: 14 }}>
              <div className="field" style={{ margin: 0 }}>
                <label className="label" htmlFor="c-name">Name *</label>
                <input id="c-name" className="input" value={form.name} onChange={set('name')} placeholder="Your name" />
                {errors.name && <p className="form-error">{errors.name}</p>}
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="label" htmlFor="c-email">Email *</label>
                <input id="c-email" type="email" className="input" value={form.email} onChange={set('email')} placeholder="you@example.com" />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>
            </div>
            <div className="grid grid-2" style={{ gap: 14, marginTop: 14 }}>
              <div className="field" style={{ margin: 0 }}>
                <label className="label" htmlFor="c-phone">Phone (optional)</label>
                <input id="c-phone" className="input" value={form.phone} onChange={set('phone')} placeholder="+91 …" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="label" htmlFor="c-subject">Subject</label>
                <input id="c-subject" className="input" value={form.subject} onChange={set('subject')} placeholder="Membership enquiry" />
              </div>
            </div>
            <div className="field" style={{ marginTop: 14 }}>
              <label className="label" htmlFor="c-message">Message *</label>
              <textarea id="c-message" className="textarea" value={form.message} onChange={set('message')} placeholder="How can we help?" />
              {errors.message && <p className="form-error">{errors.message}</p>}
            </div>
            <button className="btn btn-primary" disabled={sending}>
              {sending ? 'Sending…' : <>Send message <Icon name="send" size={16} /></>}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
