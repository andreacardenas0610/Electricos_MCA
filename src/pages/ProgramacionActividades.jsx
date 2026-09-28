import React, { useContext, useMemo, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext.jsx';

const SearchIcon = ({ color = '#94a3b8' }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EyeIcon = ({ color = '#475569' }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EditIcon = ({ color = '#475569' }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#ef4444"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const ChevronLeftIcon = ({ color = '#64748b' }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = ({ color = '#64748b' }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const CalendarIcon = ({ color = '#ca8a04' }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const SunIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#facc15"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
  </svg>
);

const MoonIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.8 6.8 0 0 0 21 12.8Z" />
  </svg>
);

const INITIAL_ACTIVIDADES = [
  {
    id: 1,
    codigo: 'OT-1092',
    cliente: 'Residencial Las Palmas',
    actividad: 'Instalación tablero eléctrico',
    tecnico: 'Carlos Pérez',
    fecha: '2026-09-08',
    horaInicio: '08:00',
    horaFin: '12:00',
    estado: 'Programada',
    prioridad: 'Alta',
    descripcion:
      'Instalación y configuración de tablero de distribución trifásico.'
  },
  {
    id: 2,
    codigo: 'OT-1093',
    cliente: 'Edificio Horizonte',
    actividad: 'Mantenimiento preventivo',
    tecnico: 'Juan Rodríguez',
    fecha: '2026-09-10',
    horaInicio: '09:00',
    horaFin: '11:00',
    estado: 'En proceso',
    prioridad: 'Media',
    descripcion:
      'Revisión general de instalaciones eléctricas y puntos de conexión.'
  },
  {
    id: 3,
    codigo: 'OT-1094',
    cliente: 'Industrial Norte',
    actividad: 'Diagnóstico de falla',
    tecnico: 'Miguel Torres',
    fecha: '2026-09-15',
    horaInicio: '14:00',
    horaFin: '17:00',
    estado: 'Programada',
    prioridad: 'Alta',
    descripcion:
      'Diagnóstico de falla en circuito de alimentación principal.'
  },
  {
    id: 4,
    codigo: 'OT-1095',
    cliente: 'Centro Comercial Bello',
    actividad: 'Reparación instalación',
    tecnico: 'Carlos Pérez',
    fecha: '2026-09-18',
    horaInicio: '08:30',
    horaFin: '13:00',
    estado: 'Completada',
    prioridad: 'Media',
    descripcion:
      'Reparación de circuito y reemplazo de componentes eléctricos.'
  },
  {
    id: 5,
    codigo: 'OT-1096',
    cliente: 'Conjunto Los Pinos',
    actividad: 'Inspección eléctrica',
    tecnico: 'Juan Rodríguez',
    fecha: '2026-09-22',
    horaInicio: '10:00',
    horaFin: '12:00',
    estado: 'Programada',
    prioridad: 'Baja',
    descripcion:
      'Inspección de instalaciones y verificación de condiciones de seguridad.'
  },
  {
    id: 6,
    codigo: 'OT-1097',
    cliente: 'Casa Familiar Gómez',
    actividad: 'Cambio de cableado',
    tecnico: 'Miguel Torres',
    fecha: '2026-09-24',
    horaInicio: '13:00',
    horaFin: '16:00',
    estado: 'En proceso',
    prioridad: 'Alta',
    descripcion:
      'Cambio de cableado deteriorado en diferentes puntos de la vivienda.'
  }
];

const TECNICOS = [
  'Carlos Pérez',
  'Juan Rodríguez',
  'Miguel Torres'
];

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

const DIAS_SEMANA = [
  'LUN',
  'MAR',
  'MIÉ',
  'JUE',
  'VIE',
  'SÁB',
  'DOM'
];

const obtenerFechaLocal = (fecha) => {
  const partes = fecha.split('-');

  return new Date(
    Number(partes[0]),
    Number(partes[1]) - 1,
    Number(partes[2])
  );
};

const formatearFecha = (fecha) => {
  const date = obtenerFechaLocal(fecha);

  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const obtenerClaseEstado = (estado, esOscuro) => {
  const estilos = {
    Programada: {
      fondo: esOscuro ? '#3f3210' : '#fef3c7',
      texto: esOscuro ? '#facc15' : '#92400e'
    },
    'En proceso': {
      fondo: esOscuro ? '#102c4a' : '#dbeafe',
      texto: esOscuro ? '#60a5fa' : '#1d4ed8'
    },
    Completada: {
      fondo: esOscuro ? '#103521' : '#dcfce7',
      texto: esOscuro ? '#4ade80' : '#166534'
    },
    Cancelada: {
      fondo: esOscuro ? '#3b1d1d' : '#fee2e2',
      texto: esOscuro ? '#f87171' : '#991b1b'
    }
  };

  return estilos[estado] || estilos.Programada;
};

const obtenerClasePrioridad = (prioridad) => {
  if (prioridad === 'Alta') return '#ef4444';
  if (prioridad === 'Media') return '#f59e0b';
  return '#94a3b8';
};

export function ProgramacionActividades() {
  const { theme: temaGlobal, toggleTheme } =
    useContext(ThemeContext);

  const esOscuro = temaGlobal === 'dark';

  const [actividades, setActividades] =
    useState(INITIAL_ACTIVIDADES);

  const [filtro, setFiltro] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');

  const [mesActual, setMesActual] = useState(8);
  const [anioActual, setAnioActual] = useState(2026);

  const [modalNueva, setModalNueva] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);

  const [actividadSeleccionada, setActividadSeleccionada] =
    useState(null);

  const [formData, setFormData] = useState({
    codigo: '',
    cliente: '',
    actividad: '',
    tecnico: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    estado: 'Programada',
    prioridad: 'Media',
    descripcion: ''
  });

  const colores = {
    fondo: esOscuro ? '#0b0f19' : '#f8fafc',
    fondoSecundario: esOscuro ? '#111827' : '#eef2f6',
    tarjeta: esOscuro ? '#111c38' : '#ffffff',
    tarjetaSecundaria: esOscuro ? '#0f1a33' : '#f8fafc',
    borde: esOscuro ? '#263555' : '#e2e8f0',
    texto: esOscuro ? '#f8fafc' : '#0f172a',
    secundario: esOscuro ? '#94a3b8' : '#64748b',
    amarillo: '#facc15',
    iconColor: esOscuro ? '#cbd5e1' : '#475569'
  };

  const actividadesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return actividades.filter((item) => {
      const coincideFiltro =
        filtro === 'Todas' || item.estado === filtro;

      if (!coincideFiltro) return false;

      if (!texto) return true;

      return (
        item.codigo.toLowerCase().includes(texto) ||
        item.cliente.toLowerCase().includes(texto) ||
        item.actividad.toLowerCase().includes(texto) ||
        item.tecnico.toLowerCase().includes(texto)
      );
    });
  }, [actividades, filtro, busqueda]);

  const actividadesDelMes = useMemo(() => {
    return actividadesFiltradas.filter((item) => {
      const date = obtenerFechaLocal(item.fecha);

      return (
        date.getMonth() === mesActual &&
        date.getFullYear() === anioActual
      );
    });
  }, [
    actividadesFiltradas,
    mesActual,
    anioActual
  ]);

  const estadisticas = useMemo(
    () => ({
      total: actividades.length,
      programadas: actividades.filter(
        (item) => item.estado === 'Programada'
      ).length,
      proceso: actividades.filter(
        (item) => item.estado === 'En proceso'
      ).length,
      completadas: actividades.filter(
        (item) => item.estado === 'Completada'
      ).length
    }),
    [actividades]
  );

  const generarDiasCalendario = () => {
    const primerDia = new Date(
      anioActual,
      mesActual,
      1
    );

    const ultimoDia = new Date(
      anioActual,
      mesActual + 1,
      0
    );

    const diasMes = ultimoDia.getDate();

    let inicio = primerDia.getDay();

    inicio = inicio === 0 ? 6 : inicio - 1;

    const dias = [];

    for (let i = 0; i < inicio; i++) {
      dias.push(null);
    }

    for (let dia = 1; dia <= diasMes; dia++) {
      dias.push(
        new Date(
          anioActual,
          mesActual,
          dia
        )
      );
    }

    while (dias.length % 7 !== 0) {
      dias.push(null);
    }

    return dias;
  };

  const cambiarMes = (direccion) => {
    if (direccion > 0) {
      if (mesActual === 11) {
        setMesActual(0);
        setAnioActual((prev) => prev + 1);
      } else {
        setMesActual((prev) => prev + 1);
      }
    } else {
      if (mesActual === 0) {
        setMesActual(11);
        setAnioActual((prev) => prev - 1);
      } else {
        setMesActual((prev) => prev - 1);
      }
    }
  };

  const volverHoy = () => {
    const hoy = new Date();

    setMesActual(hoy.getMonth());
    setAnioActual(hoy.getFullYear());
  };

  const abrirNuevaActividad = () => {
    setFormData({
      codigo: `OT-${1100 + actividades.length + 1}`,
      cliente: '',
      actividad: '',
      tecnico: '',
      fecha: '',
      horaInicio: '',
      horaFin: '',
      estado: 'Programada',
      prioridad: 'Media',
      descripcion: ''
    });

    setModalNueva(true);
  };

  const abrirEditar = (actividad) => {
    setActividadSeleccionada(actividad);
    setFormData({ ...actividad });
    setModalEditar(true);
  };

  const abrirDetalle = (actividad) => {
    setActividadSeleccionada(actividad);
    setModalDetalle(true);
  };

  const cerrarModales = () => {
    setModalNueva(false);
    setModalEditar(false);
    setModalDetalle(false);
    setActividadSeleccionada(null);
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const guardarActividad = (e) => {
    e.preventDefault();

    if (!formData.cliente.trim()) {
      alert('Ingrese el cliente.');
      return;
    }

    if (!formData.actividad.trim()) {
      alert('Ingrese la actividad.');
      return;
    }

    if (!formData.tecnico) {
      alert('Seleccione un técnico.');
      return;
    }

    if (!formData.fecha) {
      alert('Seleccione la fecha.');
      return;
    }

    if (!formData.horaInicio) {
      alert('Seleccione la hora de inicio.');
      return;
    }

    if (modalEditar && actividadSeleccionada) {
      setActividades((prev) =>
        prev.map((item) =>
          item.id === actividadSeleccionada.id
            ? {
                ...formData,
                id: actividadSeleccionada.id
              }
            : item
        )
      );
    } else {
      setActividades((prev) => [
        ...prev,
        {
          ...formData,
          id: Date.now()
        }
      ]);
    }

    cerrarModales();
  };

  const eliminarActividad = (id) => {
    const actividad = actividades.find(
      (item) => item.id === id
    );

    if (!actividad) return;

    if (
      window.confirm(
        `¿Está seguro de eliminar la actividad ${actividad.codigo}?`
      )
    ) {
      setActividades((prev) =>
        prev.filter((item) => item.id !== id)
      );

      if (actividadSeleccionada?.id === id) {
        cerrarModales();
      }
    }
  };

  const irAEditarDesdeDetalle = () => {
    if (!actividadSeleccionada) return;

    setModalDetalle(false);
    abrirEditar(actividadSeleccionada);
  };

  const actividadesPorFecha = (fecha) => {
    if (!fecha) return [];

    const fechaTexto = `${fecha.getFullYear()}-${String(
      fecha.getMonth() + 1
    ).padStart(2, '0')}-${String(
      fecha.getDate()
    ).padStart(2, '0')}`;

    return actividadesFiltradas.filter(
      (item) => item.fecha === fechaTexto
    );
  };

  const esHoy = (fecha) => {
    if (!fecha) return false;

    const hoy = new Date();

    return (
      fecha.getFullYear() === hoy.getFullYear() &&
      fecha.getMonth() === hoy.getMonth() &&
      fecha.getDate() === hoy.getDate()
    );
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '7px',
    border: `1px solid ${colores.borde}`,
    backgroundColor: esOscuro
      ? '#0b1329'
      : '#ffffff',
    color: colores.texto,
    fontSize: '13px',
    boxSizing: 'border-box',
    outline: 'none'
  };

  const styles = {
    btnIcon: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '3px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },

    card: {
      padding: '12px',
      borderRadius: '6px',
      border: `1px solid ${colores.borde}`,
      backgroundColor: colores.tarjeta
    },

    cardTag: {
      fontSize: '8px',
      fontWeight: 'bold',
      letterSpacing: '0.3px',
      color: colores.secundario
    },

    cardNum: {
      fontSize: '18px',
      fontWeight: 'bold',
      margin: '2px 0',
      color: colores.texto
    }
  };

  const diasCalendario = generarDiasCalendario();

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colores.fondo,
        color: colores.texto,
        padding: '22px',
        boxSizing: 'border-box',
        fontFamily:
          'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}
    >
      <div
        style={{
          maxWidth: '1500px',
          margin: '0 auto'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '15px',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '430px'
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <SearchIcon color={colores.secundario} />
            </div>

            <input
              type="text"
              placeholder="Buscar actividad, cliente, técnico..."
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              style={{
                ...inputStyle,
                paddingLeft: '34px'
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <button
              onClick={toggleTheme}
              style={{
                border: `1px solid ${colores.borde}`,
                backgroundColor: colores.tarjeta,
                color: colores.texto,
                borderRadius: '7px',
                padding: '9px 13px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px'
              }}
            >
              {esOscuro ? (
                <>
                  <SunIcon />
                  Claro
                </>
              ) : (
                <>
                  <MoonIcon />
                  Oscuro
                </>
              )}
            </button>

            <button
              onClick={abrirNuevaActividad}
              style={{
                border: 'none',
                backgroundColor: '#ca8a04',
                color: '#ffffff',
                borderRadius: '7px',
                padding: '10px 14px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px'
              }}
            >
              <PlusIcon />
              AGENDAR NUEVA OT
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <h1
            style={{
              fontSize: '25px',
              margin: 0,
              fontWeight: '700',
              color: colores.texto
            }}
          >
            Programación de Actividades
          </h1>

          <p
            style={{
              margin: '5px 0 0',
              fontSize: '13px',
              color: colores.secundario
            }}
          >
            Agenda y seguimiento de órdenes de trabajo
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(4, minmax(0, 1fr))',
            gap: '12px',
            marginBottom: '16px'
          }}
        >
          <div style={styles.card}>
            <div style={styles.cardTag}>
              TOTAL ACTIVIDADES
            </div>
            <div style={styles.cardNum}>
              {estadisticas.total}
            </div>
            <div
              style={{
                fontSize: '10px',
                color: colores.secundario
              }}
            >
              Registradas
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTag}>
              PROGRAMADAS
            </div>
            <div
              style={{
                ...styles.cardNum,
                color: '#facc15'
              }}
            >
              {estadisticas.programadas}
            </div>
            <div
              style={{
                fontSize: '10px',
                color: colores.secundario
              }}
            >
              Pendientes
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTag}>
              EN PROCESO
            </div>
            <div
              style={{
                ...styles.cardNum,
                color: '#60a5fa'
              }}
            >
              {estadisticas.proceso}
            </div>
            <div
              style={{
                fontSize: '10px',
                color: colores.secundario
              }}
            >
              En ejecución
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTag}>
              COMPLETADAS
            </div>
            <div
              style={{
                ...styles.cardNum,
                color: '#4ade80'
              }}
            >
              {estadisticas.completadas}
            </div>
            <div
              style={{
                fontSize: '10px',
                color: colores.secundario
              }}
            >
              Finalizadas
            </div>
          </div>
        </div>

        <div
          style={{
            ...styles.card,
            padding: '14px',
            marginBottom: '16px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '12px'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CalendarIcon />

              <span
                style={{
                  fontSize: '14px',
                  fontWeight: '700'
                }}
              >
                {MESES[mesActual]} {anioActual}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <button
                type="button"
                onClick={() => cambiarMes(-1)}
                title="Mes anterior"
                aria-label="Mes anterior"
                style={{
                  width: '30px',
                  height: '30px',
                  border: `1px solid ${colores.borde}`,
                  backgroundColor: colores.tarjetaSecundaria,
                  color: colores.iconColor,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                <ChevronLeftIcon
                  color={colores.iconColor}
                />
              </button>

              <button
                type="button"
                onClick={volverHoy}
                style={{
                  height: '30px',
                  border: `1px solid ${colores.borde}`,
                  backgroundColor: colores.tarjetaSecundaria,
                  color: colores.texto,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  padding: '0 10px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}
              >
                Hoy
              </button>

              <button
                type="button"
                onClick={() => cambiarMes(1)}
                title="Mes siguiente"
                aria-label="Mes siguiente"
                style={{
                  width: '30px',
                  height: '30px',
                  border: `1px solid ${colores.borde}`,
                  backgroundColor: colores.tarjetaSecundaria,
                  color: colores.iconColor,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                <ChevronRightIcon
                  color={colores.iconColor}
                />
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
              flexWrap: 'wrap'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <span
                style={{
                  fontSize: '9px',
                  color: colores.secundario,
                  fontWeight: '700'
                }}
              >
                PRIORIDAD
              </span>

              <span
                style={{
                  fontSize: '9px',
                  color: colores.secundario
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                    marginRight: '4px'
                  }}
                />
                Alta
              </span>

              <span
                style={{
                  fontSize: '9px',
                  color: colores.secundario
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#f59e0b',
                    marginRight: '4px'
                  }}
                />
                Media
              </span>

              <span
                style={{
                  fontSize: '9px',
                  color: colores.secundario
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#94a3b8',
                    marginRight: '4px'
                  }}
                />
                Baja
              </span>

              <span
                style={{
                  fontSize: '9px',
                  color: colores.secundario
                }}
              >
                Texto = hora + ID de OT
              </span>

              <span
                style={{
                  fontSize: '9px',
                  color: colores.secundario
                }}
              >
                Clic en actividad = ver detalle
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '5px'
              }}
            >
              {[
                'Todas',
                'Programada',
                'En proceso',
                'Completada'
              ].map((opcion) => (
                <button
                  key={opcion}
                  onClick={() => setFiltro(opcion)}
                  style={{
                    border: `1px solid ${
                      filtro === opcion
                        ? '#ca8a04'
                        : colores.borde
                    }`,
                    backgroundColor:
                      filtro === opcion
                        ? esOscuro
                          ? '#3f3210'
                          : '#fef3c7'
                        : colores.tarjetaSecundaria,
                    color:
                      filtro === opcion
                        ? '#ca8a04'
                        : colores.secundario,
                    borderRadius: '5px',
                    padding: '6px 8px',
                    fontSize: '9px',
                    cursor: 'pointer',
                    fontWeight:
                      filtro === opcion
                        ? '700'
                        : '500'
                  }}
                >
                  {opcion}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(7, minmax(0, 1fr))',
              borderTop: `1px solid ${colores.borde}`,
              borderLeft: `1px solid ${colores.borde}`
            }}
          >
            {DIAS_SEMANA.map((dia) => (
              <div
                key={dia}
                style={{
                  padding: '7px 5px',
                  textAlign: 'center',
                  fontSize: '9px',
                  fontWeight: '700',
                  color: colores.secundario,
                  borderRight: `1px solid ${colores.borde}`,
                  borderBottom: `1px solid ${colores.borde}`,
                  backgroundColor:
                    colores.tarjetaSecundaria
                }}
              >
                {dia}
              </div>
            ))}

            {diasCalendario.map((fecha, index) => {
              const eventos =
                actividadesPorFecha(fecha);

              return (
                <div
                  key={index}
                  style={{
                    minHeight: '60px',
                    padding: '6px',
                    borderRight: `1px solid ${colores.borde}`,
                    borderBottom: `1px solid ${colores.borde}`,
                    backgroundColor:
                      fecha && esHoy(fecha)
                        ? esOscuro
                          ? '#171d27'
                          : '#fffbeb'
                        : colores.tarjeta,
                    position: 'relative',
                    boxSizing: 'border-box'
                  }}
                >
                  {fecha && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginBottom: '3px'
                      }}
                    >
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '9px',
                          fontWeight: '700',
                          backgroundColor: esHoy(
                            fecha
                          )
                            ? '#ca8a04'
                            : 'transparent',
                          color: esHoy(fecha)
                            ? '#ffffff'
                            : colores.secundario,
                          border:
                            esHoy(fecha)
                              ? 'none'
                              : '1px solid transparent'
                        }}
                      >
                        {fecha.getDate()}
                      </span>
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px'
                    }}
                  >
                    {eventos
                      .slice(0, 2)
                      .map((evento) => (
                        <button
                          key={evento.id}
                          type="button"
                          onClick={() =>
                            abrirDetalle(evento)
                          }
                          title={`${evento.codigo} - ${evento.actividad}`}
                          style={{
                            width: '100%',
                            border: 'none',
                            borderLeft: `3px solid ${obtenerClasePrioridad(
                              evento.prioridad
                            )}`,
                            backgroundColor:
                              esOscuro
                                ? '#0b1329'
                                : '#f8fafc',
                            color: colores.texto,
                            textAlign: 'left',
                            padding: '3px 4px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '8px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {evento.horaInicio} ·{' '}
                          {evento.codigo}
                        </button>
                      ))}

                    {eventos.length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          abrirDetalle(
                            eventos[2]
                          )
                        }
                        style={{
                          border: 'none',
                          background: 'none',
                          color: '#ca8a04',
                          cursor: 'pointer',
                          fontSize: '8px',
                          textAlign: 'left',
                          padding: '1px 3px'
                        }}
                      >
                        +{eventos.length - 2} más
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            ...styles.card,
            padding: '0',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: `1px solid ${colores.borde}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: colores.texto
                }}
              >
                Actividades del mes
              </h2>

              <span
                style={{
                  fontSize: '9px',
                  color: colores.secundario
                }}
              >
                {actividadesDelMes.length} actividades
                encontradas
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                '90px 1.5fr 1fr 130px 100px 165px',
              padding: '9px 14px',
              backgroundColor:
                colores.tarjetaSecundaria,
              borderBottom: `1px solid ${colores.borde}`,
              fontSize: '8px',
              fontWeight: '700',
              color: colores.secundario
            }}
          >
            <div>ID OT</div>
            <div>Actividad / Cliente</div>
            <div>Técnico</div>
            <div>Fecha</div>
            <div>Prioridad</div>
            <div style={{ textAlign: 'right' }}>
              Acciones
            </div>
          </div>

          {actividadesDelMes.length === 0 ? (
            <div
              style={{
                padding: '35px',
                textAlign: 'center',
                color: colores.secundario,
                fontSize: '12px'
              }}
            >
              No hay actividades para los filtros
              seleccionados.
            </div>
          ) : (
            actividadesDelMes.map((item) => {
              const estado =
                obtenerClaseEstado(
                  item.estado,
                  esOscuro
                );

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '90px 1.5fr 1fr 130px 100px 165px',
                    padding: '11px 14px',
                    borderBottom: `1px solid ${colores.borde}`,
                    alignItems: 'center',
                    fontSize: '10px',
                    gap: '5px'
                  }}
                >
                  <div
                    style={{
                      color: '#ca8a04',
                      fontWeight: '700'
                    }}
                  >
                    {item.codigo}
                  </div>

                  <div
                    style={{
                      minWidth: 0
                    }}
                  >
                    <div
                      style={{
                        color: colores.texto,
                        fontWeight: '600',
                        marginBottom: '3px',
                        overflow: 'hidden',
                        textOverflow:
                          'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.actividad}
                    </div>

                    <div
                      style={{
                        color: colores.secundario,
                        fontSize: '9px',
                        overflow: 'hidden',
                        textOverflow:
                          'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.cliente}
                    </div>
                  </div>

                  <div
                    style={{
                      color: colores.texto
                    }}
                  >
                    {item.tecnico}
                  </div>

                  <div>
                    <div
                      style={{
                        color: colores.texto
                      }}
                    >
                      {formatearFecha(item.fecha)}
                    </div>

                    <div
                      style={{
                        color: colores.secundario,
                        fontSize: '9px',
                        marginTop: '2px'
                      }}
                    >
                      {item.horaInicio}
                      {item.horaFin
                        ? ` - ${item.horaFin}`
                        : ''}
                    </div>
                  </div>

                  <div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '9px',
                        color: colores.texto
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor:
                            obtenerClasePrioridad(
                              item.prioridad
                            )
                        }}
                      />

                      {item.prioridad}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'flex-end',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span
                      style={{
                        backgroundColor:
                          estado.fondo,
                        color: estado.texto,
                        padding: '4px 6px',
                        borderRadius: '4px',
                        fontSize: '8px',
                        fontWeight: '700',
                        whiteSpace:
                          'nowrap'
                      }}
                    >
                      {item.estado}
                    </span>

                    <button
                      type="button"
                      title="Ver detalle"
                      onClick={() =>
                        abrirDetalle(item)
                      }
                      style={styles.btnIcon}
                    >
                      <EyeIcon
                        color={
                          colores.iconColor
                        }
                      />
                    </button>

                    <button
                      type="button"
                      title="Editar actividad"
                      onClick={() =>
                        abrirEditar(item)
                      }
                      style={styles.btnIcon}
                    >
                      <EditIcon
                        color={
                          colores.iconColor
                        }
                      />
                    </button>

                    <button
                      type="button"
                      title="Eliminar actividad"
                      onClick={() =>
                        eliminarActividad(
                          item.id
                        )
                      }
                      style={styles.btnIcon}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {(modalNueva || modalEditar) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor:
              'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              cerrarModales();
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor:
                colores.tarjeta,
              border: `1px solid ${colores.borde}`,
              borderRadius: '9px',
              boxShadow:
                '0 20px 60px rgba(0,0,0,0.35)'
            }}
          >
            <div
              style={{
                padding: '16px 18px',
                borderBottom: `1px solid ${colores.borde}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    color: colores.texto
                  }}
                >
                  {modalEditar
                    ? 'Editar actividad'
                    : 'Agendar nueva OT'}
                </h2>

                <p
                  style={{
                    margin: '4px 0 0',
                    color: colores.secundario,
                    fontSize: '10px'
                  }}
                >
                  Complete la información de la
                  orden de trabajo
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModales}
                style={{
                  border: 'none',
                  background: 'none',
                  color: colores.secundario,
                  fontSize: '20px',
                  cursor: 'pointer',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={guardarActividad}>
              <div
                style={{
                  padding: '18px',
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(2, minmax(0, 1fr))',
                  gap: '14px'
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      fontWeight: '700',
                      marginBottom: '5px',
                      color: colores.texto
                    }}
                  >
                    Código OT
                  </label>

                  <input
                    name="codigo"
                    value={formData.codigo}
                    onChange={manejarCambio}
                    style={inputStyle}
                    readOnly
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      fontWeight: '700',
                      marginBottom: '5px',
                      color: colores.texto
                    }}
                  >
                    Cliente *
                  </label>

                  <input
                    name="cliente"
                    value={formData.cliente}
                    onChange={manejarCambio}
                    placeholder="Nombre del cliente"
                    style={inputStyle}
                  />
                </div>

                <div
                  style={{
                    gridColumn:
                      '1 / -1'
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      fontWeight: '700',
                      marginBottom: '5px',
                      color: colores.texto
                    }}
                  >
                    Actividad *
                  </label>

                  <input
                    name="actividad"
                    value={formData.actividad}
                    onChange={manejarCambio}
                    placeholder="Descripción de la actividad"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      fontWeight: '700',
                      marginBottom: '5px',
                      color: colores.texto
                    }}
                  >
                    Técnico *
                  </label>

                  <select
                    name="tecnico"
                    value={formData.tecnico}
                    onChange={manejarCambio}
                    style={inputStyle}
                  >
                    <option value="">
                      Seleccione un técnico
                    </option>

                    {TECNICOS.map((tecnico) => (
                      <option
                        key={tecnico}
                        value={tecnico}
                      >
                        {tecnico}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      fontWeight: '700',
                      marginBottom: '5px',
                      color: colores.texto
                    }}
                  >
                    Fecha *
                  </label>

                  <input
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={manejarCambio}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      fontWeight: '700',
                      marginBottom: '5px',
                      color: colores.texto
                    }}
                  >
                    Hora inicio *
                  </label>

                  <input
                    type="time"
                    name="horaInicio"
                    value={formData.horaInicio}
                    onChange={manejarCambio}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      fontWeight: '700',
                      marginBottom: '5px',
                      color: colores.texto
                    }}
                  >
                    Hora fin
                  </label>

                  <input
                    type="time"
                    name="horaFin"
                    value={formData.horaFin}
                    onChange={manejarCambio}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      fontWeight: '700',
                      marginBottom: '5px',
                      color: colores.texto
                    }}
                  >
                    Prioridad
                  </label>

                  <select
                    name="prioridad"
                    value={formData.prioridad}
                    onChange={manejarCambio}
                    style={inputStyle}
                  >
                    <option value="Alta">
                      Alta
                    </option>
                    <option value="Media">
                      Media
                    </option>
                    <option value="Baja">
                      Baja
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      fontWeight: '700',
                      marginBottom: '5px',
                      color: colores.texto
                    }}
                  >
                    Estado
                  </label>

                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={manejarCambio}
                    style={inputStyle}
                  >
                    <option value="Programada">
                      Programada
                    </option>
                    <option value="En proceso">
                      En proceso
                    </option>
                    <option value="Completada">
                      Completada
                    </option>
                    <option value="Cancelada">
                      Cancelada
                    </option>
                  </select>
                </div>

                <div
                  style={{
                    gridColumn:
                      '1 / -1'
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      fontWeight: '700',
                      marginBottom: '5px',
                      color: colores.texto
                    }}
                  >
                    Descripción
                  </label>

                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={manejarCambio}
                    placeholder="Detalles adicionales de la actividad..."
                    rows="4"
                    style={{
                      ...inputStyle,
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: '13px 18px',
                  borderTop: `1px solid ${colores.borde}`,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px'
                }}
              >
                <button
                  type="button"
                  onClick={cerrarModales}
                  style={{
                    border: `1px solid ${colores.borde}`,
                    backgroundColor:
                      colores.tarjetaSecundaria,
                    color: colores.texto,
                    borderRadius: '6px',
                    padding: '9px 13px',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  style={{
                    border: 'none',
                    backgroundColor: '#ca8a04',
                    color: '#ffffff',
                    borderRadius: '6px',
                    padding: '9px 13px',
                    fontSize: '10px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {modalEditar
                    ? 'Guardar Cambios'
                    : 'Agendar Actividad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalDetalle &&
        actividadSeleccionada && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor:
                'rgba(0, 0, 0, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 1000
            }}
            onMouseDown={(e) => {
              if (
                e.target === e.currentTarget
              ) {
                cerrarModales();
              }
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '600px',
                backgroundColor:
                  colores.tarjeta,
                border: `1px solid ${colores.borde}`,
                borderRadius: '9px',
                overflow: 'hidden',
                boxShadow:
                  '0 20px 60px rgba(0,0,0,0.35)'
              }}
            >
              <div
                style={{
                  padding: '16px 18px',
                  borderBottom: `1px solid ${colores.borde}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}
              >
                <div>
                  <div
                    style={{
                      color: '#ca8a04',
                      fontSize: '10px',
                      fontWeight: '700',
                      marginBottom: '4px'
                    }}
                  >
                    {actividadSeleccionada.codigo}
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      fontSize: '17px',
                      color: colores.texto
                    }}
                  >
                    {
                      actividadSeleccionada.actividad
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={cerrarModales}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: colores.secundario,
                    fontSize: '20px',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>

              <div
                style={{
                  padding: '18px',
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(2, minmax(0, 1fr))',
                  gap: '15px'
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '9px',
                      color: colores.secundario,
                      fontWeight: '700',
                      marginBottom: '4px'
                    }}
                  >
                    CLIENTE
                  </div>

                  <div
                    style={{
                      fontSize: '11px',
                      color: colores.texto
                    }}
                  >
                    {
                      actividadSeleccionada.cliente
                    }
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '9px',
                      color: colores.secundario,
                      fontWeight: '700',
                      marginBottom: '4px'
                    }}
                  >
                    TÉCNICO
                  </div>

                  <div
                    style={{
                      fontSize: '11px',
                      color: colores.texto
                    }}
                  >
                    {
                      actividadSeleccionada.tecnico
                    }
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '9px',
                      color: colores.secundario,
                      fontWeight: '700',
                      marginBottom: '4px'
                    }}
                  >
                    FECHA
                  </div>

                  <div
                    style={{
                      fontSize: '11px',
                      color: colores.texto
                    }}
                  >
                    {formatearFecha(
                      actividadSeleccionada.fecha
                    )}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '9px',
                      color: colores.secundario,
                      fontWeight: '700',
                      marginBottom: '4px'
                    }}
                  >
                    HORARIO
                  </div>

                  <div
                    style={{
                      fontSize: '11px',
                      color: colores.texto
                    }}
                  >
                    {
                      actividadSeleccionada.horaInicio
                    }

                    {actividadSeleccionada.horaFin
                      ? ` - ${actividadSeleccionada.horaFin}`
                      : ''}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '9px',
                      color: colores.secundario,
                      fontWeight: '700',
                      marginBottom: '4px'
                    }}
                  >
                    PRIORIDAD
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      color: colores.texto
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor:
                          obtenerClasePrioridad(
                            actividadSeleccionada.prioridad
                          )
                      }}
                    />

                    {
                      actividadSeleccionada.prioridad
                    }
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '9px',
                      color: colores.secundario,
                      fontWeight: '700',
                      marginBottom: '4px'
                    }}
                  >
                    ESTADO
                  </div>

                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor:
                        obtenerClaseEstado(
                          actividadSeleccionada.estado,
                          esOscuro
                        ).fondo,
                      color:
                        obtenerClaseEstado(
                          actividadSeleccionada.estado,
                          esOscuro
                        ).texto,
                      padding: '4px 7px',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: '700'
                    }}
                  >
                    {
                      actividadSeleccionada.estado
                    }
                  </span>
                </div>

                <div
                  style={{
                    gridColumn:
                      '1 / -1'
                  }}
                >
                  <div
                    style={{
                      fontSize: '9px',
                      color: colores.secundario,
                      fontWeight: '700',
                      marginBottom: '5px'
                    }}
                  >
                    DESCRIPCIÓN
                  </div>

                  <div
                    style={{
                      fontSize: '11px',
                      lineHeight: '1.5',
                      color: colores.texto,
                      backgroundColor:
                        colores.tarjetaSecundaria,
                      border: `1px solid ${colores.borde}`,
                      borderRadius: '6px',
                      padding: '10px'
                    }}
                  >
                    {actividadSeleccionada.descripcion ||
                      'Sin descripción registrada.'}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '13px 18px',
                  borderTop: `1px solid ${colores.borde}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    eliminarActividad(
                      actividadSeleccionada.id
                    )
                  }
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#ef4444',
                    fontSize: '10px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Eliminar
                </button>

                <div
                  style={{
                    display: 'flex',
                    gap: '8px'
                  }}
                >
                  <button
                    type="button"
                    onClick={
                      irAEditarDesdeDetalle
                    }
                    style={{
                      border: `1px solid ${colores.borde}`,
                      backgroundColor:
                        colores.tarjetaSecundaria,
                      color: colores.texto,
                      borderRadius: '6px',
                      padding: '9px 13px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <EditIcon
                      color={
                        colores.iconColor
                      }
                    />
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={cerrarModales}
                    style={{
                      border: 'none',
                      backgroundColor:
                        '#ca8a04',
                      color: '#ffffff',
                      borderRadius: '6px',
                      padding: '9px 13px',
                      fontSize: '10px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default ProgramacionActividades;