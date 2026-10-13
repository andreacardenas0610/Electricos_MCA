import { useContext, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Bell,
  Building2,
  ClipboardList,
  FileText,
  Handshake,
  Search,
  Settings,
  UsersRound,
} from 'lucide-react';
import { ThemeContext } from '../../../shared/context/ThemeContext.jsx';
import { EstadoToggle, ESTADOS, estadoSiguiente } from '../../../shared/components/EstadoToggle.jsx';
import { AccionesFila } from '../../../shared/components/AccionesFila.jsx';

const iconosModulo = {
  clientes: {
    encabezado: Building2,
    fila: Building2,
    metricas: [UsersRound, Search, BadgeCheck],
  },
  terceros: {
    encabezado: Handshake,
    fila: Handshake,
    metricas: [Handshake, Search, BadgeCheck],
  },
  ordenes: {
    encabezado: FileText,
    fila: ClipboardList,
    metricas: [ClipboardList, Search, Settings],
  },
};

const configuraciones = {
  clientes: {
    titulo: 'Clientes',
    subtitulo: 'Empresas y personas que solicitan servicios eléctricos.',
    icono: '🏢',
    almacenamiento: 'mca_clientes',
    columnas: [
      ['nombre', 'Cliente / Razón social'],
      ['tipoPropiedad', 'Tipo de propiedad'],
      ['documento', 'Documento / NIT'],
      ['contacto', 'Contacto'],
      ['telefono', 'Teléfono'],
      ['estado', 'Estado'],
    ],
    campos: [
      ['tipoPropiedad', 'Tipo de propiedad', 'segmented', ['Residencial', 'Comercial', 'Industrial']],
      ['nombre', 'Razón social', 'text'],
      ['documento', 'NIT', 'text'],
      ['contacto', 'Persona de contacto', 'text'],
      ['telefono', 'Teléfono', 'tel'],
      ['correo', 'Correo electrónico', 'email'],
      ['direccion', 'Dirección', 'text'],
    ],
    iniciales: [
      { id: 1, nombre: 'Constructora Horizonte S.A.', tipoPropiedad: 'Comercial', documento: '900.458.221-1', contacto: 'Laura Villamizar', telefono: '300 458 2211', correo: 'contacto@horizonte.com', direccion: 'Av. Central 450', estado: 'Activo' },
      { id: 2, nombre: 'Corporativo Andes S.A.', tipoPropiedad: 'Industrial', documento: '901.220.874-6', correo: 'compras@andes.com', contacto: 'Carlos Ruiz', telefono: '310 854 9021', direccion: 'Zona Industrial Sur', estado: 'Activo' },
    ],
  },
  terceros: {
    titulo: 'Terceros',
    subtitulo: 'Aliados de operación de servicios eléctricos.',
    icono: '🤝',
    almacenamiento: 'mca_terceros',
    columnas: [
      ['documento', 'Documento'],
      ['contacto', 'Nombre del tercero'],
      ['telefono', 'Teléfono'],
      ['correo', 'Correo electrónico'],
      ['estado', 'Estado'],
    ],
    campos: [
      ['documento', 'Documento', 'text'],
      ['contacto', 'Nombre del tercero', 'text'],
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
      ['clienteId', 'Cliente', 'fk', 'clientes'],
      ['servicioId', 'Servicio solicitado', 'fk', 'servicios'],
      ['fecha', 'Fecha programada', 'date'],
      ['responsableId', 'Técnico responsable', 'fk', 'tecnicos'],
      ['estado', 'Estado', 'select', ['Pendiente', 'Programada', 'En ejecución', 'Finalizada', 'Cancelada']],
    ],
    iniciales: [
      { id: 1, codigo: 'OS-9842', clienteId: '2', cliente: 'Corporativo Andes S.A.', servicioId: 'ELEC-002', servicio: 'Mantenimiento Preventivo', fecha: '2026-09-12', responsableId: '1', responsable: 'Carlos Mendoza', estado: 'Programada' },
      { id: 2, codigo: 'OS-9845', clienteId: '1', cliente: 'Constructora Horizonte S.A.', servicioId: 'ELEC-001', servicio: 'Instalación Eléctrica Residencial', fecha: '2026-09-15', responsableId: '1', responsable: 'Carlos Mendoza', estado: 'Pendiente' },
    ],
  },
};

const catalogosFKIniciales = {
  clientes: configuraciones.clientes.iniciales,
  servicios: [
    { id: 'ELEC-001', codigo: 'ELEC-001', nombre: 'Instalación de redes eléctricas' },
    { id: 'ELEC-002', codigo: 'ELEC-002', nombre: 'Mantenimiento preventivo y correctivo' },
    { id: 'ELEC-003', codigo: 'ELEC-003', nombre: 'Diagnóstico y reparación de fallas eléctricas' },
    { id: 'ELEC-004', codigo: 'ELEC-004', nombre: 'Adecuaciones eléctricas' },
    { id: 'ELEC-005', codigo: 'ELEC-005', nombre: 'Asesoría técnica especializada' },
  ],
  tecnicos: [
    { id: 1, nombre: 'Carlos Mendoza' },
    { id: 3, nombre: 'Andrés López' },
  ],
};

const obtenerOpcionesFK = (catalogo) => {
  const almacenamientos = {
    clientes: 'mca_clientes',
    servicios: 'mca_catalogo_servicios',
    tecnicos: 'mca_tecnicos',
  };
  const guardados = localStorage.getItem(almacenamientos[catalogo]);
  const registros = catalogo === 'servicios'
    ? catalogosFKIniciales.servicios
    : guardados
      ? JSON.parse(guardados)
      : catalogosFKIniciales[catalogo];

  return registros.map((registro) => {
    const id = catalogo === 'servicios' ? registro.codigo || registro.id : registro.id;
    const nombre = registro.nombre || registro.nombreServicio || registro.contacto;

    return {
      id: String(id),
      nombre,
      etiqueta: catalogo === 'servicios' ? `${id} - ${nombre}` : nombre,
    };
  });
};

const siguienteEstado = (modulo, estado) => {
  const estados = modulo === 'ordenes'
    ? ['Pendiente', 'Programada', 'En ejecución', 'Finalizada', 'Cancelada']
    : ['Activo', 'Inactivo'];
  return estados[(estados.indexOf(estado) + 1) % estados.length];
};

const fechaLocalISO = () => {
  const hoy = new Date();
  hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
  return hoy.toISOString().slice(0, 10);
};

const etiquetaCampoCliente = (nombre, etiqueta, tipoPropiedad) => {
  if (nombre === 'nombre') return tipoPropiedad === 'Residencial' ? 'Nombre completo' : 'Razón social';
  if (nombre === 'documento') return tipoPropiedad === 'Residencial' ? 'Documento de identidad' : 'NIT';
  return etiqueta;
};

export function ModuloGestion({ modulo }) {
  const config = configuraciones[modulo];
  const iconos = iconosModulo[modulo];
  const [IconoTotal, IconoBusqueda, IconoEstado] = iconos.metricas;
  const IconoFila = iconos.fila;
  const IconoEncabezado = iconos.encabezado;
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

  const generarCodigoOrden = () => {
    const ultimoNumero = registros.reduce((mayor, registro) => {
      const coincidencia = String(registro.codigo || '').match(/^OS-(\d+)$/i);
      return coincidencia ? Math.max(mayor, Number(coincidencia[1])) : mayor;
    }, 0);
    return `OS-${String(ultimoNumero + 1).padStart(4, '0')}`;
  };

  const abrirNuevo = () => {
    const valoresIniciales = Object.fromEntries(config.campos.map(([nombre, , tipo, opciones]) => [nombre, ['select', 'segmented'].includes(tipo) ? opciones[0] : '']));
    if (modulo === 'ordenes') valoresIniciales.codigo = generarCodigoOrden();
    setRegistroEditado({ id: Date.now(), ...valoresIniciales });
    setMostrarFormulario(true);
  };

  const seleccionarFK = (nombre, catalogo, id) => {
    const opcion = obtenerOpcionesFK(catalogo).find((item) => item.id === id);
    const campoNombre = nombre.replace(/Id$/, '');
    setRegistroEditado((actual) => ({
      ...actual,
      [nombre]: id,
      [campoNombre]: opcion?.nombre || '',
    }));
  };

  const guardarRegistro = (evento) => {
    evento.preventDefault();
    if (!registroEditado) {
      setNotificacion({ tipo: 'error', titulo: 'No se pudo guardar', mensaje: 'No hay información válida para guardar.' });
      return;
    }
    const esNuevoRegistro = !registros.some((registro) => registro.id === registroEditado.id);
    if (modulo === 'ordenes' && registroEditado.estado === 'Programada' && !registroEditado.fecha) {
      setNotificacion({ tipo: 'error', titulo: 'Fecha requerida', mensaje: 'Debes seleccionar una fecha para programar la orden.' });
      return;
    }
    if (
      modulo === 'ordenes'
      && registroEditado.estado === 'Programada'
      && registroEditado.fecha
      && registroEditado.fecha < fechaLocalISO()
    ) {
      setNotificacion({ tipo: 'error', titulo: 'Fecha no válida', mensaje: 'La fecha programada no puede ser anterior al día de hoy.' });
      return;
    }
    const registroAGuardar = modulo === 'ordenes' && esNuevoRegistro
      ? { ...registroEditado, estado: registroEditado.fecha ? 'Programada' : 'Pendiente' }
      : registroEditado;
    setRegistros((actuales) => {
      const existe = actuales.some((registro) => registro.id === registroAGuardar.id);
      return existe ? actuales.map((registro) => registro.id === registroAGuardar.id ? registroAGuardar : registro) : [registroAGuardar, ...actuales];
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

  const estadosModulo = modulo === 'ordenes' ? ESTADOS.orden : ESTADOS.usuario;
  const camposFormulario = modulo === 'clientes'
    ? config.campos
      .filter(([nombre]) => registroEditado?.tipoPropiedad !== 'Residencial' || nombre !== 'contacto')
      .map(([nombre, etiqueta, tipo, opciones]) => [
        nombre,
        etiquetaCampoCliente(nombre, etiqueta, registroEditado?.tipoPropiedad),
        tipo,
        opciones,
      ])
    : config.campos;
  const camposDetalle = modulo === 'clientes'
    ? config.campos
      .filter(([nombre]) => registroDetalle?.tipoPropiedad !== 'Residencial' || nombre !== 'contacto')
      .map(([nombre, etiqueta]) => [
        nombre,
        etiquetaCampoCliente(nombre, etiqueta, registroDetalle?.tipoPropiedad),
      ])
    : config.campos;
  const esNuevaOrden = modulo === 'ordenes'
    && registroEditado
    && !registros.some((registro) => registro.id === registroEditado.id);

  const cambiarEstado = (id) => {
    setRegistros((actuales) => actuales.map((registro) => registro.id === id ? { ...registro, estado: estadoSiguiente(estadosModulo, registro.estado) } : registro));
  };

  const cambiarCampoFormulario = (nombre, valor) => {
    setRegistroEditado((actual) => {
      const actualizacion = { ...actual, [nombre]: valor };
      if (nombre === 'tipoPropiedad' && valor === 'Residencial') actualizacion.contacto = '';
      if (modulo === 'ordenes' && nombre === 'estado' && valor === 'Pendiente') {
        actualizacion.fecha = '';
      }
      if (
        modulo === 'ordenes'
        && nombre === 'estado'
        && valor === 'Programada'
        && actualizacion.fecha
        && actualizacion.fecha < fechaLocalISO()
      ) {
        actualizacion.fecha = '';
      }
      if (modulo === 'ordenes' && nombre === 'fecha' && !registros.some((registro) => registro.id === actual.id)) {
        actualizacion.estado = valor ? 'Programada' : 'Pendiente';
      }
      return actualizacion;
    });
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
          <button type="button" title="Notificaciones" style={{ ...styles.notificationButton, color: esOscuro ? '#cbd5e1' : '#475569' }}>
            <Bell size={18} strokeWidth={1.8} />
          </button>
          <div style={{ ...styles.userTools, borderLeft: `1px solid ${tema.border}`, paddingLeft: '12px' }}>
            <div style={styles.userInfo}>
              <strong style={{ color: tema.text }}>Admin Documentos</strong>
              <span style={{ color: tema.subtext }}>DEPARTAMENTO TÉCNICO</span>
            </div>
            <div style={{ ...styles.userAvatar, backgroundColor: esOscuro ? '#2d3655' : '#e2e8f0' }}>👤</div>
          </div>
        </div>
      </header>
      <header style={styles.header}>
        <div>
          <div style={{ ...styles.eyebrow, color: esOscuro ? '#facc15' : '#a16207', display: 'flex', alignItems: 'center', gap: '8px' }}><IconoEncabezado size={16} strokeWidth={1.8} /> MÓDULO DE GESTIÓN</div>
          <h1 style={styles.title}>{config.titulo}</h1>
          <p style={{ ...styles.subtitle, color: tema.subtext }}>{config.subtitulo}</p>
        </div>
        <button type="button" onClick={abrirNuevo} style={styles.primaryButton}>＋ Nuevo registro</button>
      </header>

      <div style={styles.summaryRow}>
        <div style={{ ...styles.summaryCard, backgroundColor: tema.card, borderColor: tema.border }}><div style={{ ...styles.metricIcon, backgroundColor: esOscuro ? '#1e2d4a' : '#dbeafe', color: esOscuro ? '#cbd5e1' : '#475569' }}><IconoTotal size={18} strokeWidth={1.8} /></div><div><span style={{ ...styles.summaryLabel, color: tema.subtext }}>REGISTROS TOTALES</span><strong style={styles.summaryValue}>{registros.length}</strong></div></div>
        <div style={{ ...styles.summaryCard, backgroundColor: tema.card, borderColor: tema.border }}><div style={{ ...styles.metricIcon, backgroundColor: esOscuro ? '#332b0c' : '#fef3c7', color: esOscuro ? '#facc15' : '#a16207' }}><IconoBusqueda size={18} strokeWidth={1.8} /></div><div><span style={{ ...styles.summaryLabel, color: tema.subtext }}>RESULTADOS VISIBLES</span><strong style={styles.summaryValue}>{registrosFiltrados.length}</strong></div></div>
        <div style={{ ...styles.summaryCard, backgroundColor: esOscuro ? '#332b0c' : '#fff8d9', borderColor: tema.border }}><div style={{ ...styles.metricIcon, backgroundColor: esOscuro ? '#3f3210' : '#fef3c7', color: esOscuro ? '#facc15' : '#a16207' }}><IconoEstado size={18} strokeWidth={1.8} /></div><div><span style={{ ...styles.summaryLabel, color: tema.subtext }}>ESTADO DEL MÓDULO</span><strong style={{ ...styles.summaryValue, color: '#facc15' }}>ACTIVO</strong></div></div>
      </div>

      <div style={{ ...styles.card, backgroundColor: tema.card, borderColor: tema.border }}>
        <div style={styles.toolbar}>
          <h2 style={{ margin: 0 }}>{config.titulo} registrados</h2>
          <div style={styles.searchWrap}>
            <Search size={16} strokeWidth={1.8} color={tema.subtext} aria-hidden="true" style={styles.searchIcon} />
            <input aria-label={`Buscar ${config.titulo}`} value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar..." style={{ ...styles.search, backgroundColor: tema.input, borderColor: tema.border, color: tema.text }} />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead><tr>{config.columnas.map(([, etiqueta]) => <th key={etiqueta} style={{ ...styles.th, color: tema.subtext, borderColor: tema.border }}>{etiqueta}</th>)}<th style={{ ...styles.th, color: tema.subtext, borderColor: tema.border }}>Acciones</th></tr></thead>
            <tbody>
              {registrosFiltrados.map((registro) => <tr key={registro.id}>
                {config.columnas.map(([campo]) => <td key={campo} style={{ ...styles.td, color: tema.text, borderColor: tema.rowBorder }}>{campo === 'estado' ? <EstadoToggle estado={registro[campo]} estados={estadosModulo} onClick={() => cambiarEstado(registro.id)} /> : campo === config.columnas[0][0] ? <span style={styles.nameCell}><span style={{ ...styles.rowIcon, backgroundColor: esOscuro ? '#1e2d4a' : '#f1f5f9', color: tema.subtext }}><IconoFila size={16} strokeWidth={1.8} /></span>{registro[campo]}</span> : registro[campo]}</td>)}
                <td style={{ ...styles.td, borderColor: tema.rowBorder }}>
                  <AccionesFila
                    onVer={() => setRegistroDetalle(registro)}
                    onEditar={() => { setRegistroEditado(registro); setMostrarFormulario(true); }}
                    onEliminar={() => eliminarRegistro(registro.id)}
                    color={esOscuro ? '#cbd5e1' : '#475569'}
                  />
                </td>
              </tr>)}
              {registrosFiltrados.length === 0 && <tr><td colSpan={config.columnas.length + 1} style={styles.empty}>No hay registros que coincidan con la búsqueda.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarFormulario && <div style={styles.overlay}>
        <form onSubmit={guardarRegistro} style={{ ...styles.modal, backgroundColor: tema.card, color: tema.text }}>
          <div style={styles.modalHeader}><div><div style={{ ...styles.eyebrow, color: esOscuro ? '#facc15' : '#a16207' }}>{config.icono} FORMULARIO</div><h2>{registroEditado?.id && registros.some((registro) => registro.id === registroEditado.id) ? 'Editar registro' : 'Nuevo registro'}</h2></div><button type="button" onClick={() => setMostrarFormulario(false)} style={{ ...styles.closeButton, color: tema.subtext }}>×</button></div>
          <div style={styles.formGrid}>
            {camposFormulario.map(([nombre, etiqueta, tipo, opciones]) => (
              <label
                key={nombre}
                style={{
                  ...styles.label,
                  ...(tipo === 'segmented' ? styles.fullWidthField : {}),
                  color: tema.subtext,
                }}
              >
                {etiqueta}
                {tipo === 'fk' ? (
                  <select
                    required
                    value={String(registroEditado?.[nombre] || '')}
                    onChange={(evento) => seleccionarFK(nombre, opciones, evento.target.value)}
                    style={{ ...styles.input, backgroundColor: tema.input, borderColor: tema.border, color: tema.text }}
                  >
                    <option value="">Selecciona {etiqueta.toLowerCase()}...</option>
                    {obtenerOpcionesFK(opciones).map((opcion) => (
                      <option key={opcion.id} value={opcion.id}>{opcion.etiqueta}</option>
                    ))}
                  </select>
                ) : tipo === 'select' && modulo === 'ordenes' && nombre === 'estado' && esNuevaOrden ? (
                  <input
                    type="text"
                    value={registroEditado?.[nombre] || ''}
                    readOnly
                    style={{ ...styles.input, backgroundColor: tema.input, borderColor: tema.border, color: tema.text }}
                  />
                ) : tipo === 'select' ? (
                  <select
                    required
                    value={registroEditado?.[nombre] || ''}
                    onChange={(evento) => cambiarCampoFormulario(nombre, evento.target.value)}
                    style={{ ...styles.input, backgroundColor: tema.input, borderColor: tema.border, color: tema.text }}
                  >
                    {(modulo === 'ordenes' && nombre === 'estado'
                      ? opciones.filter((opcion) => ['Pendiente', 'Programada', 'Cancelada'].includes(opcion))
                      : opciones
                    ).map((opcion) => <option key={opcion}>{opcion}</option>)}
                  </select>
                ) : tipo === 'segmented' ? (
                  <div role="radiogroup" aria-label={etiqueta} style={styles.segmentedControl}>
                    {opciones.map((opcion) => (
                      <button
                        key={opcion}
                        type="button"
                        role="radio"
                        aria-checked={registroEditado?.[nombre] === opcion}
                        onClick={() => cambiarCampoFormulario(nombre, opcion)}
                        style={{
                          ...styles.segmentedButton,
                          backgroundColor: registroEditado?.[nombre] === opcion ? '#facc15' : tema.input,
                          borderColor: registroEditado?.[nombre] === opcion ? '#eab308' : tema.border,
                          color: registroEditado?.[nombre] === opcion ? '#172033' : tema.text,
                        }}
                      >
                        {opcion}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    required={
                      !(modulo === 'ordenes' && nombre === 'fecha')
                      || (modulo === 'ordenes' && nombre === 'fecha' && registroEditado?.estado === 'Programada')
                    }
                    type={tipo}
                    min={modulo === 'ordenes' && nombre === 'fecha' ? fechaLocalISO() : undefined}
                    disabled={modulo === 'ordenes' && nombre === 'fecha' && !esNuevaOrden && registroEditado?.estado === 'Pendiente'}
                    readOnly={modulo === 'ordenes' && nombre === 'codigo'}
                    value={registroEditado?.[nombre] || ''}
                    onChange={(evento) => cambiarCampoFormulario(nombre, evento.target.value)}
                    style={{ ...styles.input, backgroundColor: tema.input, borderColor: tema.border, color: tema.text }}
                  />
                )}
              </label>
            ))}
          </div>
          <div style={styles.modalActions}><button type="button" onClick={() => setMostrarFormulario(false)} style={styles.secondaryButton}>Cancelar</button><button type="submit" style={styles.primaryButton}>Guardar registro</button></div>
        </form>
      </div>}

      {registroDetalle && <div style={styles.overlay}>
        <div style={{ ...styles.modal, backgroundColor: tema.card, color: tema.text }}>
          <div style={styles.modalHeader}><div><div style={{ ...styles.eyebrow, color: esOscuro ? '#facc15' : '#a16207' }}>{config.icono} DETALLE</div><h2 style={{ margin: 0 }}>Información completa</h2></div><button type="button" onClick={() => setRegistroDetalle(null)} style={{ ...styles.closeButton, color: tema.subtext }}>×</button></div>
          <div style={styles.detailGrid}>{camposDetalle.map(([nombre, etiqueta]) => <div key={nombre} style={{ ...styles.detailItem, borderColor: tema.border }}><span style={{ color: tema.subtext }}>{etiqueta}</span><strong>{registroDetalle[nombre] || 'No registrado'}</strong></div>)}</div>
          <div style={styles.modalActions}><button type="button" onClick={() => setRegistroDetalle(null)} style={styles.primaryButton}>Cerrar detalle</button></div>
        </div>
      </div>}

      {registroAEliminar && <div style={styles.overlay}>
        <div style={{ ...styles.modal, backgroundColor: tema.card, color: tema.text, maxWidth: '430px' }}>
          <div style={styles.modalHeader}><div><div style={{ ...styles.eyebrow, color: '#b91c1c' }}>⚠️ CONFIRMAR ACCIÓN</div><h2 style={{ margin: 0 }}>Eliminar registro</h2></div><button type="button" onClick={() => setRegistroAEliminar(null)} style={{ ...styles.closeButton, color: tema.subtext }}>×</button></div>
          <p style={{ color: tema.subtext, fontSize: '14px', lineHeight: 1.5, margin: '0 0 20px' }}>¿Seguro que deseas eliminar <strong style={{ color: tema.text }}>{registroAEliminar.nombre || registroAEliminar.contacto || registroAEliminar.documento || registroAEliminar.codigo}</strong>? Esta acción quitará el registro de la lista.</p>
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
  searchWrap: { position: 'relative', width: '260px', flexShrink: 0 },
  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  search: { width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #cbd5e1', borderRadius: '7px', outline: 'none' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { padding: '12px 8px', borderBottom: '1px solid', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.4px' },
  td: { padding: '14px 8px', borderBottom: '1px solid' },
  tableHead: { color: '#64748b' },
  nameCell: { display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700' },
  rowIcon: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', fontSize: '14px' },
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
