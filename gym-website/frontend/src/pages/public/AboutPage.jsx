/** About — story, mission, vision, facilities, philosophy, safety. */
import { Link } from 'react-router-dom';
import { useApi, useReveal, useTitle } from '../../hooks/useApi.js';
import { publicApi } from '../../services/api.js';
import Icon from '../../components/ui/Icon.jsx';
import { PageBanner, Loader, ErrorBox } from '../../components/ui/Primitives.jsx';

export default function AboutPage() {
  useTitle('About Us');
  useReveal();
  const settings = useApi(publicApi.settings, []);
  const s = settings.data?.settings || {};

  if (settings.loading) return <Loader />;
  if (settings.error) return <div className="container section"><ErrorBox message={settings.error} onRetry={settings.refetch} /></div>;

  const facilities = [
    { icon: 'dumbbell', t: '50+ Machines & Free Weights', d: 'Chest, back, legs, shoulders, arms, cardio and a full free-weights zone — each with its own coaching guide.' },
    { icon: 'users', t: 'Qualified Trainers', d: 'Certified trainers available for technique, programme help and consultation. Learn proper form before lifting independently.' },
    { icon: 'activity', t: 'Cardio Zone', d: 'Treadmills, cross trainers, bikes, rowers and stair climbers for endurance and heart health.' },
    { icon: 'shield', t: 'Safety-First Culture', d: 'Safety pins, spotters on request, machine guides with precautions, and a strict no-ego-lifting policy.' },
    { icon: 'qr', t: 'Smart Check-In', d: 'QR-based attendance, monthly reports, and automatic workout logging.' },
    { icon: 'sparkle', t: 'Clean & Spacious', d: 'Sanitised equipment, ventilated training floors, changing rooms and lockers.' },
  ];

  const values = [
    { t: 'Mission', d: 'To make strength training accessible, safe and sustainable — by pairing a great gym with a smart digital coach that guides every member, every day.' },
    { t: 'Vision', d: 'A fitness community where every member trains with confidence, tracks real progress, and builds habits that last a lifetime.' },
    { t: 'Philosophy', d: 'Consistency beats intensity. We build plans that fit real schedules, respect rest days, and never chase shortcuts or extreme methods.' },
  ];

  return (
    <main>
      <PageBanner crumb={<Link to="/">Home</Link>} title="About IronPulse" sub="A gym built for one thing: helping you become stronger — safely, consistently, and with real guidance." />

      <section className="section-tight">
        <div className="container grid" style={{ gridTemplateColumns: '1.1fr 0.9fr', gap: 40, alignItems: 'center' }}>
          <div className="reveal">
            <span className="eyebrow">Our story</span>
            <h2 className="h3" style={{ fontSize: 26, marginBottom: 14 }}>From a single room to a smart training platform</h2>
            <p className="muted" style={{ marginBottom: 12 }}>
              {s.gymName || 'IronPulse Gym'} started with a simple belief: most people don't fail at fitness because they lack motivation —
              they fail because they don't know <em>what to do</em> and <em>how to do it safely</em>.
            </p>
            <p className="muted" style={{ marginBottom: 12 }}>
              So we built a gym where every machine has a coaching guide, every member gets a personalised Monday–Saturday plan,
              and every session is tracked automatically. Sunday is always a rest day — recovery is part of the programme, not an afterthought.
            </p>
            <p className="muted">
              Today our smart platform handles workouts, attendance, progress analytics and nutrition education —
              while our trainers stay available for the things an app can't do: watching your form and keeping you safe.
            </p>
          </div>
          <div className="reveal">
            <img src="/img/about.jpg" alt="Inside the IronPulse gym — training floor with machines" style={{ borderRadius: 20, border: '1px solid var(--border)' }} loading="lazy" />
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-2)', borderBlock: '1px solid var(--border)' }}>
        <div className="container">
          <div className="grid grid-3">
            {values.map((v, i) => (
              <div className="card reveal" key={i}>
                <span className="badge badge-orange" style={{ marginBottom: 10 }}>{v.t}</span>
                <p className="muted" style={{ fontSize: 15 }}>{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Facilities</span>
            <h2 className="section-title">Everything you need, <span className="grad-text">nothing you don't</span></h2>
          </div>
          <div className="grid grid-3">
            {facilities.map((f, i) => (
              <div className="card card-hover reveal" key={i}>
                <span className="stat-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent-2)', marginBottom: 12 }}>
                  <Icon name={f.icon} size={20} />
                </span>
                <h3 style={{ fontSize: 16.5, marginBottom: 6 }}>{f.t}</h3>
                <p className="muted small">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-2)', borderBlock: '1px solid var(--border)' }}>
        <div className="container">
          <div className="card reveal" style={{ borderColor: 'rgba(251,191,36,0.35)', background: 'rgba(251,191,36,0.04)' }}>
            <div className="flex" style={{ gap: 14, alignItems: 'flex-start' }}>
              <span className="stat-icon" style={{ background: 'var(--yellow-soft)', color: 'var(--yellow)', flexShrink: 0 }}>
                <Icon name="shield" size={20} />
              </span>
              <div>
                <h3 style={{ marginBottom: 8 }}>Our safety commitment</h3>
                <p className="muted" style={{ fontSize: 14.5 }}>
                  The guidance on this platform is general fitness education. It does not replace a qualified personal trainer, doctor,
                  physiotherapist, or registered dietitian. For beginners, injuries, or medical conditions, we recommend training under
                  professional supervision — our trainers are always available for technique help.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
