/** Small reusable UI primitives. */
import Icon from './Icon.jsx';

export function Loader({ label = 'Loading…' }) {
  return (
    <div role="status" aria-label={label}>
      <div className="spinner" />
      <p className="text-center muted small">{label}</p>
    </div>
  );
}

export function Skeleton({ height = 120, style, className = '' }) {
  return <div className={`skeleton ${className}`} style={{ height, ...style }} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <div className="card" aria-hidden="true">
      <Skeleton height={150} />
      <Skeleton height={20} style={{ marginTop: 16, width: '70%' }} />
      <Skeleton height={14} style={{ marginTop: 10 }} />
      <Skeleton height={14} style={{ marginTop: 8, width: '60%' }} />
    </div>
  );
}

export function EmptyState({ icon = 'info', title, text, children, className = '' }) {
  return (
    <div className={`empty ${className}`}>
      <div className="empty-icon"><Icon name={icon} size={38} strokeWidth={1.5} /></div>
      <h3>{title}</h3>
      {text && <p className="mt-8">{text}</p>}
      {children && <div className="mt-16">{children}</div>}
    </div>
  );
}

export function Badge({ tone = 'gray', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Modal({ open, onClose, title, children, footer, wide = false }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal" style={wide ? { width: 'min(820px, 100%)' } : undefined}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close dialog">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, text, confirmLabel = 'Delete', loading = false }) {
  return (
    <Modal
      open={open} onClose={onClose} title={title}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="muted">{text}</p>
    </Modal>
  );
}

export function PageBanner({ crumb, title, sub, children }) {
  return (
    <div className="page-banner">
      <div className="container">
        {crumb && <div className="crumb">{crumb}</div>}
        <h1 className="h2">{title}</h1>
        {sub && <p className="section-sub" style={{ maxWidth: 640 }}>{sub}</p>}
        {children}
      </div>
    </div>
  );
}

export function StatCard({ icon, label, value, tone = 'orange', sub }) {
  const tones = {
    orange: { bg: 'var(--accent-soft)', color: 'var(--accent-2)' },
    green: { bg: 'var(--green-soft)', color: 'var(--green)' },
    blue: { bg: 'var(--blue-soft)', color: 'var(--blue)' },
    yellow: { bg: 'var(--yellow-soft)', color: 'var(--yellow)' },
    red: { bg: 'var(--red-soft)', color: 'var(--red)' },
    purple: { bg: 'var(--purple-soft)', color: 'var(--purple)' },
  };
  const t = tones[tone] || tones.orange;
  return (
    <div className="card stat-card">
      <div className="stat-card-top">
        <span className="stat-name">{label}</span>
        <span className="stat-icon" style={{ background: t.bg, color: t.color }}><Icon name={icon} size={20} /></span>
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="small dim">{sub}</div>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name="warning" size={38} strokeWidth={1.5} /></div>
      <h3>Something went wrong</h3>
      <p className="mt-8">{message || 'Unable to load this content. Please try again.'}</p>
      {onRetry && (
        <div className="mt-16">
          <button className="btn btn-outline" onClick={onRetry}><Icon name="refresh" size={17} /> Try again</button>
        </div>
      )}
    </div>
  );
}

export function Avatar({ name, color, size = 30 }) {
  const initials = (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span className="avatar" style={{ width: size, height: size, background: color || 'var(--accent)', fontSize: size * 0.42 }} aria-hidden="true">
      {initials}
    </span>
  );
}

export function RatingStars({ value = 5, size = 15 }) {
  return (
    <span className="rating" aria-label={`${value} out of 5 stars`}>
      {'★'.repeat(value)}<span style={{ color: 'var(--text-3)' }}>{'★'.repeat(5 - value)}</span>
    </span>
  );
}
