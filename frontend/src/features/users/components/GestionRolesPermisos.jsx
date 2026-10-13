import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from '../../../shared/context/ThemeContext.jsx';

const SearchIcon = ({ color = '#94a3b8' }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EyeIcon = ({ color = '#475569' }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EditIcon = ({ color = '#475569' }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const ShieldIcon = ({ color = '#ca8a04' }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const UsersIcon = ({ color = '#ca8a04' }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const MonitorIcon = ({ color = '#64748b' }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <path d="M8 21h8M12 18v3" />
  </svg>
);

const MobileIcon = ({ color = '#64748b' }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="2" width="12" height="20" rx="2" />
    <path d="M10 18h4" />
  </svg>
);

const CheckIcon = ({ color = '#16a34a' }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = ({ color = '#94a3b8' }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.8 6.8 0 0 0 21 12.8Z" />
  </svg>
);

const ShieldWatermark = ({ color = '#e2e8f0' }) => (
  <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

/* ESTADO */
const EstadoToggle = ({ estado, onClick, darkMode }) => {
  const activo = estado === 'Activo';

  return (
    <button
      onClick={onClick}
      title={activo ? 'Cambiar a Inactivo' : 'Cambiar a Activo'}
      style={{
        width: '76px',
        height: '25px',
        borderRadius: '20px',
        border: 'none',
        padding: '3px',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: activo ? 'flex-start' : 'flex-end',
        backgroundColor: activo
          ? darkMode
            ? '#064e3b'
            : '#dcfce7'
          : darkMode
            ? '#3f1d1d'
            : '#fce7e7',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box'
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: activo ? '3px' : 'auto',
          right: activo ? 'auto' : '3px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          transition: 'all 0.2s ease'
        }}
      />

      <span
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          textAlign: activo ? 'right' : 'left',
          padding: activo ? '0 7px 0 0' : '0 0 0 7px',
          boxSizing: 'border-box',
          color: activo
            ? darkMode
              ? '#86efac'
              : '#166534'
            : darkMode
              ? '#fca5a5'
              : '#991b1b',
          fontSize: '8px',
          fontWeight: '700'
        }}
      >
        {estado}
      </span>
    </button>
  );
};

const INITIAL_ROLES = [
  {
    id: 'rol-admin',
    nombre: 'Administrador',
    codigo: 'ROL-ADMIN',
    descripcion: 'Control general de la plataforma y administración de la operación.',
    plataformas: ['Web', 'Móvil'],
    estado: 'Activo',
    usuarios: 2,
    permisos: {
      usuarios: ['Consultar', 'Crear', 'Editar', 'Eliminar', 'Cambiar estado'],
      clientes: ['Consultar', 'Crear', 'Editar', 'Eliminar', 'Cambiar estado'],
      cotizaciones: ['Consultar', 'Crear', 'Editar', 'Eliminar', 'Cambiar estado'],
      ordenes: ['Consultar', 'Crear', 'Editar', 'Eliminar', 'Cambiar estado'],
      inventario: ['Consultar', 'Crear', 'Editar', 'Eliminar', 'Cambiar estado'],
      abonos: ['Consultar', 'Crear', 'Editar', 'Eliminar', 'Cambiar estado'],
      agenda: ['Consultar', 'Crear', 'Editar', 'Eliminar', 'Cambiar estado'],
      reportes: ['Consultar', 'Crear', 'Editar', 'Eliminar', 'Cambiar estado']
    }
  },
  {
    id: 'rol-tecnico',
    nombre: 'Técnico en Campo',
    codigo: 'ROL-TECNICO',
    descripcion: 'Acceso operativo para ejecución y seguimiento de trabajos asignados.',
    plataformas: ['Móvil'],
    estado: 'Activo',
    usuarios: 4,
    permisos: {
      usuarios: ['Consultar'],
      clientes: ['Consultar'],
      cotizaciones: ['Consultar'],
      ordenes: ['Consultar', 'Editar', 'Cambiar estado'],
      inventario: ['Consultar'],
      abonos: [],
      agenda: ['Consultar'],
      reportes: []
    }
  }
];

const INITIAL_USUARIOS = [
  {
    id: 1,
    nombre: 'Administrador General',
    correo: 'admin@electricosmca.com',
    rol: 'Administrador',
    plataforma: 'Web + Móvil',
    estado: 'Activo',
    ultimoAcceso: 'Hoy, 10:42 AM'
  },
  {
    id: 2,
    nombre: 'Angela Pareja',
    correo: 'admonmca16@gmail.com',
    rol: 'Administrador',
    plataforma: 'Web + Móvil',
    estado: 'Activo',
    ultimoAcceso: 'Hoy, 08:15 AM'
  },
  {
    id: 3,
    nombre: 'Carlos Mendoza',
    correo: 'carlos@electricosmca.com',
    rol: 'Técnico en Campo',
    plataforma: 'Móvil',
    estado: 'Activo',
    ultimoAcceso: 'Hoy, 09:31 AM'
  },
  {
    id: 4,
    nombre: 'Juan Pérez',
    correo: 'juan@electricosmca.com',
    rol: 'Técnico en Campo',
    plataforma: 'Móvil',
    estado: 'Activo',
    ultimoAcceso: 'Ayer, 05:42 PM'
  },
  {
    id: 5,
    nombre: 'Roberto Gómez',
    correo: 'roberto@electricosmca.com',
    rol: 'Técnico en Campo',
    plataforma: 'Móvil',
    estado: 'Activo',
    ultimoAcceso: 'Ayer, 03:18 PM'
  },
  {
    id: 6,
    nombre: 'Miguel Torres',
    correo: 'miguel@electricosmca.com',
    rol: 'Técnico en Campo',
    plataforma: 'Móvil',
    estado: 'Inactivo',
    ultimoAcceso: '20 Sep, 2026'
  }
];

const MODULOS = [
  { id: 'usuarios', nombre: 'Usuarios' },
  { id: 'clientes', nombre: 'Clientes' },
  { id: 'cotizaciones', nombre: 'Cotizaciones' },
  { id: 'ordenes', nombre: 'Órdenes de trabajo' },
  { id: 'inventario', nombre: 'Inventario' },
  { id: 'abonos', nombre: 'Abonos y pagos' },
  { id: 'agenda', nombre: 'Agenda' },
  { id: 'reportes', nombre: 'Reportes e indicadores' }
];

const ACCIONES = [
  'Consultar',
  'Crear',
  'Editar',
  'Eliminar',
  'Cambiar estado'
];

const USUARIOS_POR_PAGINA = 5;

export function GestionRolesPermisos() {
  const { theme: temaGlobal, toggleTheme } = useContext(ThemeContext);

  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [usuarios, setUsuarios] = useState(INITIAL_USUARIOS);

  const [tab, setTab] = useState('Usuarios');
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [modoModal, setModoModal] = useState('crear');
  const [selectedItem, setSelectedItem] = useState(null);

  const [rolSeleccionado, setRolSeleccionado] = useState('rol-admin');

  const [formUsuario, setFormUsuario] = useState({
    nombre: '',
    correo: '',
    rol: 'Técnico en Campo',
    estado: 'Activo'
  });

  const darkMode = temaGlobal === 'dark';

  const theme = {
    bg: darkMode ? '#0b0f19' : '#f8fafc',
    cardBg: darkMode ? '#151c2c' : '#ffffff',
    headerBg: darkMode ? '#111827' : '#ffffff',
    textMain: darkMode ? '#f8fafc' : '#0f172a',
    textSub: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#1e293b' : '#e2e8f0',
    inputBg: darkMode ? '#1e293b' : '#f8fafc',
    tableBorder: darkMode ? '#1e293b' : '#f1f5f9',
    iconColor: darkMode ? '#cbd5e1' : '#475569',
    gold: '#ca8a04',
    goldStrong: '#facc15',
    goldBg: darkMode ? '#3a2d08' : '#fef9c3'
  };

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return usuarios.filter(usuario => {
      if (!texto) return true;

      return (
        usuario.nombre.toLowerCase().includes(texto) ||
        usuario.correo.toLowerCase().includes(texto) ||
        usuario.rol.toLowerCase().includes(texto) ||
        usuario.plataforma.toLowerCase().includes(texto)
      );
    });
  }, [usuarios, busqueda]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / USUARIOS_POR_PAGINA)
  );

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  const usuariosPagina = usuariosFiltrados.slice(
    (paginaActual - 1) * USUARIOS_POR_PAGINA,
    paginaActual * USUARIOS_POR_PAGINA
  );

  const administradores = usuarios.filter(
    usuario => usuario.rol === 'Administrador'
  ).length;

  const tecnicos = usuarios.filter(
    usuario => usuario.rol === 'Técnico en Campo'
  ).length;

  const usuariosActivos = usuarios.filter(
    usuario => usuario.estado === 'Activo'
  ).length;

  const permisosAdmin = roles.find(
    rol => rol.id === 'rol-admin'
  );

  const permisosTecnico = roles.find(
    rol => rol.id === 'rol-tecnico'
  );

  const permisosActivos = Object.values(
    permisosAdmin?.permisos || {}
  ).reduce((total, acciones) => total + acciones.length, 0);

  const handleOpenCrearUsuario = () => {
    setModoModal('crear');
    setSelectedItem(null);

    setFormUsuario({
      nombre: '',
      correo: '',
      rol: 'Técnico en Campo',
      estado: 'Activo'
    });

    setModalOpen(true);
  };

  const handleOpenVerUsuario = usuario => {
    setModoModal('ver');
    setSelectedItem(usuario);
    setModalOpen(true);
  };

  const handleOpenEditarUsuario = usuario => {
    setModoModal('editar');
    setSelectedItem(usuario);

    setFormUsuario({
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      estado: usuario.estado
    });

    setModalOpen(true);
  };

  const handleEliminarUsuario = id => {
    const usuario = usuarios.find(item => item.id === id);

    if (!usuario) return;

    if (usuario.rol === 'Administrador') {
      const totalAdmins = usuarios.filter(
        item => item.rol === 'Administrador'
      ).length;

      if (totalAdmins <= 1) {
        alert('No se puede eliminar el último administrador del sistema.');
        return;
      }
    }

    if (
      window.confirm(
        `¿Está seguro de eliminar a ${usuario.nombre}?`
      )
    ) {
      setUsuarios(prev =>
        prev.filter(item => item.id !== id)
      );
    }
  };

  const handleToggleEstado = id => {
    setUsuarios(prev =>
      prev.map(usuario =>
        usuario.id === id
          ? {
              ...usuario,
              estado:
                usuario.estado === 'Activo'
                  ? 'Inactivo'
                  : 'Activo'
            }
          : usuario
      )
    );
  };

  const handleGuardarUsuario = e => {
    e.preventDefault();

    if (!formUsuario.nombre.trim()) {
      alert('Ingrese el nombre del usuario.');
      return;
    }

    if (!formUsuario.correo.trim()) {
      alert('Ingrese el correo electrónico.');
      return;
    }

    if (modoModal === 'crear') {
      const nuevoUsuario = {
        id: Date.now(),
        nombre: formUsuario.nombre.trim(),
        correo: formUsuario.correo.trim(),
        rol: formUsuario.rol,
        plataforma:
          formUsuario.rol === 'Administrador'
            ? 'Web + Móvil'
            : 'Móvil',
        estado: formUsuario.estado,
        ultimoAcceso: 'Nunca'
      };

      setUsuarios(prev => [nuevoUsuario, ...prev]);
      setPaginaActual(1);
    }

    if (modoModal === 'editar' && selectedItem) {
      setUsuarios(prev =>
        prev.map(usuario =>
          usuario.id === selectedItem.id
            ? {
                ...usuario,
                nombre: formUsuario.nombre.trim(),
                correo: formUsuario.correo.trim(),
                rol: formUsuario.rol,
                plataforma:
                  formUsuario.rol === 'Administrador'
                    ? 'Web + Móvil'
                    : 'Móvil',
                estado: formUsuario.estado
              }
            : usuario
        )
      );
    }

    setModalOpen(false);
  };

  const handleCambiarPermiso = (
    rolId,
    moduloId,
    accion,
    activo
  ) => {
    setRoles(prev =>
      prev.map(rol => {
        if (rol.id !== rolId) return rol;

        const permisosActuales = {
          ...rol.permisos
        };

        const accionesActuales = [
          ...(permisosActuales[moduloId] || [])
        ];

        if (activo) {
          if (!accionesActuales.includes(accion)) {
            accionesActuales.push(accion);
          }
        } else {
          const index = accionesActuales.indexOf(accion);

          if (index !== -1) {
            accionesActuales.splice(index, 1);
          }
        }

        permisosActuales[moduloId] = accionesActuales;

        return {
          ...rol,
          permisos: permisosActuales
        };
      })
    );
  };

  const handleToggleRol = rolId => {
    setRoles(prev =>
      prev.map(rol =>
        rol.id === rolId
          ? {
              ...rol,
              estado:
                rol.estado === 'Activo'
                  ? 'Inactivo'
                  : 'Activo'
            }
          : rol
      )
    );
  };

  const rolActual = roles.find(
    rol => rol.id === rolSeleccionado
  );

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: theme.bg,
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
              placeholder={
                tab === 'Usuarios'
                  ? 'Buscar usuario, correo o rol...'
                  : 'Buscar permisos...'
              }
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{
                width: '100%',
                padding: '5px 10px 5px 30px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: theme.inputBg,
                color: theme.textMain,
                fontSize: '11px',
                outline: 'none',
                boxSizing: 'border-box'
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
                backgroundColor: darkMode
                  ? '#1e293b'
                  : '#0f172a',
                color: '#ffffff',
                border: 'none',
                padding: '5px 14px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
              <span>
                {darkMode
                  ? 'Modo Claro'
                  : 'Modo Oscuro'}
              </span>
            </button>

            <span
              style={{
                backgroundColor: theme.goldStrong,
                color: '#0f172a',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold'
              }}
            >
            </span>
          </div>
        </header>

        <main
          style={{
            padding: '20px',
            flex: 1,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: '25px',
              top: '75px',
              opacity: 0.45,
              pointerEvents: 'none'
            }}
          >
            <ShieldWatermark color={theme.textSub} />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px',
              position: 'relative',
              zIndex: 1
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
                Roles y Permisos
              </h1>

              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: '11px',
                  color: theme.textSub
                }}
              >
                Controle los accesos, roles y permisos de los usuarios de Eléctricos MCA.
              </p>
            </div>

            {tab === 'Usuarios' && (
              <button
                onClick={handleOpenCrearUsuario}
                style={{
                  backgroundColor: theme.goldStrong,
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
                Nuevo Usuario
              </button>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(4, 1fr)',
              gap: '12px',
              marginBottom: '16px',
              position: 'relative',
              zIndex: 1
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
                USUARIOS REGISTRADOS
              </span>

              <div
                style={{
                  ...styles.cardNum,
                  color: theme.textMain
                }}
              >
                {usuarios.length}
              </div>

              <span
                style={{
                  fontSize: '10px',
                  color: theme.textSub
                }}
              >
                {usuariosActivos} usuarios activos
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
                ROLES ACTIVOS
              </span>

              <div
                style={{
                  ...styles.cardNum,
                  color: theme.textMain
                }}
              >
                {
                  roles.filter(
                    rol => rol.estado === 'Activo'
                  ).length
                }
              </div>

              <span
                style={{
                  fontSize: '10px',
                  color: theme.textSub
                }}
              >
                Administrador y Técnico
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
                ADMINISTRADORES
              </span>

              <div
                style={{
                  ...styles.cardNum,
                  color: theme.textMain
                }}
              >
                {administradores}
              </div>

              <span
                style={{
                  fontSize: '10px',
                  color: theme.textSub
                }}
              >
                Acceso Web + Móvil
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
                TÉCNICOS EN CAMPO
              </span>

              <div
                style={{
                  ...styles.cardNum,
                  color: theme.textMain
                }}
              >
                {tecnicos}
              </div>

              <span
                style={{
                  fontSize: '10px',
                  color: theme.textSub
                }}
              >
                Acceso exclusivo Móvil
              </span>

              <div
                style={{
                  position: 'absolute',
                  right: '8px',
                  bottom: '5px',
                  opacity: 0.25
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
              display: 'flex',
              gap: '4px',
              marginBottom: '12px',
              position: 'relative',
              zIndex: 1
            }}
          >
            {['Usuarios', 'Permisos'].map(nombre => (
              <button
                key={nombre}
                onClick={() => {
                  setTab(nombre);
                  setBusqueda('');
                }}
                style={{
                  border: 'none',
                  backgroundColor:
                    tab === nombre
                      ? darkMode
                        ? '#3a2d08'
                        : '#fef3c7'
                      : 'transparent',
                  color:
                    tab === nombre
                      ? theme.gold
                      : theme.textSub,
                  padding: '6px 13px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {nombre}
              </button>
            ))}
          </div>

          {tab === 'Usuarios' ? (
            <div
              style={{
                backgroundColor: theme.cardBg,
                borderRadius: '8px',
                border: `1px solid ${theme.border}`,
                padding: '12px',
                position: 'relative',
                zIndex: 1
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
                <div>
                  <div
                    style={{
                      color: theme.textMain,
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    Usuarios del sistema
                  </div>

                  <div
                    style={{
                      color: theme.textSub,
                      fontSize: '9px',
                      marginTop: '2px'
                    }}
                  >
                    Asigne y controle el rol de cada usuario.
                  </div>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '11px',
                    minWidth: '800px'
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
                      <th style={styles.th}>USUARIO</th>
                      <th style={styles.th}>ROL</th>
                      <th style={styles.th}>PLATAFORMA</th>
                      <th style={styles.th}>ESTADO</th>
                      <th style={styles.th}>ÚLTIMO ACCESO</th>
                      <th
                        style={{
                          ...styles.th,
                          textAlign: 'right'
                        }}
                      >
                        ACCIONES
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {usuariosPagina.length > 0 ? (
                      usuariosPagina.map(usuario => (
                        <tr
                          key={usuario.id}
                          style={{
                            borderBottom: `1px solid ${theme.tableBorder}`
                          }}
                        >
                          <td style={styles.td}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  backgroundColor:
                                    usuario.rol === 'Administrador'
                                      ? theme.goldBg
                                      : darkMode
                                        ? '#1e293b'
                                        : '#f1f5f9',
                                  color:
                                    usuario.rol === 'Administrador'
                                      ? theme.gold
                                      : theme.textSub,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
                                  fontWeight: 'bold'
                                }}
                              >
                                {usuario.nombre
                                  .split(' ')
                                  .slice(0, 2)
                                  .map(
                                    palabra =>
                                      palabra[0]
                                  )
                                  .join('')
                                  .toUpperCase()}
                              </div>

                              <div>
                                <div
                                  style={{
                                    fontWeight: 'bold',
                                    color: theme.textMain,
                                    fontSize: '10px'
                                  }}
                                >
                                  {usuario.nombre}
                                </div>

                                <div
                                  style={{
                                    color: theme.textSub,
                                    fontSize: '9px'
                                  }}
                                >
                                  {usuario.correo}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td style={styles.td}>
                            <span
                              style={{
                                backgroundColor:
                                  usuario.rol ===
                                  'Administrador'
                                    ? darkMode
                                      ? '#3a2d08'
                                      : '#fef3c7'
                                    : darkMode
                                      ? '#1e293b'
                                      : '#f1f5f9',
                                color:
                                  usuario.rol ===
                                  'Administrador'
                                    ? theme.gold
                                    : theme.textSub,
                                padding: '4px 8px',
                                borderRadius: '10px',
                                fontSize: '9px',
                                fontWeight: '700',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {usuario.rol}
                            </span>
                          </td>

                          <td style={styles.td}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                color: theme.textSub,
                                fontSize: '9px'
                              }}
                            >
                              {usuario.plataforma ===
                              'Móvil' ? (
                                <MobileIcon
                                  color={theme.gold}
                                />
                              ) : (
                                <MonitorIcon
                                  color={theme.gold}
                                />
                              )}

                              {usuario.plataforma}
                            </div>
                          </td>

                          <td style={styles.td}>
                            <EstadoToggle
                              estado={usuario.estado}
                              darkMode={darkMode}
                              onClick={() =>
                                handleToggleEstado(
                                  usuario.id
                                )
                              }
                            />
                          </td>

                          <td
                            style={{
                              ...styles.td,
                              color: theme.textSub,
                              fontSize: '9px'
                            }}
                          >
                            {usuario.ultimoAcceso}
                          </td>

                          <td
                            style={{
                              ...styles.td,
                              textAlign: 'right'
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '6px'
                              }}
                            >
                              <button
                                onClick={() =>
                                  handleOpenVerUsuario(
                                    usuario
                                  )
                                }
                                style={styles.btnIcon}
                                title="Ver usuario"
                              >
                                <EyeIcon
                                  color={theme.iconColor}
                                />
                              </button>

                              <button
                                onClick={() =>
                                  handleOpenEditarUsuario(
                                    usuario
                                  )
                                }
                                style={styles.btnIcon}
                                title="Editar usuario y rol"
                              >
                                <EditIcon
                                  color={theme.iconColor}
                                />
                              </button>

                              <button
                                onClick={() =>
                                  handleEliminarUsuario(
                                    usuario.id
                                  )
                                }
                                style={styles.btnIcon}
                                title="Eliminar usuario"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          style={{
                            textAlign: 'center',
                            padding: '25px',
                            color: theme.textSub
                          }}
                        >
                          No se encontraron usuarios.
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
                  Mostrando {usuariosPagina.length} de{' '}
                  {usuariosFiltrados.length} usuarios
                </span>

                <div
                  style={{
                    display: 'flex',
                    gap: '3px'
                  }}
                >
                  <button
                    disabled={paginaActual === 1}
                    onClick={() =>
                      setPaginaActual(prev =>
                        Math.max(1, prev - 1)
                      )
                    }
                    style={{
                      ...styles.pBtn,
                      backgroundColor: theme.cardBg,
                      borderColor: theme.border,
                      color:
                        paginaActual === 1
                          ? '#cbd5e1'
                          : theme.textMain,
                      cursor:
                        paginaActual === 1
                          ? 'not-allowed'
                          : 'pointer'
                    }}
                  >
                    &lt;
                  </button>

                  {Array.from(
                    { length: totalPaginas },
                    (_, index) => index + 1
                  ).map(numero => (
                    <button
                      key={numero}
                      onClick={() =>
                        setPaginaActual(numero)
                      }
                      style={{
                        ...styles.pBtn,
                        backgroundColor:
                          paginaActual === numero
                            ? theme.goldStrong
                            : theme.cardBg,
                        borderColor:
                          paginaActual === numero
                            ? theme.goldStrong
                            : theme.border,
                        color:
                          paginaActual === numero
                            ? '#0f172a'
                            : theme.textMain,
                        fontWeight:
                          paginaActual === numero
                            ? 'bold'
                            : 'normal'
                      }}
                    >
                      {numero}
                    </button>
                  ))}

                  <button
                    disabled={
                      paginaActual === totalPaginas
                    }
                    onClick={() =>
                      setPaginaActual(prev =>
                        Math.min(
                          totalPaginas,
                          prev + 1
                        )
                      )
                    }
                    style={{
                      ...styles.pBtn,
                      backgroundColor: theme.cardBg,
                      borderColor: theme.border,
                      color:
                        paginaActual === totalPaginas
                          ? '#cbd5e1'
                          : theme.textMain,
                      cursor:
                        paginaActual === totalPaginas
                          ? 'not-allowed'
                          : 'pointer'
                    }}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: theme.cardBg,
                borderRadius: '8px',
                border: `1px solid ${theme.border}`,
                padding: '12px',
                position: 'relative',
                zIndex: 1
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '230px 1fr',
                  gap: '14px'
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '9px',
                      color: theme.textSub,
                      fontWeight: '700',
                      marginBottom: '7px'
                    }}
                  >
                    ROLES DEL SISTEMA
                  </div>

                  {roles.map(rol => (
                    <button
                      key={rol.id}
                      onClick={() =>
                        setRolSeleccionado(rol.id)
                      }
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        border:
                          rolSeleccionado === rol.id
                            ? `1px solid ${theme.gold}`
                            : `1px solid ${theme.border}`,
                        backgroundColor:
                          rolSeleccionado === rol.id
                            ? theme.goldBg
                            : theme.cardBg,
                        color:
                          rolSeleccionado === rol.id
                            ? theme.gold
                            : theme.textMain,
                        borderRadius: '6px',
                        padding: '10px',
                        marginBottom: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px'
                        }}
                      >
                        <ShieldIcon
                          color={
                            rolSeleccionado === rol.id
                              ? theme.gold
                              : theme.textSub
                          }
                        />

                        <div>
                          <div
                            style={{
                              fontSize: '10px',
                              fontWeight: '700'
                            }}
                          >
                            {rol.nombre}
                          </div>

                          <div
                            style={{
                              fontSize: '8px',
                              color: theme.textSub,
                              marginTop: '2px'
                            }}
                          >
                            {rol.usuarios} usuarios
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {rolActual && (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        paddingBottom: '12px',
                        borderBottom: `1px solid ${theme.border}`,
                        marginBottom: '12px'
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px'
                          }}
                        >
                          <h2
                            style={{
                              margin: 0,
                              fontSize: '14px',
                              color: theme.textMain
                            }}
                          >
                            {rolActual.nombre}
                          </h2>

                          <span
                            style={{
                              backgroundColor:
                                rolActual.estado ===
                                'Activo'
                                  ? darkMode
                                    ? '#22c55e'
                                    : '#dcfce7'
                                  : darkMode
                                    ? '#334155'
                                    : '#f1f5f9',
                              color:
                                rolActual.estado ===
                                'Activo'
                                  ? darkMode
                                    ? '#6ee7b7'
                                    : '#22c55e'
                                  : theme.textSub,
                              padding: '3px 7px',
                              borderRadius: '8px',
                              fontSize: '8px',
                              fontWeight: '700'
                            }}
                          >
                            • {rolActual.estado}
                          </span>
                        </div>

                        <p
                          style={{
                            margin: '4px 0',
                            color: theme.textSub,
                            fontSize: '9px'
                          }}
                        >
                          {rolActual.descripcion}
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            gap: '5px',
                            marginTop: '7px'
                          }}
                        >
                          {rolActual.plataformas.map(
                            plataforma => (
                              <span
                                key={plataforma}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  backgroundColor:
                                    darkMode
                                      ? '#1e293b'
                                      : '#f1f5f9',
                                  color: theme.textSub,
                                  padding: '4px 7px',
                                  borderRadius: '9px',
                                  fontSize: '8px',
                                  fontWeight: '600'
                                }}
                              >
                                {plataforma ===
                                'Móvil' ? (
                                  <MobileIcon
                                    color={
                                      theme.textSub
                                    }
                                  />
                                ) : (
                                  <MonitorIcon
                                    color={
                                      theme.textSub
                                    }
                                  />
                                )}

                                {plataforma}
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleToggleRol(
                            rolActual.id
                          )
                        }
                        style={{
                          backgroundColor:
                            rolActual.estado === 'Activo'
                              ? darkMode
                                ? '##22c55e'
                                : '#dcfce7'
                              : darkMode
                                ? '#334155'
                                : '#f1f5f9',
                          color:
                            rolActual.estado === 'Activo'
                              ? darkMode
                                ? '#6ee7b7'
                                : '#22c55e'
                              : theme.textSub,
                          border: 'none',
                          borderRadius: '5px',
                          padding: '6px 9px',
                          fontSize: '9px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {rolActual.estado === 'Activo'
                          ? 'Desactivar rol'
                          : 'Activar rol'}
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: theme.textMain,
                            fontSize: '11px',
                            fontWeight: '700'
                          }}
                        >
                          Matriz de permisos
                        </div>

                        <div
                          style={{
                            color: theme.textSub,
                            fontSize: '8px',
                            marginTop: '2px'
                          }}
                        >
                          Configure las acciones permitidas para este rol.
                        </div>
                      </div>

                      <span
                        style={{
                          color: theme.gold,
                          fontSize: '9px',
                          fontWeight: '700'
                        }}
                      >
                        {
                          Object.values(
                            rolActual.permisos
                          ).reduce(
                            (total, acciones) =>
                              total + acciones.length,
                            0
                          )
                        }{' '}
                        permisos activos
                      </span>
                    </div>

                    <div
                      style={{
                        border: `1px solid ${theme.border}`,
                        borderRadius: '6px',
                        overflow: 'hidden'
                      }}
                    >
                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '10px'
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              backgroundColor:
                                darkMode
                                  ? '#111827'
                                  : '#f8fafc',
                              borderBottom: `1px solid ${theme.border}`
                            }}
                          >
                            <th
                              style={{
                                ...styles.permissionTh,
                                textAlign: 'left'
                              }}
                            >
                              MÓDULO
                            </th>

                            {ACCIONES.map(
                              accion => (
                                <th
                                  key={accion}
                                  style={
                                    styles.permissionTh
                                  }
                                >
                                  {accion.toUpperCase()}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>

                        <tbody>
                          {MODULOS.map(modulo => (
                            <tr
                              key={modulo.id}
                              style={{
                                borderBottom: `1px solid ${theme.tableBorder}`
                              }}
                            >
                              <td
                                style={{
                                  ...styles.permissionTd,
                                  color: theme.textMain,
                                  fontWeight: '600',
                                  textAlign: 'left'
                                }}
                              >
                                {modulo.nombre}
                              </td>

                              {ACCIONES.map(
                                accion => {
                                  const activo =
                                    rolActual.permisos[
                                      modulo.id
                                    ]?.includes(
                                      accion
                                    ) || false;

                                  return (
                                    <td
                                      key={accion}
                                      style={
                                        styles.permissionTd
                                      }
                                    >
                                      <button
                                        onClick={() =>
                                          handleCambiarPermiso(
                                            rolActual.id,
                                            modulo.id,
                                            accion,
                                            !activo
                                          )
                                        }
                                        style={{
                                          width: '24px',
                                          height: '20px',
                                          border: 'none',
                                          borderRadius: '4px',
                                          backgroundColor:
                                            activo
                                              ? darkMode
                                                ? '#22c55e'
                                                : '#dcfce7'
                                              : darkMode
                                                ? '#1e293b'
                                                : '#f1f5f9',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems:
                                            'center',
                                          justifyContent:
                                            'center'
                                        }}
                                        title={
                                          activo
                                            ? `Quitar permiso: ${accion}`
                                            : `Activar permiso: ${accion}`
                                        }
                                      >
                                        {activo ? (
                                          <CheckIcon />
                                        ) : (
                                          <XIcon
                                            color={
                                              theme.textSub
                                            }
                                          />
                                        )}
                                      </button>
                                    </td>
                                  );
                                }
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div
                      style={{
                        marginTop: '10px',
                        padding: '8px 10px',
                        backgroundColor:
                          darkMode
                            ? '#111827'
                            : '#fffbeb',
                        border: `1px solid ${
                          darkMode
                            ? '#1e293b'
                            : '#fde68a'
                        }`,
                        borderRadius: '5px',
                        fontSize: '8px',
                        color: theme.textSub
                      }}
                    >
                      <strong
                        style={{
                          color: theme.gold
                        }}
                      >
                        Importante:
                      </strong>{' '}
                      El Técnico en Campo no tiene permisos para registrar, editar ni eliminar abonos o pagos. El registro de abonos corresponde al Administrador.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: '12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              position: 'relative',
              zIndex: 1
            }}
          >
            <div
              style={{
                backgroundColor: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                padding: '9px 11px'
              }}
            >
              <div
                style={{
                  fontSize: '8px',
                  color: theme.textSub,
                  fontWeight: '700'
                }}
              >
                ADMINISTRADOR
              </div>

              <div
                style={{
                  fontSize: '9px',
                  color: theme.textMain,
                  marginTop: '3px'
                }}
              >
                Web + Móvil · Control general
              </div>
            </div>

            <div
              style={{
                backgroundColor: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                padding: '9px 11px'
              }}
            >
              <div
                style={{
                  fontSize: '8px',
                  color: theme.textSub,
                  fontWeight: '700'
                }}
              >
                TÉCNICO EN CAMPO
              </div>

              <div
                style={{
                  fontSize: '9px',
                  color: theme.textMain,
                  marginTop: '3px'
                }}
              >
                Móvil · Órdenes asignadas
              </div>
            </div>

            <div
              style={{
                backgroundColor: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                padding: '9px 11px'
              }}
            >
              <div
                style={{
                  fontSize: '8px',
                  color: theme.textSub,
                  fontWeight: '700'
                }}
              >
                CONTROL DE ACCESO
              </div>

              <div
                style={{
                  fontSize: '9px',
                  color: theme.textMain,
                  marginTop: '3px'
                }}
              >
                {permisosActivos} permisos configurados
              </div>
            </div>
          </div>
        </main>
      </div>

      {modalOpen && (
        <div
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
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.border}`,
              width: '430px',
              maxWidth: '100%',
              borderRadius: '8px',
              padding: '20px',
              boxShadow:
                '0 10px 25px -5px rgba(0,0,0,0.3)'
            }}
          >
            <h3
              style={{
                margin: '0 0 4px',
                fontSize: '14px',
                color: theme.textMain
              }}
            >
              {modoModal === 'crear'
                ? 'Nuevo Usuario'
                : modoModal === 'editar'
                  ? 'Editar Usuario'
                  : 'Detalle del Usuario'}
            </h3>

            <p
              style={{
                margin: '0 0 15px',
                color: theme.textSub,
                fontSize: '9px'
              }}
            >
              Administración de acceso a Eléctricos MCA.
            </p>

            {modoModal === 'ver' &&
            selectedItem ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <DetailRow
                  label="Nombre"
                  value={selectedItem.nombre}
                  theme={theme}
                />

                <DetailRow
                  label="Correo"
                  value={selectedItem.correo}
                  theme={theme}
                />

                <DetailRow
                  label="Rol"
                  value={selectedItem.rol}
                  theme={theme}
                />

                <DetailRow
                  label="Plataforma"
                  value={selectedItem.plataforma}
                  theme={theme}
                />

                <DetailRow
                  label="Estado"
                  value={selectedItem.estado}
                  theme={theme}
                />

                <DetailRow
                  label="Último acceso"
                  value={selectedItem.ultimoAcceso}
                  theme={theme}
                />

                <div
                  style={{
                    marginTop: '8px',
                    padding: '10px',
                    backgroundColor:
                      theme.goldBg,
                    borderRadius: '5px',
                    border: `1px solid ${
                      darkMode
                        ? '#6b4f00'
                        : '#fde68a'
                    }`
                  }}
                >
                  <div
                    style={{
                      fontSize: '8px',
                      color: theme.gold,
                      fontWeight: '700',
                      marginBottom: '4px'
                    }}
                  >
                    ALCANCE DEL ROL
                  </div>

                  <div
                    style={{
                      fontSize: '9px',
                      color: theme.textMain
                    }}
                  >
                    {selectedItem.rol ===
                    'Administrador'
                      ? 'Acceso administrativo desde Web y Móvil, incluyendo gestión de usuarios, clientes, cotizaciones, órdenes, inventario, abonos, agenda y reportes.'
                      : 'Acceso exclusivamente desde Móvil para consultar y gestionar las órdenes de trabajo asignadas. No registra abonos ni administra pagos.'}
                  </div>
                </div>

                <button
                  onClick={() =>
                    setModalOpen(false)
                  }
                  style={{
                    ...styles.btnPrimary,
                    marginTop: '7px'
                  }}
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleGuardarUsuario}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div>
                  <label style={styles.label}>
                    Nombre completo
                  </label>

                  <input
                    type="text"
                    placeholder="Nombre del usuario"
                    required
                    value={formUsuario.nombre}
                    onChange={e =>
                      setFormUsuario({
                        ...formUsuario,
                        nombre: e.target.value
                      })
                    }
                    style={{
                      ...styles.input,
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: theme.inputBg,
                      borderColor: theme.border,
                      color: theme.textMain
                    }}
                  />
                </div>

                <div>
                  <label style={styles.label}>
                    Correo electrónico
                  </label>

                  <input
                    type="email"
                    placeholder="usuario@electricosmca.com"
                    required
                    value={formUsuario.correo}
                    onChange={e =>
                      setFormUsuario({
                        ...formUsuario,
                        correo: e.target.value
                      })
                    }
                    style={{
                      ...styles.input,
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: theme.inputBg,
                      borderColor: theme.border,
                      color: theme.textMain
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap: '8px'
                  }}
                >
                  <div>
                    <label style={styles.label}>
                      Rol de acceso
                    </label>

                    <select
                      value={formUsuario.rol}
                      onChange={e =>
                        setFormUsuario({
                          ...formUsuario,
                          rol: e.target.value
                        })
                      }
                      style={{
                        ...styles.input,
                        width: '100%',
                        boxSizing: 'border-box',
                        backgroundColor: theme.inputBg,
                        borderColor: theme.border,
                        color: theme.textMain
                      }}
                    >
                      <option value="Administrador">
                        Administrador
                      </option>

                      <option value="Técnico en Campo">
                        Técnico en Campo
                      </option>
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>
                      Estado
                    </label>

                    <select
                      value={formUsuario.estado}
                      onChange={e =>
                        setFormUsuario({
                          ...formUsuario,
                          estado: e.target.value
                        })
                      }
                      style={{
                        ...styles.input,
                        width: '100%',
                        boxSizing: 'border-box',
                        backgroundColor: theme.inputBg,
                        borderColor: theme.border,
                        color: theme.textMain
                      }}
                    >
                      <option value="Activo">
                        Activo
                      </option>

                      <option value="Inactivo">
                        Inactivo
                      </option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    padding: '9px',
                    backgroundColor:
                      darkMode
                        ? '#111827'
                        : '#f8fafc',
                    border:
                      `1px solid ${theme.border}`,
                    borderRadius: '5px'
                  }}
                >
                  <div
                    style={{
                      fontSize: '8px',
                      color: theme.textSub,
                      fontWeight: '700'
                    }}
                  >
                    ACCESO ASIGNADO
                  </div>

                  <div
                    style={{
                      marginTop: '4px',
                      fontSize: '9px',
                      color: theme.textMain
                    }}
                  >
                    {formUsuario.rol ===
                    'Administrador'
                      ? 'Web + Móvil — Acceso administrativo completo según permisos del rol.'
                      : 'Móvil — Acceso operativo para órdenes de trabajo asignadas.'}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    marginTop: '5px'
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
                      ? 'Crear Usuario'
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

function DetailRow({ label, value, theme }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '10px',
        padding: '8px 9px',
        backgroundColor: theme.inputBg,
        border: `1px solid ${theme.border}`,
        borderRadius: '5px'
      }}
    >
      <span
        style={{
          fontSize: '9px',
          color: theme.textSub,
          fontWeight: '700'
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontSize: '9px',
          color: theme.textMain,
          fontWeight: '600',
          textAlign: 'right'
        }}
      >
        {value}
      </span>
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

  th: {
    padding: '8px',
    fontWeight: '700'
  },

  td: {
    padding: '10px 8px'
  },

  permissionTh: {
    padding: '8px 5px',
    fontSize: '7px',
    color: '#64748b',
    fontWeight: '700',
    textAlign: 'center'
  },

  permissionTd: {
    padding: '8px 5px',
    textAlign: 'center'
  },

  btnIcon: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '3px',
    display: 'flex',
    alignItems: 'center'
  },

  pBtn: {
    width: '20px',
    height: '20px',
    border: '1px solid',
    borderRadius: '3px',
    fontSize: '9px',
    cursor: 'pointer'
  },

  input: {
    padding: '7px 10px',
    borderRadius: '4px',
    border: '1px solid',
    fontSize: '10px',
    outline: 'none'
  },

  label: {
    display: 'block',
    fontSize: '9px',
    color: '#64748b',
    fontWeight: '700',
    marginBottom: '4px'
  },

  btnPrimary: {
    backgroundColor: '#facc15',
    border: 'none',
    padding: '7px 12px',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '10px',
    color: '#0f172a',
    cursor: 'pointer'
  },

  btnSecondary: {
    backgroundColor: '#94a3b8',
    border: 'none',
    padding: '7px 12px',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#ffffff',
    cursor: 'pointer'
  }
};

export default GestionRolesPermisos;