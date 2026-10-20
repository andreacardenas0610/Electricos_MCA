import { useEffect, useState } from 'react';
import {
  CalendarPlus,
  ClipboardCheck,
  Coins,
  FileText,
  Gauge,
  Handshake,
  LogOut,
  PackageOpen,
  Shield,
  UserRoundPlus,
  UsersRound,
  Wrench,
} from 'lucide-react';
import { Login } from '../../features/auth/components/Login.jsx';
import { SplashScreen } from '../../shared/components/SplashScreen.jsx';
import { clearApiSession, getApiSession, setApiSession } from '../../shared/api.js';

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

export function Dashboard() {
  const [sesion, setSesion] = useState(getApiSession);
  const autenticado = Boolean(sesion?.token);

  const [seccionActual, setSeccionActual] = useState('panel');
  const [mostrandoSplash, setMostrandoSplash] = useState(false);

  useEffect(() => {
    if (!mostrandoSplash) return undefined;

    const temporizador = window.setTimeout(() => setMostrandoSplash(false), 1800);
    return () => window.clearTimeout(temporizador);
  }, [mostrandoSplash]);

  useEffect(() => {
    const cerrarSesion = () => {
      clearApiSession();
      setSesion(null);
    };
    window.addEventListener('mca:unauthorized', cerrarSesion);
    return () => window.removeEventListener('mca:unauthorized', cerrarSesion);
  }, []);

  const handleLogin = (nuevaSesion) => {
    setApiSession(nuevaSesion);
    setSesion(nuevaSesion);
    setMostrandoSplash(true);
  };

  const handleLogout = () => {
    clearApiSession();
    setSesion(null);
  };

  if (!autenticado) {
    return <Login onLogin={handleLogin} />;
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
        { id: 'servicios', label: ' Servicios', icon: Wrench },
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
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", overflowX: 'hidden' }}>
      
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
          background: #facc15;
        }
      `}</style>

      {/* BARRA LATERAL */}
      <aside style={{ 
        width: '270px', 
        minWidth: '270px',
        backgroundColor: 'var(--bg-sidebar)', 
        borderRight: '1px solid var(--sidebar-border)', 
        padding: '24px 16px', 
        display: 'flex', 
        flexDirection: 'column', 
        justify: 'space-between',
        boxSizing: 'border-box',
        boxShadow: '4px 0 20px rgba(0,0,0,0.2)',
        zIndex: 10
      }}>
        <div>
          {/* Header del Logo */}
          <div style={{ padding: '0 8px', marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>⚡</span>
                <h1 style={{ color: '#facc15', fontSize: '20px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
                  Eléctricos MCA
                </h1>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--sidebar-muted)', letterSpacing: '1.2px', fontWeight: '700', display: 'block', marginTop: '4px', textTransform: 'uppercase' }}>
                Gestión Industrial
              </span>
            </div>

          </div>

          {/* Menú Organizado por Secciones */}
          <nav 
            className="sidebar-scroll"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '20px', 
              maxHeight: 'calc(100vh - 270px)', 
              overflowY: 'auto',
              paddingRight: '6px'
            }}
          >
            {menuGrupos.map((grupo, index) => (
              <div key={index}>
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: '700', 
                  color: 'var(--sidebar-muted)',
                  letterSpacing: '1px', 
                  padding: '0 12px 8px 12px', 
                  display: 'block' 
                }}>
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
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: activo ? 'var(--sidebar-active)' : 'transparent',
                          color: activo ? '#facc15' : 'var(--sidebar-text)',
                          fontWeight: activo ? '700' : '500',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '13px',
                          transition: 'all 0.2s ease',
                          borderLeft: activo ? '4px solid #facc15' : '4px solid transparent',
                          boxShadow: activo ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (!activo) {
                            e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
                            e.currentTarget.style.color = '#ffffff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!activo) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--sidebar-text)';
                          }
                        }}
                      >
                        <span style={{ width: '24px', display: 'flex', justifyContent: 'center', opacity: activo ? 1 : 0.8 }}>
                          <Icono size={24} strokeWidth={1.7} />
                        </span>
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Acciones Inferiores y Perfil */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '16px', borderTop: '1px solid var(--sidebar-border)' }}>
          

          {/* Tarjeta de Usuario Conectado */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            backgroundColor: 'var(--sidebar-user)', 
            padding: '10px 12px', 
            borderRadius: '8px',
            border: '1px solid var(--sidebar-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                backgroundColor: '#facc15', 
                color: '#0f172a', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 'bold', 
                fontSize: '12px' 
              }}>
                {(sesion?.usuario?.nombre || 'Administrador').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span style={{ color: 'var(--text-main)', fontSize: '12px', fontWeight: '600', display: 'block', lineHeight: 1.2 }}>{sesion?.usuario?.nombre || sesion?.usuario?.usuario}</span>
                <span style={{ color: 'var(--sidebar-muted)', fontSize: '10px', display: 'block' }}>{sesion?.usuario?.rol || 'Administrador'}</span>
              </div>
            </div>

            {/* Botón Salir */}
            <button 
              onClick={handleLogout}
              title="Cerrar Sesión"
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: '16px', 
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--sidebar-muted)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--sidebar-muted)';
              }}
            >
              <LogOut size={20} strokeWidth={1.7} />
            </button>
          </div>

        </div>
      </aside>

      {/* ÁREA DE CONTENIDO DINÁMICO */}
      <main style={{ flex: 1, backgroundColor: '#0f172a', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
        {seccionActual === 'panel' && <PanelControl />}
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
  );
}

export default Dashboard;
