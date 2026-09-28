import React, { useContext, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext.jsx';
import {
  EstadoToggle,
  ESTADOS,
  estadoSiguiente
} from '../components/EstadoToggle.jsx';
import { AccionesFila } from '../components/AccionesFila.jsx';

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

const ClockIcon = ({ color = '#64748b' }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const BellIcon = ({ color = '#334155' }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const HelpIcon = ({ color = '#334155' }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const SunIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="#f59e0b"
    stroke="#f59e0b"
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
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const ShieldWatermark = ({ color = '#e2e8f0' }) => (
  <svg
    width="50"
    height="50"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const INITIAL_DATA = [
  {
    id: 1,
    codigo: 'ELEC-001',
    nombre: 'Instalación de Tablero Trifásico',
    desc: 'Montaje, cableado y puesta en funcionamiento de tablero eléctrico trifásico.',
    unidad: 'Proyecto',
    precio: '$850.00',
    precioNumerico: 850,
    moneda: 'USD',
    subPrecio: 'USD',
    tiempo: '2 Días',
    categoria: 'Instalación',
    estado: 'Activo'
  },
  {
    id: 2,
    codigo: 'ELEC-002',
    nombre: 'Mantenimiento Preventivo',
    desc: 'Limpieza, reapriete de conexiones y revisión general de instalaciones.',
    unidad: 'Hora',
    precio: '$65.00',
    precioNumerico: 65,
    moneda: 'USD / H',
    subPrecio: 'USD / H',
    tiempo: '4 Horas',
    categoria: 'Mantenimiento',
    estado: 'Activo'
  },
  {
    id: 3,
    codigo: 'ELEC-003',
    nombre: 'Medición de Pozo a Tierra',
    desc: 'Medición y certificación de sistema de puesta a tierra.',
    unidad: 'Punto',
    precio: '$120.00',
    precioNumerico: 120,
    moneda: 'USD',
    subPrecio: 'USD',
    tiempo: '1 Día',
    categoria: 'Protocolos',
    estado: 'Activo'
  },
  {
    id: 4,
    codigo: 'ELEC-004',
    nombre: 'Instalación Luminarias LED',
    desc: 'Colocación, conexión y puesta en funcionamiento de luminarias LED.',
    unidad: 'Punto',
    precio: '$18.00',
    precioNumerico: 18,
    moneda: 'USD / H',
    subPrecio: 'USD / H',
    tiempo: 'Inmediato',
    categoria: 'Instalación',
    estado: 'Pausado'
  },
  {
    id: 5,
    codigo: 'ELEC-005',
    nombre: 'Instalación de Red Eléctrica',
    desc: 'Instalación de circuitos eléctricos para espacios residenciales y comerciales.',
    unidad: 'Proyecto',
    precio: '$1,250.00',
    precioNumerico: 1250,
    moneda: 'COP',
    subPrecio: 'COP',
    tiempo: '5 Días',
    categoria: 'Instalación',
    estado: 'Activo'
  },
  {
    id: 6,
    codigo: 'ELEC-006',
    nombre: 'Diagnóstico de Fallas Eléctricas',
    desc: 'Inspección técnica para identificar fallas y determinar acciones correctivas.',
    unidad: 'Servicio',
    precio: '$95.00',
    precioNumerico: 95,
    moneda: 'COP / H',
    subPrecio: 'COP / H',
    tiempo: '3 Horas',
    categoria: 'Mantenimiento',
    estado: 'Activo'
  }
];

export function CatalogoServicios() {
  const { theme: temaGlobal, toggleTheme } = useContext(ThemeContext);

  const [servicios, setServicios] = useState(INITIAL_DATA);
  const [tab, setTab] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modoModal, setModoModal] = useState('crear');
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    desc: '',
    unidad: 'Proyecto',
    precio: '',
    precioNumerico: 0,
    moneda: 'USD',
    subPrecio: 'USD',
    tiempo: '',
    categoria: 'Instalación',
    estado: 'Activo'
  });

  const darkMode = temaGlobal === 'dark';

  const theme = {
    bg: darkMode ? '#0b0f19' : '#eef2f6',
    cardBg: darkMode ? '#151c2c' : '#ffffff',
    headerBg: darkMode ? '#111827' : '#ffffff',
    textMain: darkMode ? '#f8fafc' : '#0f172a',
    textSub: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#1e293b' : '#e2e8f0',
    inputBg: darkMode ? '#1e293b' : '#f1f5f9',
    tableBorder: darkMode ? '#1e293b' : '#f1f5f9',
    iconColor: darkMode ? '#cbd5e1' : '#475569'
  };

  const SERVICIOS_POR_PAGINA = 5;

  const formatearPrecio = (valor, moneda) => {
    const numero = Number(valor) || 0;

    if (moneda === 'COP' || moneda === 'COP / H') {
      return `$${numero.toLocaleString('es-CO')}`;
    }

    return `$${numero.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const obtenerNumeroPrecio = (valor) => {
    if (typeof valor === 'number') {
      return valor;
    }

    if (!valor) {
      return 0;
    }

    const limpio = String(valor)
      .replace(/[^\d.,-]/g, '')
      .replace(/,/g, '');

    return Number(limpio) || 0;
  };

  const generarCodigo = () => {
    const numeros = servicios
      .map((servicio) =>
        Number(String(servicio.codigo).replace('ELEC-', ''))
      )
      .filter((numero) => Number.isFinite(numero));

    const siguiente =
      numeros.length > 0 ? Math.max(...numeros) + 1 : 1;

    return `ELEC-${String(siguiente).padStart(3, '0')}`;
  };

  const handleOpenCrear = () => {
    setModoModal('crear');

    const nuevoCodigo = generarCodigo();

    setFormData({
      codigo: nuevoCodigo,
      nombre: '',
      desc: '',
      unidad: 'Proyecto',
      precio: '',
      precioNumerico: 0,
      moneda: 'USD',
      subPrecio: 'USD',
      tiempo: '1 Día',
      categoria: 'Instalación',
      estado: 'Activo'
    });

    setSelectedItem(null);
    setModalOpen(true);
  };

  const handleOpenVer = (item) => {
    setModoModal('ver');
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleOpenEditar = (item) => {
    setModoModal('editar');
    setSelectedItem(item);

    setFormData({
      ...item,
      precioNumerico:
        item.precioNumerico !== undefined
          ? item.precioNumerico
          : obtenerNumeroPrecio(item.precio),
      moneda: item.moneda || item.subPrecio || 'USD',
      subPrecio: item.moneda || item.subPrecio || 'USD'
    });

    setModalOpen(true);
  };

  const handleEliminar = (id) => {
    if (window.confirm('¿Está seguro de eliminar este servicio?')) {
      setServicios((prev) =>
        prev.filter((servicio) => servicio.id !== id)
      );

      setPaginaActual((pagina) => {
        const cantidadRestante = servicios.length - 1;

        const paginasNecesarias = Math.max(
          1,
          Math.ceil(
            cantidadRestante / SERVICIOS_POR_PAGINA
          )
        );

        return Math.min(pagina, paginasNecesarias);
      });
    }
  };

  // CAMBIO DE ESTADO
  // Se utiliza únicamente EstadoToggle y ESTADOS.servicio.
  const handleToggleEstado = (id) => {
    setServicios((prev) =>
      prev.map((servicio) =>
        servicio.id === id
          ? {
              ...servicio,
              estado: estadoSiguiente(
                ESTADOS.servicio,
                servicio.estado
              )
            }
          : servicio
      )
    );
  };

  const handleChangeMoneda = (moneda) => {
    setFormData((prev) => ({
      ...prev,
      moneda,
      subPrecio: moneda
    }));
  };

  const handleChangePrecio = (valor) => {
    const numero = obtenerNumeroPrecio(valor);

    setFormData((prev) => ({
      ...prev,
      precio: valor,
      precioNumerico: numero
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      window.alert('Ingrese el nombre del servicio.');
      return;
    }

    if (!formData.desc.trim()) {
      window.alert('Ingrese la descripción del servicio.');
      return;
    }

    if (!formData.precio) {
      window.alert('Ingrese el precio del servicio.');
      return;
    }

    const precioNumerico = obtenerNumeroPrecio(
      formData.precio
    );

    if (precioNumerico <= 0) {
      window.alert('El precio debe ser mayor a cero.');
      return;
    }

    const servicioFinal = {
      ...formData,
      precioNumerico,
      precio: formatearPrecio(
        precioNumerico,
        formData.moneda
      ),
      subPrecio: formData.moneda
    };

    if (modoModal === 'crear') {
      const nuevoServicio = {
        ...servicioFinal,
        id: Date.now(),
        codigo: generarCodigo()
      };

      setServicios((prev) => [
        nuevoServicio,
        ...prev
      ]);

      setPaginaActual(1);
    }

    if (modoModal === 'editar') {
      setServicios((prev) =>
        prev.map((servicio) =>
          servicio.id === selectedItem.id
            ? {
                ...servicioFinal,
                id: selectedItem.id,
                codigo: selectedItem.codigo
              }
            : servicio
        )
      );
    }

    setModalOpen(false);
    setSelectedItem(null);
  };

  const serviciosFiltrados = servicios.filter((item) => {
    const matchTab =
      tab === 'Todos' || item.categoria === tab;

    const textoBusqueda = busqueda.toLowerCase();

    const matchSearch =
      item.nombre.toLowerCase().includes(textoBusqueda) ||
      item.codigo.toLowerCase().includes(textoBusqueda) ||
      item.desc.toLowerCase().includes(textoBusqueda) ||
      item.categoria.toLowerCase().includes(textoBusqueda) ||
      item.unidad.toLowerCase().includes(textoBusqueda) ||
      item.moneda.toLowerCase().includes(textoBusqueda);

    return matchTab && matchSearch;
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      serviciosFiltrados.length /
        SERVICIOS_POR_PAGINA
    )
  );

  const serviciosPagina = serviciosFiltrados.slice(
    (paginaActual - 1) * SERVICIOS_POR_PAGINA,
    paginaActual * SERVICIOS_POR_PAGINA
  );

  const cambiarTab = (nuevaTab) => {
    setTab(nuevaTab);
    setPaginaActual(1);
  };

  const cambiarBusqueda = (valor) => {
    setBusqueda(valor);
    setPaginaActual(1);
  };

  const irPaginaAnterior = () => {
    setPaginaActual((pagina) =>
      Math.max(1, pagina - 1)
    );
  };

  const irPaginaSiguiente = () => {
    setPaginaActual((pagina) =>
      Math.min(totalPaginas, pagina + 1)
    );
  };

  const irPagina = (pagina) => {
    setPaginaActual(pagina);
  };

  const serviciosActivos = servicios.filter(
    (servicio) => servicio.estado === 'Activo'
  ).length;

  const instalaciones = servicios.filter(
    (servicio) => servicio.categoria === 'Instalación'
  ).length;

  const mantenimientos = servicios.filter(
    (servicio) => servicio.categoria === 'Mantenimiento'
  ).length;

  const protocolos = servicios.filter(
    (servicio) => servicio.categoria === 'Protocolos'
  ).length;

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: theme.bg,
        fontFamily:
          'system-ui, -apple-system, sans-serif',
        transition: 'all 0.2s ease'
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <header
          style={{
            backgroundColor: theme.headerBg,
            height: '50px',
            borderBottom: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px'
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '280px'
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: '10px',
                top: '7px'
              }}
            >
              <SearchIcon color={theme.textSub} />
            </span>

            <input
              type="text"
              placeholder="Buscar servicios eléctricos..."
              value={busqueda}
              onChange={(e) =>
                cambiarBusqueda(e.target.value)
              }
              style={{
                width: '100%',
                padding: '5px 10px 5px 30px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: theme.inputBg,
                color: theme.textMain,
                fontSize: '11px',
                outline: 'none'
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <button
              onClick={toggleTheme}
              style={{
                backgroundColor: '#1e293b',
                color: '#ffffff',
                border: `1px solid ${
                  darkMode ? '#334155' : '#1e293b'
                }`,
                padding: '5px 14px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow:
                  '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <SunIcon />
              <span>
                {darkMode
                  ? 'Modo Oscuro'
                  : 'Modo Claro'}
              </span>
            </button>

            <BellIcon color={theme.iconColor} />
            <HelpIcon color={theme.iconColor} />

            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80"
              alt="Avatar"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          </div>
        </header>

        <div
          style={{
            padding: '20px',
            flex: 1
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: '18px',
                  color: theme.textMain,
                  fontWeight: 'bold'
                }}
              >
                Servicios Eléctricos
              </h1>

              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '11px',
                  color: theme.textSub
                }}
              >
                Gestione las partidas, instalaciones y
                mantenimientos eléctricos.
              </p>
            </div>

            <button
              onClick={handleOpenCrear}
              style={{
                backgroundColor: '#facc15',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '11px',
                color: '#0f172a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <PlusIcon />
              Agregar Servicio
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginBottom: '16px'
            }}
          >
            <div
              style={{
                ...styles.card,
                backgroundColor: theme.cardBg,
                borderColor: theme.border
              }}
            >
              <span
                style={{
                  ...styles.cardTag,
                  color: theme.textSub
                }}
              >
                SERVICIOS ACTIVOS
              </span>

              <div
                style={{
                  ...styles.cardNum,
                  color: theme.textMain
                }}
              >
                {serviciosActivos}
              </div>

              <span
                style={{
                  fontSize: '10px',
                  color: '#854d0e',
                  fontWeight: 'bold'
                }}
              >
                ⚡ Actualizado en vivo
              </span>
            </div>

            <div
              style={{
                ...styles.card,
                backgroundColor: theme.cardBg,
                borderColor: theme.border
              }}
            >
              <span
                style={{
                  ...styles.cardTag,
                  color: theme.textSub
                }}
              >
                INSTALACIONES
              </span>

              <div
                style={{
                  ...styles.cardNum,
                  color: theme.textMain,
                  fontSize: '16px'
                }}
              >
                {instalaciones}
              </div>

              <span
                style={{
                  fontSize: '10px',
                  color: theme.textSub
                }}
              >
                Servicios disponibles
              </span>
            </div>

            <div
              style={{
                ...styles.card,
                backgroundColor: theme.cardBg,
                borderColor: theme.border
              }}
            >
              <span
                style={{
                  ...styles.cardTag,
                  color: theme.textSub
                }}
              >
                MANTENIMIENTOS
              </span>

              <div
                style={{
                  ...styles.cardNum,
                  color: theme.textMain,
                  fontSize: '16px'
                }}
              >
                {mantenimientos}
              </div>

              <span
                style={{
                  fontSize: '10px',
                  color: theme.textSub
                }}
              >
                Preventivos y correctivos
              </span>
            </div>

            <div
              style={{
                ...styles.card,
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                position: 'relative'
              }}
            >
              <span
                style={{
                  ...styles.cardTag,
                  color: theme.textSub
                }}
              >
                CERTIFICACIONES
              </span>

              <div
                style={{
                  ...styles.cardNum,
                  color: theme.textMain
                }}
              >
                {protocolos}
              </div>

              <div
                style={{
                  height: '3px',
                  backgroundColor: theme.border,
                  marginTop: '10px',
                  borderRadius: '2px'
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#facc15'
                  }}
                />
              </div>

              <div
                style={{
                  position: 'absolute',
                  right: '4px',
                  bottom: '0px',
                  opacity: 0.3
                }}
              >
                <ShieldWatermark
                  color={theme.textSub}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              padding: '12px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '4px'
                }}
              >
                {[
                  'Todos',
                  'Instalación',
                  'Mantenimiento',
                  'Protocolos'
                ].map((t) => (
                  <button
                    key={t}
                    onClick={() => cambiarTab(t)}
                    style={{
                      border: 'none',
                      backgroundColor:
                        tab === t
                          ? darkMode
                            ? '#3b82f6'
                            : '#1e293b'
                          : 'transparent',
                      color:
                        tab === t
                          ? '#ffffff'
                          : theme.textSub,
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                overflowX: 'auto'
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '11px'
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: `1px solid ${theme.border}`,
                      color: theme.textSub,
                      textAlign: 'left',
                      fontSize: '9px',
                      textTransform: 'uppercase'
                    }}
                  >
                    <th style={{ padding: '8px' }}>
                      CÓDIGO
                    </th>
                    <th style={{ padding: '8px' }}>
                      NOMBRE DEL SERVICIO
                    </th>
                    <th style={{ padding: '8px' }}>
                      UNIDAD DE MEDIDA
                    </th>
                    <th style={{ padding: '8px' }}>
                      PRECIO BASE
                    </th>
                    <th style={{ padding: '8px' }}>
                      TIEMPO ESTIMADO
                    </th>
                    <th style={{ padding: '8px' }}>
                      ESTADO
                    </th>
                    <th
                      style={{
                        padding: '8px',
                        textAlign: 'right'
                      }}
                    >
                      ACCIONES
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {serviciosPagina.length > 0 ? (
                    serviciosPagina.map((row) => (
                      <tr
                        key={row.id}
                        style={{
                          borderBottom: `1px solid ${theme.tableBorder}`
                        }}
                      >
                        <td
                          style={{
                            padding: '10px 8px'
                          }}
                        >
                          <span
                            style={{
                              backgroundColor: darkMode
                                ? '#1e3a8a'
                                : '#dbeafe',
                              color: darkMode
                                ? '#93c5fd'
                                : '#1e40af',
                              fontWeight: 'bold',
                              padding: '3px 6px',
                              borderRadius: '3px',
                              fontSize: '9px'
                            }}
                          >
                            {row.codigo}
                          </span>
                        </td>

                        <td
                          style={{
                            padding: '10px 8px'
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 'bold',
                              color: theme.textMain
                            }}
                          >
                            {row.nombre}
                          </div>

                          <div
                            style={{
                              fontSize: '9px',
                              color: theme.textSub,
                              maxWidth: '300px'
                            }}
                          >
                            {row.desc}
                          </div>
                        </td>

                        <td
                          style={{
                            padding: '10px 8px'
                          }}
                        >
                          <span
                            style={{
                              backgroundColor: theme.inputBg,
                              border: `1px solid ${theme.border}`,
                              color: theme.textSub,
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '9px'
                            }}
                          >
                            {row.unidad}
                          </span>
                        </td>

                        <td
                          style={{
                            padding: '10px 8px'
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 'bold',
                              color: theme.textMain
                            }}
                          >
                            {row.precio}
                          </div>

                          <div
                            style={{
                              fontSize: '8px',
                              color: theme.textSub
                            }}
                          >
                            {row.moneda}
                          </div>
                        </td>

                        <td
                          style={{
                            padding: '10px 8px',
                            color: theme.textMain
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <ClockIcon
                              color={theme.textSub}
                            />
                            {row.tiempo}
                          </div>
                        </td>

                        {/* ESTADO */}
                        <td
                          style={{
                            padding: '10px 8px'
                          }}
                        >
                          <EstadoToggle
                            estado={row.estado}
                            estados={ESTADOS.servicio}
                            onClick={() =>
                              handleToggleEstado(row.id)
                            }
                          />
                        </td>

                        <td
                          style={{
                            padding: '10px 8px',
                            textAlign: 'right'
                          }}
                        >
                          <AccionesFila
                            onVer={() =>
                              handleOpenVer(row)
                            }
                            onEditar={() =>
                              handleOpenEditar(row)
                            }
                            onEliminar={() =>
                              handleEliminar(row.id)
                            }
                            color={theme.iconColor}
                            alineacion="flex-end"
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        style={{
                          textAlign: 'center',
                          padding: '20px',
                          color: theme.textSub
                        }}
                      >
                        No se encontraron servicios que
                        coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '10px',
                paddingTop: '8px',
                fontSize: '10px',
                color: theme.textSub
              }}
            >
              <span>
                Mostrando{' '}
                {serviciosFiltrados.length === 0
                  ? 0
                  : (paginaActual - 1) *
                      SERVICIOS_POR_PAGINA +
                    1}{' '}
                -
                {Math.min(
                  paginaActual * SERVICIOS_POR_PAGINA,
                  serviciosFiltrados.length
                )}{' '}
                de {serviciosFiltrados.length} servicios
              </span>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <button
                  onClick={irPaginaAnterior}
                  disabled={paginaActual === 1}
                  style={{
                    ...styles.pBtn,
                    backgroundColor: theme.cardBg,
                    borderColor: theme.border,
                    color:
                      paginaActual === 1
                        ? '#cbd5e1'
                        : theme.textSub,
                    cursor:
                      paginaActual === 1
                        ? 'default'
                        : 'pointer'
                  }}
                >
                  &lt;
                </button>

                {Array.from(
                  { length: totalPaginas },
                  (_, index) => index + 1
                ).map((pagina) => (
                  <button
                    key={pagina}
                    onClick={() => irPagina(pagina)}
                    style={{
                      ...styles.pBtn,
                      backgroundColor:
                        paginaActual === pagina
                          ? '#facc15'
                          : theme.cardBg,
                      color:
                        paginaActual === pagina
                          ? '#0f172a'
                          : theme.textSub,
                      fontWeight:
                        paginaActual === pagina
                          ? 'bold'
                          : 'normal',
                      border:
                        paginaActual === pagina
                          ? 'none'
                          : `1px solid ${theme.border}`
                    }}
                  >
                    {pagina}
                  </button>
                ))}

                <button
                  onClick={irPaginaSiguiente}
                  disabled={
                    paginaActual === totalPaginas
                  }
                  style={{
                    ...styles.pBtn,
                    backgroundColor: theme.cardBg,
                    borderColor: theme.border,
                    color:
                      paginaActual === totalPaginas
                        ? '#cbd5e1'
                        : theme.textSub,
                    cursor:
                      paginaActual === totalPaginas
                        ? 'default'
                        : 'pointer'
                  }}
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModalOpen(false);
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor:
              'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.border}`,
              width: '440px',
              maxWidth: '95vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '8px',
              padding: '20px',
              boxShadow:
                '0 10px 25px -5px rgba(0,0,0,0.3)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: theme.textMain
                }}
              >
                {modoModal === 'crear' &&
                  'Agregar Nuevo Servicio'}

                {modoModal === 'editar' &&
                  'Editar Servicio Eléctrico'}

                {modoModal === 'ver' &&
                  'Detalles del Servicio'}
              </h3>

              <button
                onClick={() => setModalOpen(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: theme.textSub,
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            {modoModal === 'ver' ? (
              <div
                style={{
                  fontSize: '12px',
                  color: theme.textMain,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={styles.detailBox(theme)}>
                  <span
                    style={styles.detailLabel(theme)}
                  >
                    CÓDIGO
                  </span>
                  <strong>
                    {selectedItem?.codigo}
                  </strong>
                </div>

                <div style={styles.detailBox(theme)}>
                  <span
                    style={styles.detailLabel(theme)}
                  >
                    NOMBRE DEL SERVICIO
                  </span>
                  <strong>
                    {selectedItem?.nombre}
                  </strong>
                </div>

                <div style={styles.detailBox(theme)}>
                  <span
                    style={styles.detailLabel(theme)}
                  >
                    DESCRIPCIÓN
                  </span>
                  <span>
                    {selectedItem?.desc}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px'
                  }}
                >
                  <div style={styles.detailBox(theme)}>
                    <span
                      style={styles.detailLabel(theme)}
                    >
                      CATEGORÍA
                    </span>
                    <span>
                      {selectedItem?.categoria}
                    </span>
                  </div>

                  <div style={styles.detailBox(theme)}>
                    <span
                      style={styles.detailLabel(theme)}
                    >
                      UNIDAD
                    </span>
                    <span>
                      {selectedItem?.unidad}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px'
                  }}
                >
                  <div style={styles.detailBox(theme)}>
                    <span
                      style={styles.detailLabel(theme)}
                    >
                      PRECIO
                    </span>

                    <strong>
                      {selectedItem?.precio}
                    </strong>

                    <span
                      style={{
                        fontSize: '9px',
                        color: theme.textSub
                      }}
                    >
                      {selectedItem?.moneda}
                    </span>
                  </div>

                  <div style={styles.detailBox(theme)}>
                    <span
                      style={styles.detailLabel(theme)}
                    >
                      TIEMPO ESTIMADO
                    </span>

                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <ClockIcon
                        color={theme.textSub}
                      />
                      {selectedItem?.tiempo}
                    </span>
                  </div>
                </div>

                <div style={styles.detailBox(theme)}>
                  <span
                    style={styles.detailLabel(theme)}
                  >
                    ESTADO
                  </span>

                  <EstadoToggle
                    estado={
                      (
                        servicios.find(
                          (servicio) =>
                            servicio.id ===
                            selectedItem?.id
                        ) || selectedItem
                      )?.estado
                    }
                    estados={ESTADOS.servicio}
                    onClick={() =>
                      handleToggleEstado(
                        selectedItem.id
                      )
                    }
                  />
                </div>

                <div
                  style={{
                    backgroundColor: darkMode
                      ? '#172033'
                      : '#fffbeb',
                    border: `1px solid ${
                      darkMode
                        ? '#334155'
                        : '#fde68a'
                    }`,
                    borderRadius: '6px',
                    padding: '10px',
                    fontSize: '10px',
                    color: darkMode
                      ? '#cbd5e1'
                      : '#713f12'
                  }}
                >
                  Este servicio puede utilizarse
                  como servicio base al momento de
                  crear una cotización.
                </div>

                <button
                  onClick={() => setModalOpen(false)}
                  style={{
                    ...styles.btnPrimary,
                    marginTop: '6px'
                  }}
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSave}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  fontSize: '11px'
                }}
              >
                <div>
                  <label style={styles.label(theme)}>
                    Código generado automáticamente
                  </label>

                  <input
                    type="text"
                    value={formData.codigo}
                    readOnly
                    style={{
                      ...styles.input,
                      backgroundColor: darkMode
                        ? '#172033'
                        : '#e2e8f0',
                      borderColor: theme.border,
                      color: theme.textSub,
                      cursor: 'not-allowed',
                      fontWeight: 'bold'
                    }}
                  />
                </div>

                <div>
                  <label style={styles.label(theme)}>
                    Nombre del servicio
                  </label>

                  <input
                    type="text"
                    placeholder="Ej: Instalación de tablero eléctrico"
                    required
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nombre: e.target.value
                      })
                    }
                    style={{
                      ...styles.input,
                      backgroundColor:
                        theme.inputBg,
                      borderColor: theme.border,
                      color: theme.textMain
                    }}
                  />
                </div>

                <div>
                  <label style={styles.label(theme)}>
                    Descripción
                  </label>

                  <textarea
                    placeholder="Descripción completa del servicio..."
                    required
                    value={formData.desc}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        desc: e.target.value
                      })
                    }
                    rows="3"
                    style={{
                      ...styles.textarea,
                      backgroundColor:
                        theme.inputBg,
                      borderColor: theme.border,
                      color: theme.textMain
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px'
                  }}
                >
                  <div>
                    <label style={styles.label(theme)}>
                      Categoría
                    </label>

                    <select
                      value={formData.categoria}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          categoria: e.target.value
                        })
                      }
                      style={{
                        ...styles.input,
                        backgroundColor:
                          theme.inputBg,
                        borderColor: theme.border,
                        color: theme.textMain
                      }}
                    >
                      <option value="Instalación">
                        Instalación
                      </option>
                      <option value="Mantenimiento">
                        Mantenimiento
                      </option>
                      <option value="Protocolos">
                        Protocolos
                      </option>
                    </select>
                  </div>

                  <div>
                    <label style={styles.label(theme)}>
                      Unidad de medida
                    </label>

                    <select
                      value={formData.unidad}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          unidad: e.target.value
                        })
                      }
                      style={{
                        ...styles.input,
                        backgroundColor:
                          theme.inputBg,
                        borderColor: theme.border,
                        color: theme.textMain
                      }}
                    >
                      <option value="Proyecto">
                        Proyecto
                      </option>
                      <option value="Servicio">
                        Servicio
                      </option>
                      <option value="Hora">
                        Hora
                      </option>
                      <option value="Punto">
                        Punto
                      </option>
                      <option value="Unidad">
                        Unidad
                      </option>
                      <option value="Metro">
                        Metro
                      </option>
                      <option value="Día">
                        Día
                      </option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px'
                  }}
                >
                  <div>
                    <label style={styles.label(theme)}>
                      Moneda
                    </label>

                    <select
                      value={formData.moneda}
                      onChange={(e) =>
                        handleChangeMoneda(
                          e.target.value
                        )
                      }
                      style={{
                        ...styles.input,
                        backgroundColor:
                          theme.inputBg,
                        borderColor: theme.border,
                        color: theme.textMain
                      }}
                    >
                      <option value="USD">
                        USD
                      </option>
                      <option value="USD / H">
                        USD / H
                      </option>
                      <option value="COP">
                        COP
                      </option>
                      <option value="COP / H">
                        COP / H
                      </option>
                    </select>
                  </div>

                  <div>
                    <label style={styles.label(theme)}>
                      Precio
                    </label>

                    <input
                      type="number"
                      min="0"
                      step={
                        formData.moneda === 'COP' ||
                        formData.moneda === 'COP / H'
                          ? '1'
                          : '0.01'
                      }
                      placeholder={
                        formData.moneda.includes('COP')
                          ? 'Ej: 850000'
                          : 'Ej: 850.00'
                      }
                      required
                      value={formData.precio}
                      onChange={(e) =>
                        handleChangePrecio(
                          e.target.value
                        )
                      }
                      style={{
                        ...styles.input,
                        backgroundColor:
                          theme.inputBg,
                        borderColor: theme.border,
                        color: theme.textMain
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: darkMode
                      ? '#172033'
                      : '#fffbeb',
                    border: `1px solid ${
                      darkMode
                        ? '#334155'
                        : '#fde68a'
                    }`,
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '10px',
                    color: darkMode
                      ? '#cbd5e1'
                      : '#713f12'
                  }}
                >
                  Precio registrado:{' '}
                  <strong>
                    {formData.precioNumerico > 0
                      ? formatearPrecio(
                          formData.precioNumerico,
                          formData.moneda
                        )
                      : '$0'}
                  </strong>{' '}
                  {formData.moneda}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px'
                  }}
                >
                  <div>
                    <label style={styles.label(theme)}>
                      Tiempo estimado
                    </label>

                    <input
                      type="text"
                      placeholder="Ej: 2 Días"
                      value={formData.tiempo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tiempo: e.target.value
                        })
                      }
                      style={{
                        ...styles.input,
                        backgroundColor:
                          theme.inputBg,
                        borderColor: theme.border,
                        color: theme.textMain
                      }}
                    />
                  </div>

                  <div>
                    <label style={styles.label(theme)}>
                      Estado
                    </label>

                    <select
                      value={formData.estado}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estado: e.target.value
                        })
                      }
                      style={{
                        ...styles.input,
                        backgroundColor:
                          theme.inputBg,
                        borderColor: theme.border,
                        color: theme.textMain
                      }}
                    >
                      <option value="Activo">
                        Activo
                      </option>
                      <option value="Pausado">
                        Pausado
                      </option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    marginTop: '8px'
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setModalOpen(false)
                    }
                    style={styles.btnSecondary}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    style={styles.btnPrimary}
                  >
                    {modoModal === 'crear'
                      ? 'Crear Servicio'
                      : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid'
  },

  cardTag: {
    fontSize: '8px',
    fontWeight: 'bold',
    letterSpacing: '0.3px'
  },

  cardNum: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '2px 0'
  },

  btnIcon: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center'
  },

  pBtn: {
    minWidth: '20px',
    height: '20px',
    border: '1px solid',
    borderRadius: '3px',
    fontSize: '9px',
    cursor: 'pointer',
    padding: '0 5px'
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '7px 10px',
    borderRadius: '4px',
    border: '1px solid',
    fontSize: '11px',
    outline: 'none'
  },

  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '7px 10px',
    borderRadius: '4px',
    border: '1px solid',
    fontSize: '11px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit'
  },

  label: (theme) => ({
    display: 'block',
    marginBottom: '4px',
    color: theme.textSub,
    fontSize: '9px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  }),

  detailBox: (theme) => ({
    backgroundColor: theme.inputBg,
    border: `1px solid ${theme.border}`,
    borderRadius: '5px',
    padding: '9px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  }),

  detailLabel: (theme) => ({
    fontSize: '8px',
    color: theme.textSub,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  }),

  btnPrimary: {
    backgroundColor: '#facc15',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '11px',
    color: '#0f172a',
    cursor: 'pointer'
  },

  btnSecondary: {
    backgroundColor: '#94a3b8',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#ffffff',
    cursor: 'pointer'
  }
};

export default CatalogoServicios;