/** Public Home — hero, stats, features, machines, programmes, plans,
 *  how-it-works, testimonials, CTA. All content comes from gym settings. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi, useReveal, useTitle } from '../../hooks/useApi.js';
import { publicApi } from '../../services/api.js';
import Icon from '../../components/ui/Icon.jsx';
import { Loader, SkeletonCard, RatingStars, Avatar, ErrorBox } from '../../components/ui/Primitives.jsx';
import MachineArt from '../../components/workout/MachineArt.jsx';
import { fmt } from '../../services/api.js';

function useSiteContent() {
  const settings = useApi(publicApi.settings, []);
  const machines = useApi(() => publicApi.machines({ popular: 'true' }), []);
  const plans = useApi(publicApi.plans, []);
  const memberships = useApi(publicApi.memberships, []);
  const testimonials = useApi(publicApi.testimonials, []);
  return { settings, machines, plans, memberships, testimonials };
}

export default function HomePage() {
  useTitle('');
  useReveal();
  const { settings, machines, plans, memberships, testimonials } = useSiteContent();

  if (settings.loading) return <div style={{ padding: '120px 0' }}><Loader label="Loading the gym…" /></div>;
  if (settings.error) return <div className="container section"><ErrorBox message={settings.error} onRetry={settings.refetch} /></div>;

  const s = settings.data?.settings || {};
  const stats = [
    { num: s.stats?.machines, label: s.stats?.machinesLabel || 'Fitness Machines' },
    { num: s.stats?.trainers, label: s.stats?.trainersLabel || 'Expert Trainers' },
    { num: s.stats?.members, label: s.stats?.membersLabel || 'Active Members' },
    { num: s.stats?.years, label: s.stats?.yearsLabel || 'Years of Strength' },
  ];

  const features = [
    { icon: 'clipboard', title: 'Personalised Workouts', text: 'A weekly Monday–Saturday plan built from your level, goal and equipment. Sunday is always rest.' },
    { icon: 'dumbbell', title: 'Machine-by-Machine Guides', text: 'Step-by-step instructions, breathing, sets & reps, mistakes to avoid and safety tips for every machine.' },
    { icon: 'chart', title: 'Progress Tracking', text: 'Streaks, workout frequency, volume trends and attendance — real numbers from your real sessions.' },
    { icon: 'shield', title: 'Safety-First Training', text: 'Every exercise page carries safety guidance, and beginners are always pointed toward trainer supervision.' },
    { icon: 'book', title: 'Nutrition Education', text: 'Balanced, evidence-based articles on protein, hydration, sleep and meal planning — no crash diets.' },
    { icon: 'qr', title: 'Smart Check-In', text: 'Scan your QR code at reception. Attendance, streaks and membership status update automatically.' },
  ];

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <span className="eyebrow">Smart Gym Platform</span>
            <h1>
              <span className="grad-text">{(s.heroTitle || 'BUILD YOUR STRONGER SELF').split(' ').slice(0, -1).join(' ')}</span>{' '}
              {(s.heroTitle || 'BUILD YOUR STRONGER SELF').split(' ').slice(-1)}
            </h1>
            <p className="lead">{s.heroSubtitle || 'A modern gym with a smart workout platform built around you.'}</p>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-primary btn-lg">Join Now <Icon name="arrow-right" size={18} /></Link>
              <Link to="/workouts" className="btn btn-outline btn-lg">Explore Workouts</Link>
              <Link to="/membership" className="btn btn-ghost btn-lg">View Memberships</Link>
            </div>
          </div>
          <div className="hero-img">
            <img src="/img/hero.jpg" alt="Athlete training with a barbell in a dark modern gym" width={880} height={748} loading="eager" />
            <div className="hero-float">
              <span className="stat-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent-2)' }}><Icon name="flame" size={19} /></span>
              <div>
                <strong>Sunday = Rest Day</strong>
                <div className="small dim">Recovery is part of the plan</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="container" style={{ paddingBottom: 70 }}>
          <div className="stats-strip reveal">
            {stats.map((st, i) => (
              <div className="stat-box" key={i}>
                <div className="stat-num">{st.num}</div>
                <div className="stat-label">{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why choose us ────────────────────────────────────────── */}
      <section className="section" id="why-us">
        <div className="container">
          <div className="section-head center reveal">
            <span className="eyebrow">Why IronPulse</span>
            <h2 className="section-title">More than a gym. <span className="grad-text">A smart training system.</span></h2>
            <p className="section-sub">Every membership comes with a digital trainer: your plan, your progress, your machines — all connected.</p>
          </div>
          <div className="grid grid-3">
            {features.map((f, i) => (
              <div className="card card-hover reveal" key={i}>
                <span className="stat-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent-2)', marginBottom: 14 }}>
                  <Icon name={f.icon} size={20} />
                </span>
                <h3 style={{ marginBottom: 8 }}>{f.title}</h3>
                <p className="muted" style={{ fontSize: 14.5 }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular machines ─────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg-2)', borderBlock: '1px solid var(--border)' }} id="machines">
        <div className="container">
          <div className="flex-between mb-24 reveal">
            <div>
              <span className="eyebrow">Equipment</span>
              <h2 className="section-title">Popular Machines</h2>
              <p className="section-sub">Full coaching guides for every piece of equipment in the gym.</p>
            </div>
            <Link to="/machines" className="btn btn-outline">All machines <Icon name="arrow-right" size={17} /></Link>
          </div>
          {machines.loading ? (
            <div className="grid grid-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
          ) : (
            <div className="grid grid-4">
              {(machines.data?.machines || []).slice(0, 8).map((m) => (
                <Link to={`/machines/${m.slug}`} className="card card-pad-sm card-hover reveal" key={m.id}>
                  <MachineArt category={m.category} label={m.muscleGroup} />
                  <h3 style={{ fontSize: 16, margin: '12px 0 4px' }}>{m.name}</h3>
                  <div className="flex gap-6 flex-wrap">
                    <span className="badge badge-orange">{m.muscleGroup}</span>
                    <span className="badge badge-gray">{m.difficulty}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Programmes ───────────────────────────────────────────── */}
      <section className="section" id="programs">
        <div className="container">
          <div className="section-head center reveal">
            <span className="eyebrow">Training Programmes</span>
            <h2 className="section-title">A plan built <span className="grad-text">for your goal</span></h2>
            <p className="section-sub">Choose your goal at registration and the smart engine builds your weekly schedule.</p>
          </div>
          {plans.loading ? (
            <div className="grid grid-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
          ) : (
            <div className="grid grid-3">
              {(plans.data?.plans || []).slice(0, 3).map((p) => (
                <div className="card card-hover reveal" key={p.id}>
                  <div className="flex-between">
                    <span className="badge badge-orange">{fmt.levelLabel(p.fitnessLevel)}</span>
                    <span className="small dim">{p.daysPerWeek} days/week</span>
                  </div>
                  <h3 style={{ margin: '12px 0 8px' }}>{p.name}</h3>
                  <p className="muted small" style={{ marginBottom: 14 }}>{p.description}</p>
                  <div className="divider" />
                  <div className="small dim">
                    {Object.entries(p.schedule || {}).slice(0, 3).map(([d, c]) => (
                      <div key={d} className="flex" style={{ gap: 8, padding: '3px 0' }}>
                        <span style={{ width: 42, fontWeight: 700, color: 'var(--text-2)' }}>{d.slice(0, 3)}</span>
                        <span>{c.focus}</span>
                      </div>
                    ))}
                  </div>
                  <Link to="/programs" className="btn btn-outline btn-block btn-sm mt-16">View programme</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg-2)', borderBlock: '1px solid var(--border)' }} id="how">
        <div className="container">
          <div className="section-head center reveal">
            <span className="eyebrow">How it works</span>
            <h2 className="section-title">From sign-up to <span className="grad-text">stronger</span> in 4 steps</h2>
          </div>
          <div className="grid grid-4">
            {[
              { icon: 'user', t: 'Create your profile', d: 'Sign up and tell us your level, goal, and the days you can train.' },
              { icon: 'sparkle', t: 'Get your smart plan', d: 'The engine builds your Monday–Saturday schedule. Sunday stays rest.' },
              { icon: 'play', t: 'Train with guidance', d: 'Follow machine guides, timers and set tracking in the workout player.' },
              { icon: 'chart', t: 'Watch progress', d: 'Streaks, charts and attendance show your consistency compounding.' },
            ].map((s, i) => (
              <div className="card reveal text-center" key={i}>
                <span className="stat-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent-2)', margin: '0 auto 14px' }}>
                  <Icon name={s.icon} size={21} />
                </span>
                <div className="small dim" style={{ marginBottom: 6 }}>STEP {i + 1}</div>
                <h3 style={{ fontSize: 17, marginBottom: 8 }}>{s.t}</h3>
                <p className="muted small">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Membership plans ─────────────────────────────────────── */}
      <section className="section" id="membership">
        <div className="container">
          <div className="section-head center reveal">
            <span className="eyebrow">Membership</span>
            <h2 className="section-title">Pick your <span className="grad-text">plan</span></h2>
            <p className="section-sub">Every plan includes gym access and the full machine-guide library.</p>
          </div>
          {memberships.loading ? (
            <div className="grid grid-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
          ) : (
            <div className="grid grid-3" style={{ alignItems: 'stretch' }}>
              {(memberships.data?.memberships || []).map((m) => (
                <div className="card card-hover reveal" key={m.id}
                  style={m.popular ? { borderColor: 'rgba(255,92,28,0.55)', boxShadow: '0 0 0 1px rgba(255,92,28,0.2)' } : undefined}>
                  {m.popular && <span className="badge badge-orange" style={{ position: 'absolute' }}>MOST POPULAR</span>}
                  <div style={{ marginTop: m.popular ? 26 : 0 }}>
                    <h3 style={{ fontSize: 17, letterSpacing: '0.06em' }}>{m.name}</h3>
                    <div className="flex" style={{ alignItems: 'baseline', gap: 4, margin: '10px 0 4px' }}>
                      <span style={{ fontSize: 34, fontWeight: 800 }}>{fmt.money(m.price, m.currency)}</span>
                      <span className="muted small">/ month</span>
                    </div>
                    <p className="muted small" style={{ marginBottom: 14 }}>{m.description}</p>
                    <ul className="small muted" style={{ listStyle: 'none', marginBottom: 18 }}>
                      {m.features.map((f, i) => (
                        <li key={i} className="flex gap-8" style={{ padding: '4px 0' }}>
                          <Icon name="check" size={15} style={{ color: 'var(--green)', flexShrink: 0 }} /> {f}
                        </li>
                      ))}
                    </ul>
                    <Link to="/register" className={`btn btn-block ${m.popular ? 'btn-primary' : 'btn-outline'}`}>
                      {m.popular ? 'Start with ' + m.name : 'Choose ' + m.name}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg-2)', borderBlock: '1px solid var(--border)' }} id="testimonials">
        <div className="container">
          <div className="section-head center reveal">
            <span className="eyebrow">Testimonials</span>
            <h2 className="section-title">Members <span className="grad-text">love it here</span></h2>
          </div>
          {testimonials.loading ? (
            <div className="grid grid-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
          ) : (
            <div className="grid grid-3">
              {(testimonials.data?.testimonials || []).slice(0, 3).map((t) => (
                <div className="card card-hover reveal" key={t.id}>
                  <RatingStars value={t.rating} />
                  <p className="muted" style={{ fontSize: 14.5, margin: '12px 0 16px' }}>“{t.text}”</p>
                  <div className="flex" style={{ gap: 10 }}>
                    <Avatar name={t.name} color={t.color} size={38} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{t.name}</div>
                      <div className="small dim">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="card reveal text-center" style={{
            padding: '56px 24px',
            background: 'radial-gradient(600px 300px at 50% 0%, rgba(255,92,28,0.22), transparent 70%), var(--surface)',
            borderColor: 'rgba(255,92,28,0.35)',
          }}>
            <h2 className="section-title">Your first workout is <span className="grad-text">one click away</span></h2>
            <p className="section-sub" style={{ maxWidth: 520, marginInline: 'auto' }}>
              Join IronPulse today — your personalised weekly plan will be waiting the moment you log in.
            </p>
            <div className="flex gap-16" style={{ justifyContent: 'center', marginTop: 24 }}>
              <Link to="/register" className="btn btn-primary btn-lg">Join Now</Link>
              <Link to="/contact" className="btn btn-outline btn-lg">Talk to us</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
