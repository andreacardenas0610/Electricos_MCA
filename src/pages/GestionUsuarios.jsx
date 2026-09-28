import React, { useContext, useEffect, useState } from 'react';
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

const UserPlusIcon = ({ color = 'currentColor' }) => (
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
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="17" y1="11" x2="23" y2="11" />
  </svg>
);

const SunIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
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

const MoonIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3b82f6"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
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
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
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
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
  </svg>
);

const PowerIcon = ({ color = '#ef4444' }) => (
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
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    <line x1="12" y1="2" x2="12" y2="12" />
  </svg>
);

const CloseIcon = ({ color = '#64748b' }) => (
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
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const INITIAL_USUARIOS = [
  {
    id: 1,
    nombre: 'Carlos Mendoza',
    email: 'carlos.m@empresa.com',
    rol: 'Técnico',
    estado: 'Activo',
    zona: 'Norte',
    otAsignadas: 5
  },
  {
    id: 2,
    nombre: 'Jorge Rivera',
    email: 'jorge.r@empresa.com',
    rol: 'Supervisor',
    estado: 'Activo',
    zona: 'Centro',
    otAsignadas: 12
  },
  {
    id: 3,
    nombre: 'Andrés López',
    email: 'andres.l@empresa.com',
    rol: 'Técnico',
    estado: 'Inactivo',
    zona: 'Sur',
    otAsignadas: 0
  },
  {
    id: 4,
    nombre: 'Ana Gómez',
    email: 'ana.g@empresa.com',
    rol: 'Administrador',
    estado: 'Activo',
    zona: 'General',
    otAsignadas: 0
  }
];

function ModalNuevoUsuario({
  isOpen,
  onClose,
  onGuardar,
  esModoClaro
}) {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    rol: 'Técnico',
    zona: 'Norte',
    estado: 'Activo'
  });

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    onGuardar({
      ...formData,
      id: Date.now(),
      otAsignadas: 0
    });

    setFormData({
      nombre: '',
      email: '',
      rol: 'Técnico',
      zona: 'Norte',
      estado: 'Activo'
    });

    onClose();
  };

  const fondo = esModoClaro ? '#ffffff' : '#111c38';
  const texto = esModoClaro ? '#0f172a' : '#f8fafc';
  const secundario = esModoClaro ? '#64748b' : '#94a3b8';
  const borde = esModoClaro ? '#e2e8f0' : '#334155';
  const fondoInput = esModoClaro ? '#ffffff' : '#0f172a';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 1000
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '470px',
          backgroundColor: fondo,
          color: texto,
          borderRadius: '10px',
          border: `1px solid ${borde}`,
          padding: '22px',
          boxSizing: 'border-box',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '18px'
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '800'
              }}
            >
              Nuevo Usuario
            </h3>

            <p
              style={{
                margin: '4px 0 0',
                fontSize: '11px',
                color: secundario
              }}
            >
              Registra un nuevo usuario del sistema.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Cerrar"
            style={styles.btnIcon}
          >
            <CloseIcon color={secundario} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '13px'
          }}
        >
          <div>
            <label style={styles.label}>
              NOMBRE COMPLETO
            </label>

            <input
              type="text"
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
                borderColor: borde,
                backgroundColor: fondoInput,
                color: texto
              }}
            />
          </div>

          <div>
            <label style={styles.label}>
              CORREO ELECTRÓNICO
            </label>

            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  email: e.target.value
                })
              }
              style={{
                ...styles.input,
                borderColor: borde,
                backgroundColor: fondoInput,
                color: texto
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}
          >
            <div>
              <label style={styles.label}>ROL</label>

              <select
                value={formData.rol}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rol: e.target.value
                  })
                }
                style={{
                  ...styles.input,
                  borderColor: borde,
                  backgroundColor: fondoInput,
                  color: texto
                }}
              >
                <option value="Técnico">Técnico</option>
                <option value="Supervisor">
                  Supervisor
                </option>
                <option value="Administrador">
                  Administrador
                </option>
              </select>
            </div>

            <div>
              <label style={styles.label}>ZONA</label>

              <select
                value={formData.zona}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    zona: e.target.value
                  })
                }
                style={{
                  ...styles.input,
                  borderColor: borde,
                  backgroundColor: fondoInput,
                  color: texto
                }}
              >
                <option value="Norte">Norte</option>
                <option value="Centro">Centro</option>
                <option value="Sur">Sur</option>
                <option value="General">General</option>
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
              onClick={onClose}
              style={{
                padding: '9px 14px',
                borderRadius: '6px',
                border: `1px solid ${borde}`,
                backgroundColor: esModoClaro
                  ? '#f8fafc'
                  : '#1e293b',
                color: texto,
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '700'
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              style={{
                padding: '9px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#facc15',
                color: '#0f172a',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '800'
              }}
            >
              Guardar Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function GestionUsuarios() {
  const { theme: temaGlobal, toggleTheme } =
    useContext(ThemeContext);

  const [usuarios, setUsuarios] = useState(() => {
    try {
      const guardados = localStorage.getItem('mca_usuarios_gestion');
      return guardados ? JSON.parse(guardados) : INITIAL_USUARIOS;
    } catch {
      return INITIAL_USUARIOS;
    }
  });

  useEffect(() => {
    localStorage.setItem('mca_usuarios_gestion', JSON.stringify(usuarios));
    localStorage.setItem(
      'mca_tecnicos',
      JSON.stringify(usuarios.filter((usuario) => usuario.rol === 'Técnico'))
    );
  }, [usuarios]);

  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState(null);

  const esModoClaro = temaGlobal === 'light';

  const colores = {
    fondo: esModoClaro ? '#f8fafc' : '#0b0f19',
    tarjeta: esModoClaro ? '#ffffff' : '#111c38',
    tarjetaSecundaria: esModoClaro
      ? '#f8fafc'
      : '#0f1a33',
    borde: esModoClaro ? '#e2e8f0' : '#263555',
    texto: esModoClaro ? '#0f172a' : '#f8fafc',
    secundario: esModoClaro ? '#64748b' : '#94a3b8',
    amarillo: '#facc15',
    iconColor: esModoClaro ? '#475569' : '#cbd5e1'
  };

  const handleCambiarRol = (id, nuevoRol) => {
    setUsuarios((prev) =>
      prev.map((usuario) =>
        usuario.id === id
          ? {
              ...usuario,
              rol: nuevoRol
            }
          : usuario
      )
    );
  };

  const handleCambiarEstado = (id) => {
    setUsuarios((prev) =>
      prev.map((usuario) =>
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

  const handleAgregarUsuario = (nuevoUsuario) => {
    setUsuarios((prev) => [...prev, nuevoUsuario]);
  };

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const texto = busqueda.toLowerCase().trim();

    const coincideRol =
      filtroRol === 'Todos' ||
      usuario.rol === filtroRol;

    const coincideBusqueda =
      !texto ||
      usuario.nombre.toLowerCase().includes(texto) ||
      usuario.email.toLowerCase().includes(texto) ||
      usuario.zona.toLowerCase().includes(texto);

    return coincideRol && coincideBusqueda;
  });

  const totalUsuarios = usuarios.length;

  const totalAdministradores = usuarios.filter(
    (usuario) => usuario.rol === 'Administrador'
  ).length;

  const totalSupervisores = usuarios.filter(
    (usuario) => usuario.rol === 'Supervisor'
  ).length;

  const totalTecnicos = usuarios.filter(
    (usuario) => usuario.rol === 'Técnico'
  ).length;

  const getRolStyle = (rol) => {
    if (rol === 'Administrador') {
      return {
        backgroundColor: esModoClaro
          ? '#fef3c7'
          : '#3f3210',
        color: esModoClaro
          ? '#92400e'
          : '#facc15'
      };
    }

    if (rol === 'Supervisor') {
      return {
        backgroundColor: esModoClaro
          ? '#e0f2fe'
          : '#102c4a',
        color: esModoClaro
          ? '#0369a1'
          : '#60a5fa'
      };
    }

    return {
      backgroundColor: esModoClaro
        ? '#dcfce7'
        : '#103521',
      color: esModoClaro
        ? '#166534'
        : '#4ade80'
    };
  };

  const abrirDetalle = (usuario) => {
    setUsuarioSeleccionado(usuario);
  };

  const cerrarDetalle = () => {
    setUsuarioSeleccionado(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colores.fondo,
        color: colores.texto,
        padding: '22px',
        fontFamily: 'system-ui, sans-serif',
        boxSizing: 'border-box',
        transition: 'background-color 0.2s'
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
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '15px',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '23px',
                fontWeight: '800',
                letterSpacing: '-0.4px'
              }}
            >
              Gestión de Acceso de Usuarios
            </h1>

            <p
              style={{
                margin: '5px 0 0',
                color: colores.secundario,
                fontSize: '12px'
              }}
            >
              Administración de usuarios, roles y estados
              de cuenta
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px'
            }}
          >
            <button
              onClick={toggleTheme}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '9px 13px',
                borderRadius: '7px',
                border: `1px solid ${colores.borde}`,
                backgroundColor: colores.tarjeta,
                color: colores.texto,
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '700'
              }}
            >
              {esModoClaro ? <MoonIcon /> : <SunIcon />}
              {esModoClaro ? 'Oscuro' : 'Claro'}
            </button>

            <button
              onClick={() => setModalAbierto(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 15px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: colores.amarillo,
                color: '#0f172a',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '800'
              }}
            >
              <UserPlusIcon />
              NUEVO USUARIO
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '12px',
            marginBottom: '18px'
          }}
        >
          <div
            style={{
              ...styles.kpiCard,
              backgroundColor: colores.tarjeta,
              borderColor: colores.borde
            }}
          >
            <span style={styles.kpiLabel}>
              TOTAL USUARIOS
            </span>

            <div
              style={{
                ...styles.kpiValue,
                color: colores.texto
              }}
            >
              {totalUsuarios}
            </div>
          </div>

          <div
            style={{
              ...styles.kpiCard,
              backgroundColor: colores.tarjeta,
              borderColor: colores.borde
            }}
          >
            <span style={styles.kpiLabel}>
              ADMINISTRADORES
            </span>

            <div
              style={{
                ...styles.kpiValue,
                color: '#f59e0b'
              }}
            >
              {totalAdministradores}
            </div>
          </div>

          <div
            style={{
              ...styles.kpiCard,
              backgroundColor: colores.tarjeta,
              borderColor: colores.borde
            }}
          >
            <span style={styles.kpiLabel}>
              SUPERVISORES
            </span>

            <div
              style={{
                ...styles.kpiValue,
                color: '#3b82f6'
              }}
            >
              {totalSupervisores}
            </div>
          </div>

          <div
            style={{
              ...styles.kpiCard,
              backgroundColor: colores.tarjeta,
              borderColor: colores.borde
            }}
          >
            <span style={styles.kpiLabel}>
              TÉCNICOS DE CAMPO
            </span>

            <div
              style={{
                ...styles.kpiValue,
                color: '#22c55e'
              }}
            >
              {totalTecnicos}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: colores.tarjeta,
            border: `1px solid ${colores.borde}`,
            borderRadius: '9px',
            padding: '12px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '370px'
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '10px',
                color: colores.secundario,
                display: 'flex'
              }}
            >
              <SearchIcon
                color={colores.secundario}
              />
            </span>

            <input
              type="text"
              placeholder="Buscar por nombre, correo o zona..."
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: '7px',
                border: `1px solid ${colores.borde}`,
                backgroundColor:
                  colores.tarjetaSecundaria,
                color: colores.texto,
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
              gap: '6px',
              flexWrap: 'wrap'
            }}
          >
            {[
              'Todos',
              'Administrador',
              'Supervisor',
              'Técnico'
            ].map((rol) => {
              const activo = filtroRol === rol;

              return (
                <button
                  key={rol}
                  onClick={() => setFiltroRol(rol)}
                  style={{
                    padding: '7px 11px',
                    borderRadius: '6px',
                    border: `1px solid ${
                      activo
                        ? colores.amarillo
                        : colores.borde
                    }`,
                    backgroundColor: activo
                      ? esModoClaro
                        ? '#fef3c7'
                        : '#3f3210'
                      : colores.tarjetaSecundaria,
                    color: activo
                      ? esModoClaro
                        ? '#92400e'
                        : '#facc15'
                      : colores.secundario,
                    fontSize: '10px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  {rol}
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            backgroundColor: colores.tarjeta,
            border: `1px solid ${colores.borde}`,
            borderRadius: '10px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: `1px solid ${colores.borde}`
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: '800'
                }}
              >
                Usuarios registrados
              </h2>

              <span
                style={{
                  display: 'block',
                  marginTop: '3px',
                  color: colores.secundario,
                  fontSize: '10px'
                }}
              >
                {usuariosFiltrados.length} usuarios
                encontrados
              </span>
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
                minWidth: '900px',
                borderCollapse: 'collapse',
                fontSize: '12px'
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor:
                      colores.tarjetaSecundaria,
                    borderBottom: `1px solid ${colores.borde}`,
                    textAlign: 'left'
                  }}
                >
                  <th style={styles.th}>
                    Usuario
                  </th>

                  <th style={styles.th}>
                    Zona / Sede
                  </th>

                  <th style={styles.th}>
                    Rol asignado
                  </th>

                  <th style={styles.th}>
                    OTs activas
                  </th>

                  <th style={styles.th}>
                    Estado
                  </th>

                  <th
                    style={{
                      ...styles.th,
                      textAlign: 'right'
                    }}
                  >
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: colores.secundario,
                        fontSize: '12px'
                      }}
                    >
                      No se encontraron usuarios con los
                      filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((usuario) => {
                    const rolStyle =
                      getRolStyle(usuario.rol);

                    return (
                      <tr
                        key={usuario.id}
                        style={{
                          borderBottom: `1px solid ${colores.borde}`
                        }}
                      >
                        <td
                          style={{
                            padding: '13px 12px'
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '9px'
                            }}
                          >
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor:
                                  esModoClaro
                                    ? '#f1f5f9'
                                    : '#1e293b',
                                color:
                                  colores.amarillo,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: '800',
                                flexShrink: 0
                              }}
                            >
                              {usuario.nombre
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <div
                                style={{
                                  fontWeight: '800',
                                  color: colores.texto,
                                  marginBottom: '2px'
                                }}
                              >
                                {usuario.nombre}
                              </div>

                              <div
                                style={{
                                  fontSize: '10px',
                                  color:
                                    colores.secundario
                                }}
                              >
                                {usuario.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td
                          style={{
                            padding: '13px 12px',
                            color: colores.texto
                          }}
                        >
                          <span
                            style={{
                              fontSize: '11px',
                              color: colores.secundario
                            }}
                          >
                            📍 {usuario.zona}
                          </span>
                        </td>

                        <td
                          style={{
                            padding: '13px 12px'
                          }}
                        >
                          <select
                            value={usuario.rol}
                            onChange={(e) =>
                              handleCambiarRol(
                                usuario.id,
                                e.target.value
                              )
                            }
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor:
                                rolStyle.backgroundColor,
                              color: rolStyle.color,
                              fontSize: '10px',
                              fontWeight: '800',
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                          >
                            <option value="Administrador">
                              Administrador
                            </option>

                            <option value="Supervisor">
                              Supervisor
                            </option>

                            <option value="Técnico">
                              Técnico
                            </option>
                          </select>
                        </td>

                        <td
                          style={{
                            padding: '13px 12px',
                            fontWeight: '800',
                            color: '#3b82f6'
                          }}
                        >
                          {usuario.otAsignadas} OTs
                        </td>

                        <td
                          style={{
                            padding: '13px 12px'
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              backgroundColor:
                                usuario.estado ===
                                'Activo'
                                  ? esModoClaro
                                    ? '#dcfce7'
                                    : '#103521'
                                  : esModoClaro
                                  ? '#fee2e2'
                                  : '#3b1d1d',
                              color:
                                usuario.estado ===
                                'Activo'
                                  ? esModoClaro
                                    ? '#166534'
                                    : '#4ade80'
                                  : esModoClaro
                                  ? '#991b1b'
                                  : '#f87171',
                              fontSize: '9px',
                              fontWeight: '800'
                            }}
                          >
                            <span
                              style={{
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                backgroundColor:
                                  usuario.estado ===
                                  'Activo'
                                    ? '#22c55e'
                                    : '#ef4444'
                              }}
                            />

                            {usuario.estado}
                          </span>
                        </td>

                        <td
                          style={{
                            padding: '13px 12px'
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'flex-end',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                abrirDetalle(usuario)
                              }
                              title="Ver detalle"
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
                              onClick={() =>
                                abrirDetalle(usuario)
                              }
                              title="Editar usuario"
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
                              onClick={() =>
                                handleCambiarEstado(
                                  usuario.id
                                )
                              }
                              title={
                                usuario.estado ===
                                'Activo'
                                  ? 'Desactivar usuario'
                                  : 'Activar usuario'
                              }
                              style={styles.btnIcon}
                            >
                              <PowerIcon
                                color={
                                  usuario.estado ===
                                  'Activo'
                                    ? '#ef4444'
                                    : '#22c55e'
                                }
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ModalNuevoUsuario
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onGuardar={handleAgregarUsuario}
        esModoClaro={esModoClaro}
      />

      {usuarioSeleccionado && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              backgroundColor: colores.tarjeta,
              border: `1px solid ${colores.borde}`,
              borderRadius: '10px',
              padding: '20px',
              boxSizing: 'border-box'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '18px'
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '800'
                  }}
                >
                  Detalle del usuario
                </h2>

                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '11px',
                    color: colores.secundario
                  }}
                >
                  Información de acceso y asignación
                </p>
              </div>

              <button
                onClick={cerrarDetalle}
                title="Cerrar"
                style={styles.btnIcon}
              >
                <CloseIcon
                  color={colores.secundario}
                />
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '13px',
                borderRadius: '8px',
                backgroundColor:
                  colores.tarjetaSecundaria,
                border: `1px solid ${colores.borde}`,
                marginBottom: '12px'
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: esModoClaro
                    ? '#e2e8f0'
                    : '#1e293b',
                  color: colores.amarillo,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: '800'
                }}
              >
                {usuarioSeleccionado.nombre
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '800'
                  }}
                >
                  {usuarioSeleccionado.nombre}
                </div>

                <div
                  style={{
                    fontSize: '10px',
                    color: colores.secundario,
                    marginTop: '3px'
                  }}
                >
                  {usuarioSeleccionado.email}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(2, minmax(0, 1fr))',
                gap: '9px'
              }}
            >
              {[
                [
                  'ROL',
                  usuarioSeleccionado.rol
                ],
                [
                  'ZONA / SEDE',
                  usuarioSeleccionado.zona
                ],
                [
                  'OTs ASIGNADAS',
                  `${usuarioSeleccionado.otAsignadas} OTs`
                ],
                [
                  'ESTADO',
                  usuarioSeleccionado.estado
                ]
              ].map(([titulo, valor]) => (
                <div
                  key={titulo}
                  style={{
                    padding: '10px',
                    borderRadius: '7px',
                    backgroundColor:
                      colores.tarjetaSecundaria,
                    border: `1px solid ${colores.borde}`
                  }}
                >
                  <div
                    style={{
                      fontSize: '9px',
                      fontWeight: '800',
                      color: colores.secundario,
                      marginBottom: '4px'
                    }}
                  >
                    {titulo}
                  </div>

                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: '700'
                    }}
                  >
                    {valor}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '7px',
                marginTop: '18px'
              }}
            >
              <button
                onClick={() =>
                  handleCambiarEstado(
                    usuarioSeleccionado.id
                  )
                }
                style={{
                  border: 'none',
                  background: 'none',
                  color:
                    usuarioSeleccionado.estado ===
                    'Activo'
                      ? '#ef4444'
                      : '#22c55e',
                  fontSize: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <PowerIcon
                  color={
                    usuarioSeleccionado.estado ===
                    'Activo'
                      ? '#ef4444'
                      : '#22c55e'
                  }
                />

                {usuarioSeleccionado.estado ===
                'Activo'
                  ? 'Desactivar'
                  : 'Activar'}
              </button>

              <button
                onClick={cerrarDetalle}
                style={{
                  padding: '9px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#facc15',
                  color: '#0f172a',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: '800'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  btnIcon: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },

  input: {
    width: '100%',
    padding: '9px 10px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '12px',
    outline: 'none',
    boxSizing: 'border-box'
  },

  label: {
    display: 'block',
    fontSize: '10px',
    fontWeight: '800',
    color: '#64748b',
    marginBottom: '5px'
  },

  kpiCard: {
    padding: '14px 16px',
    borderRadius: '9px',
    border: '1px solid'
  },

  kpiLabel: {
    display: 'block',
    fontSize: '9px',
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: '0.5px'
  },

  kpiValue: {
    fontSize: '24px',
    fontWeight: '800',
    marginTop: '5px'
  },

  th: {
    padding: '10px 12px',
    fontSize: '9px',
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap'
  }
};

export default GestionUsuarios;