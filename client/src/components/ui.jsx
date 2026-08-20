import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export function Spinner() {
  return <div className="spinner-container"><div className="spinner" /></div>;
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={48} strokeWidth={1.5} />}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}

export function Badge({ children, color = '#6b7280', dot }) {
  return (
    <span className="badge" style={{ background: color + '18', color, borderColor: color + '30' }}>
      {dot && <span className="badge-dot" style={{ background: color }} />}
      {children}
    </span>
  );
}

export function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="search-wrapper">
      <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input className="search-input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export function Input({ label, error, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input className={`form-input ${error ? 'error' : ''}`} {...props} />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

export function Textarea({ label, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <textarea className="form-textarea" {...props} />
    </div>
  );
}

export function Select({ label, options, placeholder, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select className="form-select" {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  const { t } = useTranslation();
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function BackButton({ to }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <button className="back-btn" onClick={() => navigate(to || -1)}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
      {t('back')}
    </button>
  );
}

export function StatusBadge({ status }) {
  const { t } = useTranslation();
  const colors = { draft: '#6b7280', sent: '#3b82f6', paid: '#22c55e', overdue: '#ef4444', cancelled: '#9ca3af' };
  return <Badge color={colors[status] || '#6b7280'}>{t(status === 'paid' ? 'paid_label' : status)}</Badge>;
}
