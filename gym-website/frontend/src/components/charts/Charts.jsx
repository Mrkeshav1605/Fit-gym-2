/** Charts built on plain SVG — no chart library, tiny and fast. */
import Icon from '../ui/Icon.jsx';

const PALETTE = ['#ff5c1c', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#94a3b8', '#38bdf8'];

export function BarChart({ data = [], height = 190, unit = '' }) {
  if (!data.length) return null;
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 640;
  const H = height;
  const pad = 26;
  const bw = (W - pad * 2) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="Bar chart">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={pad} x2={W - pad} y1={H - 30 - (H - 56) * f} y2={H - 30 - (H - 56) * f} stroke="var(--border)" strokeDasharray="3 5" />
      ))}
      {data.map((d, i) => {
        const h = ((H - 56) * d.value) / max;
        const x = pad + bw * i;
        return (
          <g key={i}>
            <rect x={x + bw * 0.22} y={H - 30 - h} width={bw * 0.56} height={h} rx={7} fill="var(--accent)" opacity={0.88}>
              <title>{`${d.label}: ${d.value}${unit}`}</title>
            </rect>
            <text x={x + bw / 2} y={H - 12} textAnchor="middle" fontSize="11.5" fill="var(--text-3)">{d.label}</text>
            <text x={x + bw / 2} y={H - 34 - h} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text-2)">{d.value}{unit}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function LineChart({ data = [], height = 190, color = '#ff5c1c', unit = '' }) {
  if (!data.length) return null;
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 640;
  const H = height;
  const pad = 26;
  const pts = data.map((d, i) => ({
    x: pad + ((W - pad * 2) * i) / Math.max(1, data.length - 1),
    y: H - 30 - ((H - 56) * d.value) / max,
    ...d,
  }));
  const line = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${pad},${H - 30} ${line} ${W - pad},${H - 30}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="Line chart">
      <defs>
        <linearGradient id="lg-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#lg-area)" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4.4" fill="var(--bg)" stroke={color} strokeWidth="2.4">
            <title>{`${p.label}: ${p.value}${unit}`}</title>
          </circle>
          <text x={p.x} y={H - 12} textAnchor="middle" fontSize="11.5" fill="var(--text-3)">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

export function DonutChart({ data = [], size = 168, thickness = 21 }) {
  const total = Math.max(1, data.reduce((s, d) => s + d.value, 0));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex" style={{ flexWrap: 'wrap', gap: 22, alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Distribution chart">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * c;
          const el = (
            <circle
              key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={PALETTE[i % PALETTE.length]} strokeWidth={thickness}
              strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-offset}
              strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
            >
              <title>{`${d.label}: ${d.value}`}</title>
            </circle>
          );
          offset += dash;
          return el;
        })}
        <text x="50%" y="47%" textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--text)">{total}</text>
        <text x="50%" y="59%" textAnchor="middle" fontSize="11" fill="var(--text-3)">sessions</text>
      </svg>
      <div className="legend" style={{ flexDirection: 'column', alignItems: 'flex-start', margin: 0 }}>
        {data.map((d, i) => (
          <div key={i}>
            <span className="legend-dot" style={{ background: PALETTE[i % PALETTE.length] }} />
            {d.label} · <strong style={{ color: 'var(--text)' }}>{d.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressRing({ value = 0, max = 100, size = 96, label, thickness = 9 }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(pct)}% complete`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={thickness}
          strokeDasharray={`${(pct / 100) * c} ${c}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="48%" textAnchor="middle" fontSize={size * 0.24} fontWeight="800" fill="var(--text)">{Math.round(pct)}%</text>
        {label && <text x="50%" y="64%" textAnchor="middle" fontSize="10.5" fill="var(--text-3)">{label}</text>}
      </svg>
      <div>
        <div className="ring-num">{value}<span className="muted" style={{ fontSize: 15 }}> / {max}</span></div>
        <div className="small muted">{label}</div>
      </div>
    </div>
  );
}

export function Heatmap({ weeks = [] }) {
  if (!weeks.length) return <p className="muted small">No activity data yet.</p>;
  return (
    <div className="heatmap" role="img" aria-label="Attendance heat map">
      {weeks.map((w, i) => (
        <div key={i} className="heat-week">
          <div className="heat-label">{w.label}</div>
          {w.days.map((d, j) => (
            <div
              key={j}
              className={`heat-day ${d.attended ? 'attended' : ''} ${d.workedOut && !d.attended ? 'worked' : ''} ${d.isSunday ? 'sunday' : ''} ${d.inFuture ? 'future' : ''}`}
              title={`${d.date}: ${d.attended ? 'Present' : d.workedOut ? 'Workout logged' : d.isSunday ? 'Closed (Sunday)' : 'No visit'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyChart({ icon = 'chart' }) {
  return (
    <div className="empty" style={{ padding: '36px 20px' }}>
      <div className="empty-icon"><Icon name={icon} size={30} strokeWidth={1.5} /></div>
      <p className="small">No data yet — complete your first workout to see this chart.</p>
    </div>
  );
}
