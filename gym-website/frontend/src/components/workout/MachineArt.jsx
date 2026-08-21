/** Machine illustration — category-colored SVG art for machine cards. */
import { CATEGORY_COLORS } from '../../utils/labels.js';

/* Stylised equipment silhouettes per category (24×24 viewBox paths). */
const ART = {
  Chest: <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"><path d="M3 8v8M21 8v8M6 9.5h12M6 14.5h12M6 12h12M5 6h3v12H5M16 6h3v12h-3" /></g>,
  Back: <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"><path d="M4 4h16M4 20h16M6 4v3c0 4 2.5 6 6 6s6-2 6-6V4" /></g>,
  Legs: <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"><path d="M5 5h14M7 5v14M17 5v14M7 12h10" /><path d="M4 21h16" /></g>,
  Shoulders: <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"><path d="M4 8h16M8 8v11M16 8v11M6 5h12" /><path d="M4 21h16" /></g>,
  Arms: <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"><path d="M8 5v14M16 5v14M5 8h6M5 14h6M13 8h6M13 14h6" /></g>,
  Cardio: <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"><path d="M3 13h3l2-4 3 8 3-10 2.5 6H21" /></g>,
  'Free Weights': <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"><path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11" /></g>,
  Core: <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"><circle cx="12" cy="12" r="8.2" /><circle cx="12" cy="12" r="4.4" /><circle cx="12" cy="12" r="0.8" fill="currentColor" /></g>,
  'Full Body': <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"><circle cx="12" cy="5.5" r="2.2" /><path d="M12 8v5M12 10l-3.5 2.5M12 10l3.5 2.5M12 13v5M12 18l-3 4M12 18l3 4" /></g>,
};

export default function MachineArt({ category = 'Chest', label, className = '' }) {
  const color = CATEGORY_COLORS[category] || '#ff5c1c';
  return (
    <div
      className={`machine-art ${className}`}
      style={{ '--art-soft': `${color}26`, color }}
      role="img" aria-label={`${label || category} illustration`}
    >
      <svg viewBox="0 0 24 24">{ART[category] || ART.Chest}</svg>
      {label && <span className="art-label">{label}</span>}
    </div>
  );
}
