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
  // Todo botón que dice «Cerrar» recibe su propio color, en claro y en oscuro.
  const texto = typeof children === 'string' ? children.trim().toLowerCase() : '';
  const esCerrar = texto === 'cerrar';
  const esCancelar = texto === 'cancelar';
  const clases = [
    'mca-btn',
    variant === 'primary' ? 'mca-btn--primary' : '',
    variant === 'ghost' ? 'mca-btn--ghost' : '',
    variant === 'danger' ? 'mca-btn--danger' : '',
    variant === 'cerrar' || esCerrar ? 'mca-btn--cerrar' : '',
    size === 'sm' ? 'mca-btn--sm' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={clases} {...rest}>
      {Icon ? (
        <Icon size={size === 'sm' ? 13 : 15} strokeWidth={2.2} />
      ) : esCerrar ? (
        <XCircle size={size === 'sm' ? 13 : 15} strokeWidth={2.2} />
      ) : esCancelar ? (
        <X size={size === 'sm' ? 13 : 15} strokeWidth={2.2} />
      ) : null}
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

// Mensaje flotante por defecto: explica qué se escribe en cada campo del formulario.
const DESCRIPCIONES_CAMPO = {
  'nombre': 'Nombre completo tal como aparece en el documento de identidad.',
  'nombre completo': 'Nombre y apellidos completos de la persona.',
  'nombre del material': 'Referencia comercial del elemento con su calibre o medida.',
  'nombre del rol': 'Nombre legible del rol dentro del sistema.',
  'nombre del servicio': 'Nombre del servicio tal como se mostrará en la cotización.',
  'nombre de la categoría': 'Nombre con el que se agrupan los materiales o servicios.',
  'tipo de documento': 'Tipo de identificación: C.C., C.E., T.I.T. o NIT.',
  'documento': 'Número de identificación sin dígitos de más.',
  'documento / nit': 'Número de identificación tributaria o personal.',
  'número de documento': 'Número único de identificación, no debe repetirse.',
  'nit': 'Número de identificación tributaria de la empresa.',
  'razón social / nombre': 'Nombre registrado tal como aparece en el RUT o la cédula.',
  'razón social / nombre del tercero': 'Nombre o razón social del técnico externo.',
  'tipo de cliente': 'Si el cliente es persona natural o jurídica.',
  'tipo de propiedad': 'Clase de inmueble donde se presta el servicio: residencial, comercial o industrial.',
  'persona de contacto': 'Nombre de la persona que autoriza y recibe el servicio.',
  'número de la persona de contacto': 'Celular directo del contacto para la visita.',
  'teléfono': 'Número fijo o celular para coordinar la visita.',
  'teléfono del cliente': 'Línea principal de contacto del cliente.',
  'correo electrónico': 'Buzón donde se enviará la cotización y los soportes.',
  'correo': 'Buzón electrónico de contacto.',
  'departamento': 'Departamento donde se encuentra la propiedad; limita la lista de municipios.',
  'municipio': 'Municipio o ciudad de la propiedad.',
  'municipio donde reside': 'Municipio de residencia del tercero, se usa para asignar técnicos cercanos.',
  'dirección': 'Dirección completa del predio: calle, número y barrio.',
  'dirección de residencia': 'Dirección del tercero: calle, número y barrio.',
  'dirección del servicio': 'Lugar físico donde se realizará el trabajo.',
  'zona': 'Zona de atención dentro del municipio para la ruta del técnico.',
  'cliente': 'Cliente al que pertenece el documento.',
  'proyecto': 'Nombre interno del trabajo para identificarlo en el listado.',
  'descripcion': 'Explicación breve del alcance del servicio o del material.',
  'descripción del trabajo': 'Qué se va a hacer, paso a paso, en el sitio.',
  'categoria': 'Familia a la que pertenece el elemento.',
  'categoría': 'Familia a la que pertenece el elemento.',
  'unidad de medida': 'Cómo se cuenta el material: metro, unidad, kilogramo, galón.',
  'unidad de cobro': 'Base sobre la cual se cobra el servicio.',
  'unidad por defecto': 'Unidad que se sugiere al crear materiales en esta categoría.',
  'moneda': 'Moneda en la que se registra el precio.',
  'precio': 'Valor unitario del servicio en la moneda seleccionada.',
  'precio unitario': 'Valor de una unidad del material.',
  'precio unitario (cop)': 'Valor de una unidad del material en pesos colombianos.',
  'cantidad': 'Número de unidades del material.',
  'cantidad del material': 'Unidades del material que llevará el técnico.',
  'stock': 'Unidades disponibles en bodega.',
  'stock mínimo': 'Cantidad a partir de la cual el material se considera bajo stock.',
  'stock crítico': 'Cantidad por debajo de la cual no se puede despachar el material.',
  'bajo stock': 'Cantidad con la que el material empieza a marcar alerta amarilla.',
  'horas estimadas': 'Jornadas de trabajo que requiere la actividad.',
  'tiempo estimado': 'Duración total prevista para agendar la actividad.',
  'duración': 'Tiempo que toma ejecutar la actividad.',
  'duración estimada': 'Tiempo previsto de ejecución.',
  'días de vigencia': 'Cuántos días permanece válida la oferta antes de vencer.',
  'vigencia': 'Fecha hasta la cual el cliente puede aceptar la cotización.',
  'vence': 'Fecha límite de la oferta.',
  'iva (%)': 'Porcentaje de impuesto aplicado al total.',
  'descuento (%)': 'Reducción porcentual sobre el subtotal.',
  'emisión': 'Fecha en que se crea la cotización.',
  'fecha de emisión': 'Día en que se expide el documento.',
  'fecha': 'Fecha del registro.',
  'fecha del servicio': 'Día programado para la visita.',
  'fecha programada': 'Día en que se realizará la actividad.',
  'fecha del abono': 'Día en que entró el dinero; se escribe solo.',
  'fecha del pago': 'Día en que se recibió el pago.',
  'hora': 'Hora del registro.',
  'hora de inicio': 'Hora en que arranca la actividad; no puede ser anterior a la hora actual.',
  'hora de finalización': 'Hora en que termina la actividad.',
  'hora del abono': 'Hora en que se recibió el abono; se completa sola.',
  'hora del pago': 'Hora en que se recibió el pago.',
  'horario': 'Franja de atención del día.',
  'método de pago': 'Cómo se realizó la transferencia, efectivo o tarjeta.',
  'monto del abono': 'Valor que el cliente entrega como anticipo.',
  'referencia': 'Número del comprobantes bancario o de la transacción.',
  'referencias': 'Datos de respaldo del pago.',
  'prioridad': 'Qué tan rápido se atiende el servicio: Baja, Media o Alta.',
  'responsable': 'Persona que responde por la actividad.',
  'técnico': 'Técnico externo asignado al trabajo.',
  'técnico responsable': 'Técnico que ejecuta la actividad.',
  'usuario': 'Nombre de acceso de la cuenta.',
  'usuario de acceso': 'Identificador con el que la persona inicia sesión.',
  'contraseña': 'Clave secreta de la cuenta.',
  'confirmar contraseña': 'Repita la misma clave para verificarla.',
  'rol': 'Perfil de permisos asignado a la cuenta.',
  'estado': 'Situación actual del registro.',
  'estado del servicio': 'Si el servicio está activo, pausado o inactivo.',
  'estado de la cotización': 'Momento del flujo en que se encuentra la cotización.',
  'estado de la cuenta': 'Si la cuenta puede iniciar sesión o está bloqueada.',
  'nota': 'Comentario libre sobre el registro.',
  'notas': 'Aclaraciones para el técnico o el cliente.',
  'términos y condiciones': 'Condiciones comerciales que acepta el cliente.',
  'garantías': 'Cobertura y tiempo de garantía ofrecida.',
};

export function Field({ label, required, hint, error, full = false, tooltip, children }) {
  // El mensaje flotante muestra la explicación completa al pasar el mouse sobre el campo.
  const descripcionPorEtiqueta = label
    ? DESCRIPCIONES_CAMPO[String(label).trim().toLowerCase()]
    : undefined;
  const mensajeFlotante = tooltip || hint || descripcionPorEtiqueta;

  return (
    <div className={`mca-field ${full ? 'mca-field--full' : ''} ${error ? 'has-error' : ''}`.trim()}>
      {label && (
        <span className="mca-label">
          {label}
          {required && <span className="mca-required">*</span>}
        </span>
      )}
      {mensajeFlotante && (
        <span className="mca-field-tip" role="tooltip">
          {mensajeFlotante}
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

// Une los mensajes de validación pendientes para el toast flotante de cada formulario.
export function resumenErroresFormulario(errores = {}) {
  const pendientes = Object.values(errores).flat().filter(Boolean);
  return pendientes.length
    ? `Completa los mensajes obligatorios: ${pendientes.join(' ')}`
    : '';
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
