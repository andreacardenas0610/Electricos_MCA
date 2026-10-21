import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Search,
  X,
  XCircle,
} from 'lucide-react';

export function PageShell({ children, className = '' }) {
  return <div className={`mca-page ${className}`.trim()}>{children}</div>;
}

export function PageHeader({ title, subtitle, icon: Icon, eyebrow, actions }) {
  return (
    <header className="mca-page-header">
      <div>
        <div className="mca-breadcrumb">Eléctricos MCA / {eyebrow || title}</div>
        <div className="mca-page-heading">
          {Icon && (
            <div className="mca-page-icon">
              <Icon size={22} strokeWidth={1.9} />
            </div>
          )}
          <div>
            <h1 className="mca-page-title">{title}</h1>
            {subtitle && <p className="mca-page-subtitle">{subtitle}</p>}
          </div>
        </div>
      </div>
      {actions && <div className="mca-page-actions">{actions}</div>}
    </header>
  );
}

export function Panel({ title, subtitle, actions, children, flush = false, className = '' }) {
  return (
    <section className={`mca-panel ${className}`.trim()}>
      {(title || actions) && (
        <header className="mca-panel__head">
          <div>
            {title && <h2 className="mca-panel__title">{title}</h2>}
            {subtitle && <p className="mca-panel__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="mca-toolbar__group">{actions}</div>}
        </header>
      )}
      <div className={`mca-panel__body ${flush ? 'mca-panel__body--flush' : ''}`.trim()}>
        {children}
      </div>
    </section>
  );
}

export function KpiCard({ label, value, hint, icon: Icon, tone = 'yellow' }) {
  return (
    <div className={`mca-kpi is-${tone}`}>
      <div>
        <div className="mca-kpi__label">{label}</div>
        <div className="mca-kpi__value">{value}</div>
        {hint && <div className="mca-kpi__hint">{hint}</div>}
      </div>
      {Icon && (
        <div className="mca-kpi__icon">
          <Icon size={18} strokeWidth={2} />
        </div>
      )}
    </div>
  );
}

export function Button({
  children,
  variant = 'secondary',
  size,
  icon: Icon,
  type = 'button',
  className = '',
  ...rest
}) {
  const classes = [
    'mca-btn',
    variant === 'primary' ? 'mca-btn--primary' : '',
    variant === 'ghost' ? 'mca-btn--ghost' : '',
    variant === 'danger' ? 'mca-btn--danger' : '',
    size === 'sm' ? 'mca-btn--sm' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...rest}>
      {Icon && <Icon size={size === 'sm' ? 13 : 15} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Buscar...', disabled = false }) {
  return (
    <div className="mca-search">
      <Search size={15} strokeWidth={2} />
      <input
        className="mca-input"
        type="search"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function Field({ label, required, hint, error, full = false, children }) {
  return (
    <div className={`mca-field ${full ? 'mca-field--full' : ''} ${error ? 'has-error' : ''}`.trim()}>
      {label && (
        <span className="mca-label">
          {label}
          {required && <span className="mca-required">*</span>}
        </span>
      )}
      {children}
      {error ? <span className="mca-error">{error}</span> : hint ? <span className="mca-hint">{hint}</span> : null}
    </div>
  );
}

const BADGE_TONES = new Set([
  'neutral',
  'success',
  'warning',
  'danger',
  'info',
  'indigo',
  'yellow',
]);

export function Badge({ children, tone = 'neutral', className = '' }) {
  return (
    <span className={`mca-badge is-${BADGE_TONES.has(tone) ? tone : 'neutral'} ${className}`.trim()}>
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="mca-empty">
      {Icon && (
        <div className="mca-empty__icon">
          <Icon size={24} strokeWidth={1.8} />
        </div>
      )}
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

export function DetailGrid({ children }) {
  return <dl className="mca-detail-grid">{children}</dl>;
}

export function DetailItem({ label, children, full = false }) {
  return (
    <div className={`mca-detail-item ${full ? 'mca-detail-item--full' : ''}`.trim()}>
      <dt>{label}</dt>
      <dd>{children ?? '—'}</dd>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  size = 'md',
  footer,
  children,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="mca-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        className={`mca-modal ${size === 'sm' ? 'mca-modal--sm' : size === 'lg' ? 'mca-modal--lg' : size === 'xl' ? 'mca-modal--xl' : ''}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Diálogo'}
      >
        <header className="mca-modal__head">
          <div className="mca-row" style={{ alignItems: 'flex-start' }}>
            {Icon && (
              <div className="mca-page-icon" style={{ width: 38, height: 38, borderRadius: 11 }}>
                <Icon size={19} strokeWidth={1.9} />
              </div>
            )}
            <div>
              <h2 className="mca-modal__title">{title}</h2>
              {subtitle && <p className="mca-modal__subtitle">{subtitle}</p>}
            </div>
          </div>
          <button type="button" className="mca-modal__close" onClick={onClose} aria-label="Cerrar">
            <X size={16} strokeWidth={2.2} />
          </button>
        </header>
        <div className="mca-modal__body">{children}</div>
        {footer && <footer className="mca-modal__foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  title = 'Confirmar acción',
  message,
  confirmLabel = 'Eliminar',
  onCancel,
  onConfirm,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      subtitle="Esta acción no se puede deshacer."
      icon={AlertTriangle}
      size="sm"
      footer={
        <>
          <Button onClick={onCancel}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}

const TOAST_ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export function Toast({ toast, onClose }) {
  if (!toast) return null;
  const Icon = TOAST_ICONS[toast.tipo] || Info;

  return (
    <div className={`mca-toast is-${toast.tipo || 'info'}`} role="status">
      <Icon className="mca-toast__icon" size={18} strokeWidth={2} />
      <div>
        <div className="mca-toast__title">{toast.titulo}</div>
        {toast.mensaje && <div className="mca-toast__message">{toast.mensaje}</div>}
      </div>
      <button type="button" className="mca-toast__close" onClick={onClose} aria-label="Cerrar aviso">
        <X size={14} strokeWidth={2.2} />
      </button>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const close = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    setToast(null);
  }, []);

  const notify = useCallback((tipo, titulo, mensaje) => {
    if (timer.current) window.clearTimeout(timer.current);
    setToast({ tipo, titulo, mensaje, id: Date.now() });
    timer.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  return { toast, notify, close };
}

export function Combobox({
  value,
  onChange,
  options = [],
  placeholder = 'Buscar...',
  emptyText = 'Sin resultados',
  disabled = false,
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = options.find((option) => String(option.value) === String(value));

  useEffect(() => {
    const handleOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => {
      const haystack = `${option.label} ${option.meta || ''} ${option.search || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [options, query]);

  const select = (option) => {
    onChange(option.value, option);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="mca-combobox" ref={containerRef}>
      {selected && !open ? (
        <div
          className="mca-combobox__selected"
          onClick={() => {
            if (!disabled) {
              setQuery('');
              setOpen(true);
            }
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              setOpen(true);
            }
          }}
        >
          <span>{selected.label}</span>
          <button
            type="button"
            aria-label="Limpiar selección"
            onClick={(event) => {
              event.stopPropagation();
              onChange('', null);
              setOpen(false);
            }}
          >
            <X size={13} strokeWidth={2.2} />
          </button>
        </div>
      ) : (
        <input
          className="mca-input"
          type="text"
          value={query}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      )}

      {open && !disabled && (
        <div className="mca-combobox__list">
          {filtered.length === 0 ? (
            <div className="mca-combobox__empty">{emptyText}</div>
          ) : (
            filtered.slice(0, 60).map((option) => (
              <button
                key={option.value}
                type="button"
                className={`mca-combobox__option ${String(option.value) === String(value) ? 'is-active' : ''}`.trim()}
                onClick={() => select(option)}
              >
                <span>{option.label}</span>
                {option.meta && <small>{option.meta}</small>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
