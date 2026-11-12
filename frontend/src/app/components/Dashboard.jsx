import { useContext, useEffect, useState } from 'react';
import {
  CalendarPlus,
  ClipboardCheck,
  Coins,
  FileText,
  Gauge,
  Handshake,
  LogOut,
  Moon,
  PackageOpen,
  Scale,
  Shield,
  Sun,
  UserRoundPlus,
  UsersRound,
  Wrench,
} from 'lucide-react';
import { Login } from '../../features/auth/components/Login.jsx';
import { SplashScreen } from '../../shared/components/SplashScreen.jsx';
import { ThemeContext } from '../../shared/context/ThemeContext.jsx';
import { clearLocalSession, getLocalSession, setLocalSession } from '../../shared/localStore.js';
import { API_SESSION_EXPIRED } from '../../shared/api.js';

// Importación de las vistas
import { PanelControl } from '../../features/dashboard/components/PanelControl.jsx';
import { Materiales } from '../../features/inventory/components/Materiales.jsx';
import Cotizacion from '../../features/quotes/components/Cotizacion.jsx';
import AbonosVentas from '../../features/payments/components/AbonosVentas.jsx';
import { CatalogoServicios } from '../../features/services/components/CatalogoServicios.jsx';
import { ProgramacionActividades } from '../../features/activities/components/ProgramacionActividades.jsx';
import { GestionUsuarios } from '../../features/users/components/GestionUsuarios.jsx';
import { GestionRolesPermisos } from '../../features/users/components/GestionRolesPermisos.jsx';
import { Clientes, GestionTerceros, OrdenesServicio } from '../../features/management/components/ModulosGestion.jsx';
import { Button, Modal } from '../../shared/components/ui.jsx';

const LICENCIAS_DEPENDENCIAS = [
  { nombre: 'React y React DOM', licencia: 'MIT', url: 'https://opensource.org/license/mit' },
  { nombre: 'Vite', licencia: 'MIT', url: 'https://opensource.org/license/mit' },
  { nombre: 'Lucide React', licencia: 'ISC', url: 'https://opensource.org/license/isc-license-txt' },
  { nombre: 'Express, CORS, jsonwebtoken y Multer', licencia: 'MIT', url: 'https://opensource.org/license/mit' },
  { nombre: 'dotenv', licencia: 'BSD-2-Clause', url: 'https://opensource.org/license/bsd-2-clause' },
  { nombre: 'bcryptjs', licencia: 'BSD-3-Clause', url: 'https://opensource.org/license/bsd-3-clause' },
  { nombre: 'node-postgres (pg)', licencia: 'MIT', url: 'https://opensource.org/license/mit' },
  { nombre: 'PostgreSQL (motor de base de datos)', licencia: 'PostgreSQL License', url: 'https://www.postgresql.org/about/licence/' },
];

// El correo de recuperación llega como ?recuperar=<token>: se abre la pantalla
// de contraseña nueva con el código ya cargado y se limpia la URL.
function leerTokenRecuperacion() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('recuperar') || '';
  if (token) window.history.replaceState({}, '', window.location.pathname);
  return token;
}

export function Dashboard() {
  const [sesion, setSesion] = useState(getLocalSession);
  const [tokenRecuperacion] = useState(leerTokenRecuperacion);
  const autenticado = Boolean(sesion?.usuario);
  const { theme: tema, toggleTheme } = useContext(ThemeContext);

  const [seccionActual, setSeccionActual] = useState('panel');
  const [mostrandoSplash, setMostrandoSplash] = useState(false);
  const [mostrarLicencias, setMostrarLicencias] = useState(false);

  useEffect(() => {
    if (!mostrandoSplash) return undefined;

    const temporizador = window.setTimeout(() => setMostrandoSplash(false), 1800);
    return () => window.clearTimeout(temporizador);
  }, [mostrandoSplash]);

  useEffect(() => {
    const cerrarSesionExpirada = () => {
      clearLocalSession();
      setSesion(null);
    };
    window.addEventListener(API_SESSION_EXPIRED, cerrarSesionExpirada);
    return () => window.removeEventListener(API_SESSION_EXPIRED, cerrarSesionExpirada);
  }, []);

  const handleLogin = (nuevaSesion) => {
    setLocalSession(nuevaSesion);
    setSesion(nuevaSesion);
    setMostrandoSplash(true);
  };

  const handleLogout = () => {
    clearLocalSession();
    setSesion(null);
  };

  if (!autenticado) {
    return <Login onLogin={handleLogin} tokenRecuperacion={tokenRecuperacion} />;
  }

  if (mostrandoSplash) {
    return <SplashScreen />;
  }

  // Agrupación del menú por categorías
  const menuGrupos = [
    {
      titulo: 'GENERAL',
      items: [
        { id: 'panel', label: 'Panel de Control', icon: Gauge },
        { id: 'clientes', label: 'Clientes', icon: UsersRound },
        { id: 'terceros', label: 'Terceros', icon: Handshake },
      ]
    },
    {
      titulo: 'OPERACIONES',
      items: [
        { id: 'materiales', label: 'Materiales', icon: PackageOpen },
        { id: 'servicios', label: 'Servicios', icon: Wrench },
        { id: 'Cotizacion', label: 'Cotizaciones', icon: FileText },
        { id: 'AbonosVentas', label: 'Abonos y Ventas', icon: Coins },
        { id: 'programacion', label: 'Agenda', icon: CalendarPlus },
        { id: 'ordenes', label: 'Órdenes de Servicio', icon: ClipboardCheck },
      ]
    },
    {
      titulo: 'ADMINISTRACIÓN',
      items: [
        { id: 'usuarios', label: 'Gestión Usuarios', icon: UserRoundPlus },
        { id: 'roles', label: 'Roles', icon: Shield },

       
      ]
    }
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", overflow: 'hidden' }}>
      
      {/* Inyección de estilos dinámicos para la barra de scroll personalizada */}
      <style>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: var(--bg-sidebar);
          border-radius: 4px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: var(--sidebar-border);
          border-radius: 4px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--accent-yellow);
        }
        /* Scroll fijo: la barra lateral y el contenido tienen su propia barra de scroll */
        .app-scroll {
          scrollbar-width: thin;
          scrollbar-color: var(--border-color) transparent;
        }
        .app-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .app-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .app-scroll::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 6px;
        }
        .app-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--accent-yellow);
        }
        /* Hover del menú: color amarillo visible en modo claro y en modo oscuro */
        .sidebar-item {
          transition: background-color 0.18s ease, color 0.18s ease,
            border-left-color 0.18s ease, transform 0.18s ease;
        }
        .sidebar-item:not(.is-active):hover {
          background-color: var(--sidebar-hover) !important;
          color: var(--sidebar-hover-text) !important;
          border-left-color: var(--sidebar-hover-border) !important;
          transform: translateX(2px);
        }
        .sidebar-item:not(.is-active):hover svg {
          color: var(--sidebar-hover-text);
        }
      `}</style>

      {/* BARRA LATERAL: colapsada a iconos, se expande al pasar el cursor encima */}
      <aside className="mca-sidebar" style={{ 
        height: '100vh',
        backgroundColor: 'var(--bg-sidebar)', 
        borderRight: '1px solid var(--sidebar-border)', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        boxShadow: '4px 0 20px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        zIndex: 10
      }}
        onMouseLeave={(event) => {
          event.currentTarget.querySelector(':focus')?.blur();
        }}
      >
        <div className="sidebar-scroll mca-sidebar__content">
          {/* Header del Logo */}
          <div className="mca-sidebar__brand" style={{ padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>⚡</span>
                <h1 className="mca-sidebar__label" style={{ color: 'var(--accent-yellow)', fontSize: '20px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
                  Eléctricos MCA
                </h1>
              </div>
              <span className="mca-sidebar__label" style={{ fontSize: '10px', color: 'var(--sidebar-muted)', letterSpacing: '1.2px', fontWeight: '700', display: 'block', marginTop: '4px', textTransform: 'uppercase' }}>
                Gestión Industrial
              </span>
            </div>

          </div>

          {/* Menú Organizado por Secciones */}
          <nav 
            className="mca-sidebar__menu"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '20px'
            }}
          >
            {menuGrupos.map((grupo, index) => (
              <div className="mca-sidebar__group" key={index}>
                <span className="mca-sidebar__label mca-sidebar__group-title">
                  {grupo.titulo}
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {grupo.items.map((item) => {
                    const activo = seccionActual === item.id;
                    const Icono = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSeccionActual(item.id)}
                        className={`sidebar-item mca-sidebar__item ${activo ? 'is-active' : ''}`.trim()}
                        title={item.label}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          width: '100%',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: activo ? 'var(--sidebar-active)' : 'transparent',
                          color: activo ? 'var(--accent-yellow)' : 'var(--sidebar-text)',
                          fontWeight: activo ? '700' : '500',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '13px',
                          borderLeft: activo ? '4px solid var(--accent-yellow)' : '4px solid transparent',
                          boxShadow: activo ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none'
                        }}
                      >
                        <span style={{ width: '24px', display: 'flex', justifyContent: 'center', opacity: activo ? 1 : 0.8, flex: '0 0 auto' }}>
                          <Icono size={24} strokeWidth={1.7} />
                        </span>
                        <span className="mca-sidebar__label">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="mca-sidebar__bottom">
            <button
              type="button"
              className="mca-sidebar__licenses"
              onClick={() => setMostrarLicencias(true)}
              title="Licencias de software"
            >
              <Scale size={17} strokeWidth={1.8} />
              <span className="mca-sidebar__label">Licencias de software</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO DINÁMICO */}
      <div className="mca-app-main">
        <header className="mca-topbar">
          <div></div>
          <div className="mca-topbar__actions">
            <button
              type="button"
              className="mca-topbar__theme"
              onClick={toggleTheme}
              title={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {tema === 'dark' ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
            </button>
            <div className="mca-topbar__profile">
              <div className="mca-topbar__avatar">
                {(sesion?.usuario?.nombre || 'Administrador').slice(0, 2).toUpperCase()}
              </div>
              <div className="mca-topbar__identity">
                <strong>{sesion?.usuario?.nombre || sesion?.usuario?.usuario || 'Administrador'}</strong>
                <span>{sesion?.usuario?.rol || 'Administrador'}</span>
              </div>
              <button
                type="button"
                className="mca-topbar__logout"
                onClick={handleLogout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut size={17} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </header>
        <main className="app-scroll" style={{ flex: 1, minHeight: 0, minWidth: 0, backgroundColor: 'var(--bg-main)', overflowY: 'auto', overscrollBehavior: 'contain', width: '100%', boxSizing: 'border-box' }}>
          {seccionActual === 'panel' && <PanelControl onNavegar={setSeccionActual} />}
          {seccionActual === 'clientes' && <Clientes usuario={sesion?.usuario} />}
          {seccionActual === 'terceros' && <GestionTerceros usuario={sesion?.usuario} />}
          {seccionActual === 'materiales' && <Materiales />}
          {seccionActual === 'servicios' && <CatalogoServicios />}
          {seccionActual === 'Cotizacion' && <Cotizacion />}
          {seccionActual === 'AbonosVentas' && <AbonosVentas />}
          {seccionActual === 'programacion' && <ProgramacionActividades />}
          {seccionActual === 'ordenes' && <OrdenesServicio usuario={sesion?.usuario} />}
          {seccionActual === 'usuarios' && <GestionUsuarios />}
          {seccionActual === 'roles' && <GestionRolesPermisos />}
        </main>
      </div>

      <Modal
        open={mostrarLicencias}
        onClose={() => setMostrarLicencias(false)}
        title="Licencias de software"
        subtitle="Información del producto y de las tecnologías utilizadas."
        icon={Scale}
        size="lg"
        footer={
          <Button variant="primary" onClick={() => setMostrarLicencias(false)}>
            Entendido
          </Button>
        }
      >
        <div className="mca-licenses">
          <section className="mca-license-product">
            <div className="mca-license-product__eyebrow">PRODUCTO MCA</div>
            <h3>Sistema de Gestión Operativa MCA</h3>
            <p>
              Software propietario desarrollado in-house. Según la ficha técnica, cuenta con
              licencia privada para Eléctricos MCA S.A.S.
            </p>
            <div className="mca-license-product__meta">
              <span><strong>Versión:</strong> 1.0.0</span>
              <span><strong>Código:</strong> ADSO-3256538-MCA</span>
              <span><strong>Esquema:</strong> licencia privada propietaria</span>
            </div>
          </section>

          <section>
            <h3 className="mca-licenses__heading">Licencias de terceros</h3>
            <p className="mca-licenses__note">
              Las dependencias conservan sus propios términos de licencia; la licencia privada del
              producto no los reemplaza.
            </p>
            <div className="mca-licenses__list">
              {LICENCIAS_DEPENDENCIAS.map((item) => (
                <div className="mca-license-row" key={item.nombre}>
                  <div>
                    <strong>{item.nombre}</strong>
                    <span>{item.licencia}</span>
                  </div>
                  <a href={item.url} target="_blank" rel="noreferrer">
                    Ver licencia
                  </a>
                </div>
              ))}
            </div>
          </section>
          <p className="mca-licenses__source">
            Datos del producto basados en la ficha técnica de software MCA. Consulta los archivos
            package.json y los avisos de cada dependencia para el inventario completo.
          </p>
        </div>
      </Modal>

    </div>
  );
}

export default Dashboard;
