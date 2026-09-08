import { useContext, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext.jsx';

const configuraciones = {
  clientes: {
    titulo: 'Clientes',
    subtitulo: 'Administra las empresas y personas que solicitan servicios eléctricos.',
    icono: '🏢',
    metricaIconos: ['👥', '🔎', '✅'],
    almacenamiento: 'mca_clientes',
    columnas: [
      ['nombre', 'Nombre / Razón social'],
      ['tipoPropiedad', 'Tipo de propiedad'],
      ['documento', 'Documento / NIT'],
      ['contacto', 'Contacto'],
      ['telefono', 'Teléfono'],
      ['estado', 'Estado'],
    ],
    campos: [
      ['nombre', 'Nombre o razón social', 'text'],
      ['documento', 'Documento o NIT', 'text'],
      ['contacto', 'Persona de contacto', 'text'],
      ['telefono', 'Teléfono', 'tel'],
      ['correo', 'Correo electrónico', 'email'],
      ['direccion', 'Dirección', 'text'],
      ['tipoPropiedad', 'Tipo de propiedad', 'segmented', ['Residencial', 'Comercial', 'Industrial']],
    ],
    iniciales: [
      { id: 1, nombre: 'Constructora Horizonte S.A.', tipoPropiedad: 'Comercial', documento: '900.458.221-1', contacto: 'Laura Villamizar', telefono: '300 458 2211', correo: 'contacto@horizonte.com', direccion: 'Av. Central 450', estado: 'Activo' },
      { id: 2, nombre: 'Corporativo Andes S.A.', tipoPropiedad: 'Industrial', documento: '901.220.874-6', correo: 'compras@andes.com', contacto: 'Carlos Ruiz', telefono: '310 854 9021', direccion: 'Zona Industrial Sur', estado: 'Activo' },
    ],
  },
  terceros: {
    titulo: 'Gestión de Terceros',
    subtitulo: 'Controla proveedores, contratistas y aliados de la operación.',
    icono: '🤝',
    metricaIconos: ['🤝', '🔎', '✅'],
    almacenamiento: 'mca_terceros',
    columnas: [
      ['nombre', 'Tercero'],
      ['tipo', 'Tipo'],
      ['documento', 'Documento / NIT'],
      ['contacto', 'Contacto'],
      ['estado', 'Estado'],
    ],
    campos: [
      ['nombre', 'Nombre o razón social', 'text'],
      ['tipo', 'Tipo de tercero', 'select', ['Proveedor', 'Contratista', 'Aliado']],
      ['documento', 'Documento o NIT', 'text'],
      ['contacto', 'Persona de contacto', 'text'],
      ['telefono', 'Teléfono', 'tel'],
      ['correo', 'Correo electrónico', 'email'],
    ],
    iniciales: [
      { id: 1, nombre: 'Suministros Eléctricos del Norte', tipo: 'Proveedor', documento: '800.113.442-8', contacto: 'Miguel Torres', telefono: '320 111 2345', correo: 'ventas@suministros.com', estado: 'Activo' },
      { id: 2, nombre: 'Montajes Industriales MCA', tipo: 'Contratista', documento: '901.765.009-2', contacto: 'Ana Gómez', telefono: '315 776 0088', correo: 'operaciones@montajes.com', estado: 'Activo' },
    ],
  },
  ordenes: {
    titulo: 'Órdenes de Servicio',
    subtitulo: 'Crea, consulta y actualiza el seguimiento de los trabajos contratados.',
    icono: '🧾',
    metricaIconos: ['🧾', '🔎', '⚙️'],
    almacenamiento: 'mca_ordenes',
    columnas: [
      ['codigo', 'Código'],
      ['cliente', 'Cliente'],
      ['servicio', 'Servicio'],
      ['fecha', 'Fecha programada'],
      ['responsable', 'Responsable'],
      ['estado', 'Estado'],
    ],
    campos: [
      ['codigo', 'Código de orden', 'text'],
      ['cliente', 'Cliente', 'text'],
      ['servicio', 'Servicio solicitado', 'text'],
      ['fecha', 'Fecha programada', 'date'],
      ['responsable', 'Técnico responsable', 'text'],
      ['estado', 'Estado', 'select', ['Pendiente', 'Programada', 'En ejecución', 'Finalizada', 'Cancelada']],
    ],
    iniciales: [
      { id: 1, codigo: 'OS-9842', cliente: 'Corporativo Andes S.A.', servicio: 'Mantenimiento preventivo', fecha: '2026-09-12', responsable: 'Carlos Ruiz', estado: 'Programada' },
      { id: 2, codigo: 'OS-9845', cliente: 'Constructora Horizonte S.A.', servicio: 'Instalación de celdas', fecha: '2026-09-15', responsable: 'Marta Gómez', estado: 'Pendiente' },
    ],
  },
};

const estadoColor = (estado) => {
  if (['Activo', 'Finalizada'].includes(estado)) return { backgroundColor: '#dcfce7', color: '#166534' };
  if (['En ejecución', 'Programada'].includes(estado)) return { backgroundColor: '#dbeafe', color: '#1d4ed8' };
  if (['Cancelada', 'Inactivo'].includes(estado)) return { backgroundColor: '#fee2e2', color: '#b91c1c' };
  return { backgroundColor: '#fef3c7', color: '#92400e' };
};

const estadoIcono = (estado) => {
  if (['Activo', 'Finalizada'].includes(estado)) return '✓';
  if (['En ejecución', 'Programada'].includes(estado)) return '●';
  if (['Cancelada', 'Inactivo'].includes(estado)) return '×';
  return '!';
};

const siguienteEstado = (modulo, estado) => {
  const estados = modulo === 'ordenes'
    ? ['Pendiente', 'Programada', 'En ejecución', 'Finalizada', 'Cancelada']
    : ['Activo', 'Inactivo'];
  return estados[(estados.indexOf(estado) + 1) % estados.length];
};

export function ModuloGestion({ modulo }) {
  const config = configuraciones[modulo];
  const { theme: temaGlobal, toggleTheme } = useContext(ThemeContext);
  const esOscuro = temaGlobal === 'dark';
  const [registros, setRegistros] = useState(() => {
    const guardados = localStorage.getItem(config.almacenamiento);
    return guardados ? JSON.parse(guardados) : config.iniciales;
  });
  const [busqueda, setBusqueda] = useState('');
  const [registroEditado, setRegistroEditado] = useState(null);
  const [registroDetalle, setRegistroDetalle] = useState(null);
  const [registroAEliminar, setRegistroAEliminar] = useState(null);
  const [notificacion, setNotificacion] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    localStorage.setItem(config.almacenamiento, JSON.stringify(registros));
  }, [config.almacenamiento, registros]);

  useEffect(() => {
    if (!notificacion) return undefined;
    const temporizador = setTimeout(() => setNotificacion(null), 3500);
    return () => clearTimeout(temporizador);
  }, [notificacion]);

  const registrosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return registros;
    return registros.filter((registro) => Object.values(registro).some((valor) => String(valor).toLowerCase().includes(texto)));
  }, [busqueda, registros]);

  const abrirNuevo = () => {
    const valoresIniciales = Object.fromEntries(config.campos.map(([nombre, , tipo, opciones]) => [nombre, ['select', 'segmented'].includes(tipo) ? opciones[0] : '']));
    setRegistroEditado({ id: Date.now(), ...valoresIniciales });
    setMostrarFormulario(true);
  };

  const guardarRegistro = (evento) => {
    evento.preventDefault();
    if (!registroEditado) {
      setNotificacion({ tipo: 'error', titulo: 'No se pudo guardar', mensaje: 'No hay información válida para guardar.' });
      return;
    }
    setRegistros((actuales) => {
      const existe = actuales.some((registro) => registro.id === registroEditado.id);
      return existe ? actuales.map((registro) => registro.id === registroEditado.id ? registroEditado : registro) : [registroEditado, ...actuales];
    });
    setMostrarFormulario(false);
    setRegistroEditado(null);
    setNotificacion({ tipo: 'success', titulo: 'Registro guardado', mensaje: 'La información se guardó correctamente.' });
  };

  const eliminarRegistro = (id) => {
    setRegistroAEliminar(registros.find((registro) => registro.id === id));
  };

  const confirmarEliminacion = () => {
    if (!registroAEliminar) {
      setNotificacion({ tipo: 'error', titulo: 'No se pudo eliminar', mensaje: 'No se encontró el registro seleccionado.' });
      return;
    }
    setRegistros((actuales) => actuales.filter((registro) => registro.id !== registroAEliminar.id));
    setRegistroAEliminar(null);
    setNotificacion({ tipo: 'success', titulo: 'Registro eliminado', mensaje: 'El registro se eliminó correctamente.' });
  };

  const cambiarEstado = (id) => {
    setRegistros((actuales) => actuales.map((registro) => registro.id === id ? { ...registro, estado: siguienteEstado(modulo, registro.estado) } : registro));
  };

  const tema = esOscuro ? {
    page: '#0b1329', card: '#111c38', border: '#1e2d4a', text: '#ffffff', subtext: '#94a3b8', input: '#0b1329', rowBorder: '#162447', secondary: '#1e2d4a'
  } : {
    page: '#f8fafc', card: '#ffffff', border: '#e2e8f0', text: '#0f172a', subtext: '#64748b', input: '#ffffff', rowBorder: '#f1f5f9', secondary: '#ffffff'
  };

  
  return (
    <section style={{ ...styles.page, backgroundColor: tema.page, color: tema.text }}>
      <header style={{ ...styles.topBar, borderColor: tema.border }}>
        <div style={{ color: tema.subtext, fontSize: '12px' }}>Eléctricos MCA / {config.titulo}</div>
        <div style={styles.userTools}>
          <button type="button" onClick={toggleTheme} style={{ ...styles.themeButton, backgroundColor: tema.card, borderColor: tema.border, color: tema.text }}>
            {esOscuro ? '☀️ Claro' : '🌙 Oscuro'}
          </button>
          <div style={styles.userInfo}>
            <strong style={{ color: tema.text }}>Admin Documentos</strong>
            <span style={{ color: tema.subtext }}>DEPARTAMENTO TÉCNICO</span>
          </div>
          <div style={{ ...styles.userAvatar, backgroundColor: esOscuro ? '#2d3655' : '#e2e8f0' }}>👤</div>
          <button type="button" title="Notificaciones" style={{ ...styles.notificationButton, color: esOscuro ? '#facc15' : '#d97706' }}>🔔</button>
        </div>
      </header>
      <header style={styles.header}>
        <div>
          <div style={{ ...styles.eyebrow, color: esOscuro ? '#facc15' : '#a16207' }}>{config.icono} MÓDULO DE GESTIÓN</div>
          <h1 style={styles.title}>{config.titulo}</h1>
          <p style={{ ...styles.subtitle, color: tema.subtext }}>{config.subtitulo}</p>
        </div>
        <button type="button" onClick={abrirNuevo} style={styles.primaryButton}>＋ Nuevo registro</button>
      </header>

      <div style={styles.summaryRow}>
        <div style={{ ...styles.summaryCard, backgroundColor: tema.card, borderColor: tema.border }}><div style={{ ...styles.metricIcon, backgroundColor: esOscuro ? '#1e2d4a' : '#dbeafe' }}>{config.metricaIconos[0]}</div><div><span style={{ ...styles.summaryLabel, color: tema.subtext }}>REGISTROS TOTALES</span><strong style={styles.summaryValue}>{registros.length}</strong></div></div>
        <div style={{ ...styles.summaryCard, backgroundColor: tema.card, borderColor: tema.border }}><div style={{ ...styles.metricIcon, backgroundColor: esOscuro ? '#332b0c' : '#fef3c7' }}>{config.metricaIconos[1]}</div><div><span style={{ ...styles.summaryLabel, color: tema.subtext }}>RESULTADOS VISIBLES</span><strong style={styles.summaryValue}>{registrosFiltrados.length}</strong></div></div>
        <div style={{ ...styles.summaryCard, backgroundColor: esOscuro ? '#332b0c' : '#fff8d9', borderColor: tema.border }}><div style={{ ...styles.metricIcon, backgroundColor: esOscuro ? '#3f3210' : '#fef3c7' }}>{config.metricaIconos[2]}</div><div><span style={{ ...styles.summaryLabel, color: tema.subtext }}>ESTADO DEL MÓDULO</span><strong style={{ ...styles.summaryValue, color: '#facc15' }}>ACTIVO</strong></div></div>
      </div>

      <div style={{ ...styles.card, backgroundColor: tema.card, borderColor: tema.border }}>
        <div style={styles.toolbar}>
          <h2 style={{ margin: 0 }}>{config.titulo} registrados</h2>
          <input aria-label={`Buscar ${config.titulo}`} value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="🔍 Buscar..." style={{ ...styles.search, backgroundColor: tema.input, borderColor: tema.border, color: tema.text }} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead><tr>{config.columnas.map(([, etiqueta]) => <th key={etiqueta} style={{ ...styles.th, color: tema.subtext, borderColor: tema.border }}>{etiqueta}</th>)}<th style={{ ...styles.th, color: tema.subtext, borderColor: tema.border }}>Acciones</th></tr></thead>
            <tbody>
              {registrosFiltrados.map((registro) => <tr key={registro.id}>
                {config.columnas.map(([campo]) => <td key={campo} style={{ ...styles.td, color: tema.text, borderColor: tema.rowBorder }}>{campo === 'estado' ? <button type="button" onClick={() => cambiarEstado(registro.id)} title="Cambiar estado" style={{ ...styles.badge, ...estadoColor(registro[campo]), cursor: 'pointer', border: 'none' }}><span style={styles.statusDot}>{estadoIcono(registro[campo])}</span>{registro[campo]}</button> : campo === config.columnas[0][0] ? <span style={styles.nameCell}><span style={{ ...styles.rowIcon, backgroundColor: esOscuro ? '#1e2d4a' : '#f1f5f9' }}>{config.icono}</span>{registro[campo]}</span> : registro[campo]}</td>)}
                <td style={{ ...styles.td, borderColor: tema.rowBorder }}><div style={styles.actions}><button type="button" onClick={() => { setRegistroEditado(registro); setMostrarFormulario(true); }} style={{ ...styles.actionButton, color: '#a16207' }} title="Editar registro">✏️</button><button type="button" onClick={() => setRegistroDetalle(registro)} style={{ ...styles.actionButton, color: '#1d4ed8' }} title="Ver detalle">👁️</button><button type="button" onClick={() => eliminarRegistro(registro.id)} style={{ ...styles.actionButton, color: '#b91c1c' }} title="Eliminar registro">🗑️</button></div></td>
              </tr>)}
              {registrosFiltrados.length === 0 && <tr><td colSpan={config.columnas.length + 1} style={styles.empty}>No hay registros que coincidan con la búsqueda.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarFormulario && <div style={styles.overlay}>
        <form onSubmit={guardarRegistro} style={{ ...styles.modal, backgroundColor: tema.card, color: tema.text }}>
          <div style={styles.modalHeader}><div><div style={{ ...styles.eyebrow, color: esOscuro ? '#facc15' : '#a16207' }}>{config.icono} FORMULARIO</div><h2>{registroEditado?.id && registros.some((registro) => registro.id === registroEditado.id) ? 'Editar registro' : 'Nuevo registro'}</h2></div><button type="button" onClick={() => setMostrarFormulario(false)} style={{ ...styles.closeButton, color: tema.subtext }}>×</button></div>
          <div style={styles.formGrid}>{config.campos.map(([nombre, etiqueta, tipo, opciones]) => <label key={nombre} style={{ ...styles.label, ...(tipo === 'segmented' ? styles.fullWidthField : {}), color: tema.subtext }}>{etiqueta}<>{tipo === 'select' ? <select required value={registroEditado?.[nombre] || ''} onChange={(evento) => setRegistroEditado({ ...registroEditado, [nombre]: evento.target.value })} style={{ ...styles.input, backgroundColor: tema.input, borderColor: tema.border, color: tema.text }}>{opciones.map((opcion) => <option key={opcion}>{opcion}</option>)}</select> : tipo === 'segmented' ? <div role="radiogroup" aria-label={etiqueta} style={styles.segmentedControl}>{opciones.map((opcion) => <button key={opcion} type="button" role="radio" aria-checked={registroEditado?.[nombre] === opcion} onClick={() => setRegistroEditado({ ...registroEditado, [nombre]: opcion })} style={{ ...styles.segmentedButton, backgroundColor: registroEditado?.[nombre] === opcion ? '#facc15' : tema.input, borderColor: registroEditado?.[nombre] === opcion ? '#eab308' : tema.border, color: registroEditado?.[nombre] === opcion ? '#172033' : tema.text }}>{opcion}</button>)}</div> : <input required type={tipo} value={registroEditado?.[nombre] || ''} onChange={(evento) => setRegistroEditado({ ...registroEditado, [nombre]: evento.target.value })} style={{ ...styles.input, backgroundColor: tema.input, borderColor: tema.border, color: tema.text }} />}</></label>)}</div>
          <div style={styles.modalActions}><button type="button" onClick={() => setMostrarFormulario(false)} style={styles.secondaryButton}>Cancelar</button><button type="submit" style={styles.primaryButton}>Guardar registro</button></div>
        </form>
      </div>}

      {registroDetalle && <div style={styles.overlay}>
        <div style={{ ...styles.modal, backgroundColor: tema.card, color: tema.text }}>
          <div style={styles.modalHeader}><div><div style={{ ...styles.eyebrow, color: esOscuro ? '#facc15' : '#a16207' }}>{config.icono} DETALLE</div><h2 style={{ margin: 0 }}>Información completa</h2></div><button type="button" onClick={() => setRegistroDetalle(null)} style={{ ...styles.closeButton, color: tema.subtext }}>×</button></div>
          <div style={styles.detailGrid}>{config.campos.map(([nombre, etiqueta]) => <div key={nombre} style={{ ...styles.detailItem, borderColor: tema.border }}><span style={{ color: tema.subtext }}>{etiqueta}</span><strong>{registroDetalle[nombre] || 'No registrado'}</strong></div>)}</div>
          <div style={styles.modalActions}><button type="button" onClick={() => setRegistroDetalle(null)} style={styles.primaryButton}>Cerrar detalle</button></div>
        </div>
      </div>}

      {registroAEliminar && <div style={styles.overlay}>
        <div style={{ ...styles.modal, backgroundColor: tema.card, color: tema.text, maxWidth: '430px' }}>
          <div style={styles.modalHeader}><div><div style={{ ...styles.eyebrow, color: '#b91c1c' }}>⚠️ CONFIRMAR ACCIÓN</div><h2 style={{ margin: 0 }}>Eliminar registro</h2></div><button type="button" onClick={() => setRegistroAEliminar(null)} style={{ ...styles.closeButton, color: tema.subtext }}>×</button></div>
          <p style={{ color: tema.subtext, fontSize: '14px', lineHeight: 1.5, margin: '0 0 20px' }}>¿Seguro que deseas eliminar <strong style={{ color: tema.text }}>{registroAEliminar.nombre || registroAEliminar.codigo}</strong>? Esta acción quitará el registro de la lista.</p>
          <div style={styles.modalActions}><button type="button" onClick={() => setRegistroAEliminar(null)} style={styles.secondaryButton}>Cancelar</button><button type="button" onClick={confirmarEliminacion} style={styles.deleteButton}>🗑️ Eliminar</button></div>
        </div>
      </div>}

      {notificacion && <div style={styles.notificationOverlay} role="status">
        <div style={{ ...styles.notification, borderColor: notificacion.tipo === 'success' ? '#86efac' : '#fca5a5' }}>
          <div style={{ ...styles.notificationIcon, backgroundColor: notificacion.tipo === 'success' ? '#dcfce7' : '#fee2e2', color: notificacion.tipo === 'success' ? '#15803d' : '#b91c1c' }}>{notificacion.tipo === 'success' ? '✓' : '!'}</div>
          <div><strong>{notificacion.titulo}</strong><p>{notificacion.mensaje}</p></div>
          <button type="button" onClick={() => setNotificacion(null)} style={styles.notificationClose} title="Cerrar">×</button>
        </div>
      </div>}
    </section>
  );
}

export function Clientes() { return <ModuloGestion modulo="clientes" />; }
export function GestionTerceros() { return <ModuloGestion modulo="terceros" />; }
export function OrdenesServicio() { return <ModuloGestion modulo="ordenes" />; }

const styles = {
  page: { minHeight: '100vh', padding: '32px', backgroundColor: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', paddingBottom: '14px', marginBottom: '28px' },
  themeButton: { border: '1px solid', borderRadius: '20px', padding: '7px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' },
  userTools: { display: 'flex', alignItems: 'center', gap: '12px' },
  userInfo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', fontSize: '10px' },
  userAvatar: { width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' },
  notificationButton: { border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '15px', padding: '4px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', marginBottom: '24px' },
  eyebrow: { color: '#a16207', fontSize: '11px', fontWeight: '800', letterSpacing: '1px', marginBottom: '8px' },
  title: { margin: 0, fontSize: '28px' },
  subtitle: { margin: '6px 0 0', color: '#64748b', fontSize: '14px' },
  primaryButton: { border: 'none', borderRadius: '7px', backgroundColor: '#facc15', color: '#172033', padding: '11px 16px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' },
  secondaryButton: { border: '1px solid #cbd5e1', borderRadius: '7px', backgroundColor: '#fff', color: '#334155', padding: '10px 16px', fontWeight: '700', cursor: 'pointer' },
  deleteButton: { border: '1px solid #dc2626', borderRadius: '7px', backgroundColor: '#dc2626', color: '#fff', padding: '10px 16px', fontWeight: '700', cursor: 'pointer' },
  summaryRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '18px' },
  summaryCard: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '9px', padding: '17px' },
  metricIcon: { width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', flexShrink: 0 },
  summaryLabel: { color: '#64748b', display: 'block', fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px' },
  summaryValue: { display: 'block', fontSize: '24px', marginTop: '7px' },
  card: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '9px', padding: '20px' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '16px' },
  search: { width: '260px', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '7px', outline: 'none' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { padding: '12px 8px', borderBottom: '1px solid', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.4px' },
  td: { padding: '14px 8px', borderBottom: '1px solid' },
  tableHead: { color: '#64748b' },
  badge: { display: 'inline-block', borderRadius: '999px', padding: '4px 9px', fontSize: '11px', fontWeight: '800' },
  statusDot: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px', marginRight: '4px', fontWeight: '900' },
  nameCell: { display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700' },
  rowIcon: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', fontSize: '14px' },
  actions: { display: 'flex', gap: '8px' },
  actionButton: { border: 'none', background: 'transparent', padding: '3px', cursor: 'pointer', fontSize: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', padding: '32px', color: '#64748b' },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 20 },
  modal: { width: 'min(680px, 100%)', backgroundColor: '#fff', borderRadius: '10px', padding: '24px', boxSizing: 'border-box' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  closeButton: { border: 'none', background: 'transparent', color: '#64748b', fontSize: '28px', cursor: 'pointer', lineHeight: 1 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  fullWidthField: { gridColumn: '1 / -1' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  detailItem: { display: 'flex', flexDirection: 'column', gap: '5px', borderBottom: '1px solid', padding: '9px 0', fontSize: '13px' },
  label: { display: 'flex', flexDirection: 'column', gap: '6px', color: '#475569', fontSize: '12px', fontWeight: '700' },
  input: { width: '100%', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', color: '#0f172a', backgroundColor: '#fff', fontSize: '13px' },
  segmentedControl: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
  segmentedButton: { border: '1px solid', borderRadius: '6px', padding: '10px 8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' },
  notificationOverlay: { position: 'fixed', top: '24px', right: '24px', zIndex: 30 },
  notification: { minWidth: '300px', maxWidth: '380px', display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#fff', border: '1px solid', borderRadius: '9px', padding: '14px 16px', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.2)', color: '#0f172a' },
  notificationIcon: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', flexShrink: 0 },
  notificationClose: { border: 'none', background: 'transparent', color: '#64748b', fontSize: '20px', cursor: 'pointer', marginLeft: 'auto', lineHeight: 1 },
};
