import { useContext, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Bell,
  Building2,
  ClipboardList,
  FileText,
  Handshake,
  Plus,
  Search,
  Settings,
  Trash2,
  TriangleAlert,
  UsersRound,
} from 'lucide-react';
import { ThemeContext } from '../../../shared/context/ThemeContext.jsx';
import { EstadoToggle, ESTADOS, estadoSiguiente } from '../../../shared/components/EstadoToggle.jsx';
import { AccionesFila } from '../../../shared/components/AccionesFila.jsx';
import { apiRequest } from '../../../shared/api.js';

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
    apiPath: '/clientes',
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
      ['municipio', 'Municipio', 'text'],
      ['departamento', 'Departamento', 'text'],
    ],
  },
  terceros: {
    titulo: 'Terceros',
    subtitulo: 'Técnicos externos asignados a los servicios eléctricos.',
    icono: '🤝',
    apiPath: '/terceros',
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
  },
  ordenes: {
    titulo: 'Órdenes de Servicio',
    subtitulo: 'Crea, consulta y actualiza el seguimiento de los trabajos contratados.',
    icono: '🧾',
    apiPath: '/ordenes-servicio',
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
      ['prioridadId', 'Prioridad', 'fk', 'prioridades'],
      ['fecha', 'Fecha programada', 'date'],
      ['responsableId', 'Técnico responsable', 'fk', 'tecnicos'],
      ['estado', 'Estado', 'select', []],
    ],
  },
};

function obtenerOpcionesFK(catalogo, catalogos) {
  return (catalogos[catalogo] || []).map((registro) => {
    const nombre = registro.nombre || registro.nombre_razon_social || registro.nombre_completo || registro.contacto;
    return {
      id: String(registro.id),
      nombre,
      etiqueta: catalogo === 'servicios' ? `${registro.id} - ${nombre}` : nombre,
    };
  });
}

function normalizarRegistro(modulo, registro) {
  if (modulo === 'clientes') {
    return {
      id: registro.id,
      nombre: registro.nombre_razon_social,
      documento: registro.documento_nit,
      tipoCliente: registro.tipo_cliente,
      tipoPropiedad: registro.tipo_propiedad,
      tipoPropiedadId: registro.tipo_propiedad_id,
      contacto: registro.contacto || '',
      telefono: registro.telefono || '',
      correo: registro.correo_electronico || '',
      direccion: registro.direccion || '',
      municipio: registro.municipio || '',
      departamento: registro.departamento || '',
      estado: registro.estado,
    };
  }
  if (modulo === 'terceros') {
    return {
      id: registro.id,
      contacto: registro.nombre_completo,
      documento: registro.documento,
      empresa: registro.empresa || '',
      telefono: registro.telefono || '',
      correo: registro.correo_electronico || '',
      estado: registro.estado,
    };
  }
  return {
    id: registro.id,
    codigo: registro.codigo,
    clienteId: String(registro.cliente_id),
    cliente: registro.cliente,
    servicioId: registro.servicio_id == null ? '' : String(registro.servicio_id),
    servicio: registro.servicio,
    prioridadId: String(registro.prioridad_id),
    prioridad: registro.prioridad,
    fecha: registro.fecha_programada || '',
    responsableId: String(registro.tercero_id),
    responsable: registro.tecnico,
    estadoId: String(registro.estado_id),
    estado: registro.estado,
    descripcion: registro.descripcion || '',
  };
}

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

export function ModuloGestion({ modulo, usuario }) {
  const config = configuraciones[modulo];
  const iconos = iconosModulo[modulo];
  const [IconoTotal, IconoBusqueda, IconoEstado] = iconos.metricas;
  const IconoFila = iconos.fila;
  const IconoEncabezado = iconos.encabezado;
  const { theme: temaGlobal, toggleTheme } = useContext(ThemeContext);
  const esOscuro = temaGlobal === 'dark';
  const [registros, setRegistros] = useState([]);
  const [catalogos, setCatalogos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [registroEditado, setRegistroEditado] = useState(null);
  const [registroDetalle, setRegistroDetalle] = useState(null);
  const [registroAEliminar, setRegistroAEliminar] = useState(null);
  const [notificacion, setNotificacion] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [erroresFormulario, setErroresFormulario] = useState({});

  useEffect(() => {
    let vigente = true;
    const cargarDatos = async () => {
      setCargando(true);
      try {
        let lista;
        let nuevosCatalogos = {};
        if (modulo === 'clientes') {
          const [clientes, tiposPropiedad] = await Promise.all([
            apiRequest(config.apiPath),
            apiRequest('/clientes/catalogos/tipos-propiedad'),
          ]);
          lista = clientes;
          nuevosCatalogos = { tiposPropiedad };
        } else if (modulo === 'terceros') {
          lista = await apiRequest(config.apiPath);
        } else {
          const [ordenes, catalogoOrdenes, clientes, terceros] = await Promise.all([
            apiRequest(config.apiPath),
            apiRequest('/ordenes-servicio/catalogos'),
            apiRequest('/clientes'),
            apiRequest('/terceros'),
          ]);
          lista = ordenes;
          nuevosCatalogos = {
            ...catalogoOrdenes,
            clientes,
            tecnicos: terceros,
          };
        }
        if (vigente) {
          setRegistros(lista.map((registro) => normalizarRegistro(modulo, registro)));
          setCatalogos(nuevosCatalogos);
        }
      } catch (error) {
        if (vigente) {
          setNotificacion({ tipo: 'error', titulo: 'No se pudieron cargar los datos', mensaje: error.message });
        }
      } finally {
        if (vigente) setCargando(false);
      }
    };
    cargarDatos();
    return () => { vigente = false; };
  }, [config.apiPath, modulo]);

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
    const valoresIniciales = Object.fromEntries(config.campos.map(([nombre, , tipo, opciones]) => [
      nombre,
      ['select', 'segmented'].includes(tipo)
        ? opciones?.[0] || ''
        : '',
    ]));
    if (modulo === 'clientes') {
      valoresIniciales.tipoPropiedad = 'Residencial';
    }
    if (modulo === 'ordenes') {
      const pendiente = catalogos.estados?.find((estado) => estado.nombre.toLowerCase() === 'pendiente');
      valoresIniciales.estado = pendiente?.nombre || catalogos.estados?.[0]?.nombre || '';
      valoresIniciales.prioridadId = String(catalogos.prioridades?.[0]?.id || '');
      valoresIniciales.prioridad = catalogos.prioridades?.[0]?.nombre || '';
    }
    if (modulo === 'ordenes') valoresIniciales.codigo = generarCodigoOrden();
    setRegistroEditado({ id: Date.now(), ...valoresIniciales });
    setErroresFormulario({});
    setMostrarFormulario(true);
  };

  const seleccionarFK = (nombre, catalogo, id) => {
    const opcion = obtenerOpcionesFK(catalogo, catalogos).find((item) => item.id === id);
    const campoNombre = nombre.replace(/Id$/, '');
    setRegistroEditado((actual) => ({
      ...actual,
      [nombre]: id,
      [campoNombre]: opcion?.nombre || '',
    }));
    setErroresFormulario((actuales) => ({ ...actuales, [nombre]: '' }));
  };

  const crearPayload = (registro) => {
    if (modulo === 'clientes') {
      const tipoPropiedad = catalogos.tiposPropiedad?.find(
        (tipo) => tipo.nombre.toLowerCase() === registro.tipoPropiedad?.toLowerCase(),
      );
      if (!tipoPropiedad) {
        throw new Error('El tipo de propiedad seleccionado no existe en los catálogos de la base de datos.');
      }
      return {
        nombre_razon_social: registro.nombre,
        documento_nit: registro.documento,
        tipo_cliente: registro.tipoPropiedad === 'Residencial' ? 'Natural' : 'Jurídico',
        tipo_propiedad_id: tipoPropiedad.id,
        contacto: registro.contacto || '',
        telefono: registro.telefono || '',
        correo_electronico: registro.correo || '',
        direccion: registro.direccion || '',
        municipio: registro.municipio || '',
        departamento: registro.departamento || '',
        estado: registro.estado || 'Activo',
      };
    }
    if (modulo === 'terceros') {
      return {
        nombre_completo: registro.contacto,
        documento: registro.documento,
        telefono: registro.telefono || '',
        correo_electronico: registro.correo || '',
        estado: registro.estado || 'Activo',
      };
    }
    return {
      codigo: registro.codigo,
      cliente_id: Number(registro.clienteId),
      servicio_id: Number(registro.servicioId),
      fecha_programada: registro.fecha || null,
      tercero_id: Number(registro.responsableId),
      prioridad_id: Number(registro.prioridadId),
      estado_id: Number(catalogos.estados?.find((estado) => estado.nombre === registro.estado)?.id || registro.estadoId),
      descripcion: registro.descripcion || '',
    };
  };

  const guardarRegistro = async (evento) => {
    evento.preventDefault();
    if (!registroEditado) {
      setNotificacion({ tipo: 'error', titulo: 'No se pudo guardar', mensaje: 'No hay información válida para guardar.' });
      return;
    }
    const esNuevoRegistro = !registros.some((registro) => registro.id === registroEditado.id);
    const errores = {};
    camposFormulario.forEach(([nombre, etiqueta]) => {
      const esFechaOpcional = modulo === 'ordenes'
        && nombre === 'fecha'
        && registroEditado.estado?.toLowerCase() !== 'programada';
      const valor = registroEditado[nombre];
      if (!esFechaOpcional && !String(valor ?? '').trim()) {
        errores[nombre] = `El campo ${etiqueta.toLowerCase()} es obligatorio.`;
      }
    });
    if (
      (modulo === 'clientes' || modulo === 'terceros')
      && registroEditado.correo
      && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registroEditado.correo.trim())
    ) {
      errores.correo = 'Ingresa un correo electrónico válido.';
    }
    if (Object.keys(errores).length) {
      setErroresFormulario(errores);
      return;
    }
    if (
      modulo === 'ordenes'
      && registroEditado.estado?.toLowerCase() === 'programada'
      && registroEditado.fecha
      && registroEditado.fecha < fechaLocalISO()
    ) {
      setErroresFormulario({ fecha: 'La fecha programada no puede ser anterior al día de hoy.' });
      return;
    }
    try {
      const respuesta = await apiRequest(
        esNuevoRegistro ? config.apiPath : `${config.apiPath}/${registroEditado.id}`,
        {
          method: esNuevoRegistro ? 'POST' : 'PUT',
          body: crearPayload(registroEditado),
        },
      );
      const registroGuardado = normalizarRegistro(modulo, respuesta);
      setRegistros((actuales) => esNuevoRegistro
        ? [registroGuardado, ...actuales]
        : actuales.map((registro) => registro.id === registroGuardado.id ? registroGuardado : registro));
      setMostrarFormulario(false);
      setRegistroEditado(null);
      setErroresFormulario({});
      setNotificacion({ tipo: 'success', titulo: 'Registro guardado', mensaje: 'La información se guardó correctamente en la base de datos.' });
    } catch (error) {
      setNotificacion({ tipo: 'error', titulo: 'No se pudo guardar', mensaje: error.message });
    }
  };

  const eliminarRegistro = (id) => {
    setRegistroAEliminar(registros.find((registro) => registro.id === id));
  };

  const confirmarEliminacion = async () => {
    if (!registroAEliminar) {
      setNotificacion({ tipo: 'error', titulo: 'No se pudo eliminar', mensaje: 'No se encontró el registro seleccionado.' });
      return;
    }
    try {
      await apiRequest(`${config.apiPath}/${registroAEliminar.id}`, { method: 'DELETE' });
      setRegistros((actuales) => actuales.filter((registro) => registro.id !== registroAEliminar.id));
      setRegistroAEliminar(null);
      setNotificacion({ tipo: 'success', titulo: 'Registro eliminado', mensaje: 'El registro se eliminó de la base de datos.' });
    } catch (error) {
      setNotificacion({ tipo: 'error', titulo: 'No se pudo eliminar', mensaje: error.message });
    }
  };

  const estadosModulo = modulo === 'ordenes'
    ? (catalogos.estados || []).map((estado) => ({
      ...ESTADOS.orden.find((item) => item.nombre.toLowerCase() === estado.nombre.toLowerCase()) || ESTADOS.orden[0],
      nombre: estado.nombre,
    }))
    : ESTADOS.usuario;
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
  const camposFormularioConCatalogos = camposFormulario.map(([nombre, etiqueta, tipo, opciones]) => (
    modulo === 'ordenes' && nombre === 'estado'
      ? [nombre, etiqueta, tipo, catalogos.estados?.map((estado) => estado.nombre) || []]
      : [nombre, etiqueta, tipo, opciones]
  ));
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

  const cambiarEstado = async (id) => {
    const registro = registros.find((item) => item.id === id);
    if (!registro) return;
    const siguiente = modulo === 'ordenes'
      ? catalogos.estados?.[(catalogos.estados.findIndex((item) => item.nombre === registro.estado) + 1) % catalogos.estados.length]
      : { nombre: estadoSiguiente(estadosModulo, registro.estado) };
    if (!siguiente) return;

    try {
      let respuesta;
      if (modulo === 'ordenes') {
        respuesta = await apiRequest(`${config.apiPath}/${id}/estado`, {
          method: 'PATCH',
          body: { estado_id: siguiente.id },
        });
      } else {
        respuesta = await apiRequest(`${config.apiPath}/${id}`, {
          method: 'PUT',
          body: crearPayload({ ...registro, estado: siguiente.nombre }),
        });
      }
      const actualizado = normalizarRegistro(modulo, respuesta);
      setRegistros((actuales) => actuales.map((item) => item.id === id ? actualizado : item));
    } catch (error) {
      setNotificacion({ tipo: 'error', titulo: 'No se pudo cambiar el estado', mensaje: error.message });
    }
  };

  const cambiarCampoFormulario = (nombre, valor) => {
    setRegistroEditado((actual) => {
      const actualizacion = { ...actual, [nombre]: valor };
      if (modulo === 'ordenes' && nombre === 'estado' && valor.toLowerCase() === 'pendiente') {
        actualizacion.fecha = '';
      }
      if (
        modulo === 'ordenes'
        && nombre === 'estado'
        && valor.toLowerCase() === 'programada'
        && actualizacion.fecha
        && actualizacion.fecha < fechaLocalISO()
      ) {
        actualizacion.fecha = '';
      }
      if (modulo === 'ordenes' && nombre === 'fecha' && !registros.some((registro) => registro.id === actual.id)) {
        const estadoDestino = valor ? 'programada' : 'pendiente';
        actualizacion.estado = catalogos.estados?.find(
          (estado) => estado.nombre.toLowerCase() === estadoDestino,
        )?.nombre || '';
      }
      return actualizacion;
    });
    setErroresFormulario((errores) => ({
      ...errores,
      [nombre]: '',
      ...(nombre === 'tipoPropiedad' && valor === 'Residencial' ? { contacto: '' } : {}),
    }));
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
              <strong style={{ color: tema.text }}>{usuario?.nombre || usuario?.usuario || 'Usuario'}</strong>
              <span style={{ color: tema.subtext }}>{usuario?.rol || 'Administrador'}</span>
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
        <button type="button" onClick={abrirNuevo} disabled={cargando} style={{ ...styles.primaryButton, display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: cargando ? 0.6 : 1 }}><Plus size={16} strokeWidth={2} /> Nuevo registro</button>
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
              {cargando && <tr><td colSpan={config.columnas.length + 1} style={styles.empty}>Cargando desde la base de datos...</td></tr>}
              {registrosFiltrados.map((registro) => <tr key={registro.id}>
                {config.columnas.map(([campo]) => <td key={campo} style={{ ...styles.td, color: tema.text, borderColor: tema.rowBorder }}>{campo === 'estado' ? <EstadoToggle estado={registro[campo]} estados={estadosModulo} onClick={() => cambiarEstado(registro.id)} /> : campo === config.columnas[0][0] ? <span style={styles.nameCell}><span style={{ ...styles.rowIcon, backgroundColor: esOscuro ? '#1e2d4a' : '#f1f5f9', color: tema.subtext }}><IconoFila size={16} strokeWidth={1.8} /></span>{registro[campo]}</span> : registro[campo]}</td>)}
                <td style={{ ...styles.td, borderColor: tema.rowBorder }}>
                  <AccionesFila
                    onVer={() => setRegistroDetalle(registro)}
                    onEditar={() => {
                      setRegistroEditado(registro);
                      setErroresFormulario({});
                      setMostrarFormulario(true);
                    }}
                    onEliminar={() => eliminarRegistro(registro.id)}
                    color={esOscuro ? '#cbd5e1' : '#475569'}
                  />
                </td>
              </tr>)}
              {!cargando && registrosFiltrados.length === 0 && <tr><td colSpan={config.columnas.length + 1} style={styles.empty}>No hay registros que coincidan con la búsqueda.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarFormulario && <div style={styles.overlay}>
        <form noValidate onSubmit={guardarRegistro} style={{ ...styles.modal, backgroundColor: tema.card, color: tema.text }}>
          <div style={styles.modalHeader}><div><div style={{ ...styles.eyebrow, color: esOscuro ? '#facc15' : '#a16207', display: 'flex', alignItems: 'center', gap: '7px' }}><IconoEncabezado size={15} strokeWidth={1.8} /> FORMULARIO</div><h2>{registroEditado?.id && registros.some((registro) => registro.id === registroEditado.id) ? 'Editar registro' : 'Nuevo registro'}</h2></div><button type="button" onClick={() => { setMostrarFormulario(false); setErroresFormulario({}); }} style={{ ...styles.closeButton, color: tema.subtext }}>×</button></div>
          <div style={styles.formGrid}>
            {camposFormularioConCatalogos.map(([nombre, etiqueta, tipo, opciones]) => (
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
                    value={String(registroEditado?.[nombre] || '')}
                    onChange={(evento) => seleccionarFK(nombre, opciones, evento.target.value)}
                    aria-invalid={Boolean(erroresFormulario[nombre])}
                    style={{ ...styles.input, backgroundColor: tema.input, borderColor: erroresFormulario[nombre] ? '#dc2626' : tema.border, color: tema.text }}
                  >
                    <option value="">Selecciona {etiqueta.toLowerCase()}...</option>
                    {obtenerOpcionesFK(opciones, catalogos).map((opcion) => (
                      <option key={opcion.id} value={opcion.id}>{opcion.etiqueta}</option>
                    ))}
                  </select>
                ) : tipo === 'select' && modulo === 'ordenes' && nombre === 'estado' && esNuevaOrden ? (
                  <input
                    type="text"
                    value={registroEditado?.[nombre] || ''}
                    readOnly
                    style={{ ...styles.input, backgroundColor: tema.input, borderColor: erroresFormulario[nombre] ? '#dc2626' : tema.border, color: tema.text }}
                  />
                ) : tipo === 'select' ? (
                  <select
                    value={registroEditado?.[nombre] || ''}
                    onChange={(evento) => cambiarCampoFormulario(nombre, evento.target.value)}
                    aria-invalid={Boolean(erroresFormulario[nombre])}
                    style={{ ...styles.input, backgroundColor: tema.input, borderColor: erroresFormulario[nombre] ? '#dc2626' : tema.border, color: tema.text }}
                  >
                    {(modulo === 'ordenes' && nombre === 'estado'
                      ? opciones.filter((opcion) => ['pendiente', 'programada', 'cancelada'].includes(opcion.toLowerCase()))
                      : opciones
                    ).map((opcion) => <option key={opcion}>{opcion}</option>)}
                  </select>
                ) : tipo === 'segmented' ? (
                  <div role="radiogroup" aria-label={etiqueta} aria-invalid={Boolean(erroresFormulario[nombre])} style={styles.segmentedControl}>
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
                    type={tipo}
                    min={modulo === 'ordenes' && nombre === 'fecha' ? fechaLocalISO() : undefined}
                    disabled={modulo === 'ordenes' && nombre === 'fecha' && !esNuevaOrden && registroEditado?.estado === 'Pendiente'}
                    readOnly={modulo === 'ordenes' && nombre === 'codigo'}
                    value={registroEditado?.[nombre] || ''}
                    onChange={(evento) => cambiarCampoFormulario(nombre, evento.target.value)}
                    aria-invalid={Boolean(erroresFormulario[nombre])}
                    style={{ ...styles.input, backgroundColor: tema.input, borderColor: erroresFormulario[nombre] ? '#dc2626' : tema.border, color: tema.text }}
                  />
                )}
                {erroresFormulario[nombre] && (
                  <span role="alert" style={styles.fieldError}>{erroresFormulario[nombre]}</span>
                )}
              </label>
            ))}
          </div>
          <div style={styles.modalActions}><button type="button" onClick={() => { setMostrarFormulario(false); setErroresFormulario({}); }} style={styles.secondaryButton}>Cancelar</button><button type="submit" style={styles.primaryButton}>Guardar registro</button></div>
        </form>
      </div>}

      {registroDetalle && <div style={styles.overlay}>
        <div style={{ ...styles.modal, backgroundColor: tema.card, color: tema.text }}>
          <div style={styles.modalHeader}><div><div style={{ ...styles.eyebrow, color: esOscuro ? '#facc15' : '#a16207', display: 'flex', alignItems: 'center', gap: '7px' }}><IconoEncabezado size={15} strokeWidth={1.8} /> DETALLE</div><h2 style={{ margin: 0 }}>Información completa</h2></div><button type="button" onClick={() => setRegistroDetalle(null)} style={{ ...styles.closeButton, color: tema.subtext }}>×</button></div>
          <div style={styles.detailGrid}>{camposDetalle.map(([nombre, etiqueta]) => <div key={nombre} style={{ ...styles.detailItem, borderColor: tema.border }}><span style={{ color: tema.subtext }}>{etiqueta}</span><strong>{registroDetalle[nombre] || 'No registrado'}</strong></div>)}</div>
          <div style={styles.modalActions}><button type="button" onClick={() => setRegistroDetalle(null)} style={styles.primaryButton}>Cerrar detalle</button></div>
        </div>
      </div>}

      {registroAEliminar && <div style={styles.overlay}>
        <div style={{ ...styles.modal, backgroundColor: tema.card, color: tema.text, maxWidth: '430px' }}>
          <div style={styles.modalHeader}><div><div style={{ ...styles.eyebrow, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '7px' }}><TriangleAlert size={15} strokeWidth={1.8} /> CONFIRMAR ACCIÓN</div><h2 style={{ margin: 0 }}>Eliminar registro</h2></div><button type="button" onClick={() => setRegistroAEliminar(null)} style={{ ...styles.closeButton, color: tema.subtext }}>×</button></div>
          <p style={{ color: tema.subtext, fontSize: '14px', lineHeight: 1.5, margin: '0 0 20px' }}>¿Seguro que deseas eliminar <strong style={{ color: tema.text }}>{registroAEliminar.nombre || registroAEliminar.contacto || registroAEliminar.documento || registroAEliminar.codigo}</strong>? Esta acción quitará el registro de la lista.</p>
          <div style={styles.modalActions}><button type="button" onClick={() => setRegistroAEliminar(null)} style={styles.secondaryButton}>Cancelar</button><button type="button" onClick={confirmarEliminacion} style={{ ...styles.deleteButton, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}><Trash2 size={15} strokeWidth={1.8} /> Eliminar</button></div>
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

export function Clientes({ usuario }) { return <ModuloGestion modulo="clientes" usuario={usuario} />; }
export function GestionTerceros({ usuario }) { return <ModuloGestion modulo="terceros" usuario={usuario} />; }
export function OrdenesServicio({ usuario }) { return <ModuloGestion modulo="ordenes" usuario={usuario} />; }

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
  fieldError: { display: 'block', marginTop: '5px', color: '#dc2626', fontSize: '12px', lineHeight: 1.4, fontWeight: '500' },
  segmentedControl: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
  segmentedButton: { border: '1px solid', borderRadius: '6px', padding: '10px 8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' },
  notificationOverlay: { position: 'fixed', top: '24px', right: '24px', zIndex: 30 },
  notification: { minWidth: '300px', maxWidth: '380px', display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#fff', border: '1px solid', borderRadius: '9px', padding: '14px 16px', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.2)', color: '#0f172a' },
  notificationIcon: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', flexShrink: 0 },
  notificationClose: { border: 'none', background: 'transparent', color: '#64748b', fontSize: '20px', cursor: 'pointer', marginLeft: 'auto', lineHeight: 1 },
};
