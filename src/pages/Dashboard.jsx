import { useEffect, useState } from 'react';
import { Login } from './Login';
import { SplashScreen } from '../components/SplashScreen.jsx';

// Importación de las vistas
import { PanelControl } from './PanelControl';
import { Materiales } from './Materiales';
import Cotizacion from './Cotizacion';
import AbonosVentas from './AbonosVentas';
import { CatalogoServicios } from './CatalogoServicios';
import { ProgramacionActividades } from './ProgramacionActividades';
import { GestionUsuarios } from './GestionUsuarios';
import { GestionRolesPermisos } from './GestionRolesPermisos';
import { Clientes, GestionTerceros, OrdenesServicio } from './ModulosGestion';

export function Dashboard() {
  const [autenticado, setAutenticado] = useState(() => {
    return false;
  });

  const [seccionActual, setSeccionActual] = useState('panel');
  const [mostrandoSplash, setMostrandoSplash] = useState(false);

  useEffect(() => {
    if (!mostrandoSplash) return undefined;

    const temporizador = window.setTimeout(() => setMostrandoSplash(false), 1800);
    return () => window.clearTimeout(temporizador);
  }, [mostrandoSplash]);

  const handleLogin = () => {
    localStorage.setItem('isLoggedIn', 'true');
    setAutenticado(true);
    setMostrandoSplash(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setAutenticado(false);
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
        { id: 'panel', label: 'Panel de Control', icon: '🎛️' },
        { id: 'clientes', label: 'Clientes', icon: '🏢' },
        { id: 'terceros', label: 'Gestión de Terceros', icon: '🤝' },
      ]
    },
    {
      titulo: 'OPERACIONES',
      items: [
        { id: 'materiales', label: 'Materiales', icon: '📦' },
        { id: 'servicios', label: 'Catálogo Servicios', icon: '🛠️' },
        { id: 'Cotizacion', label: 'Cotizaciones', icon: '📋' },
        { id: 'AbonosVentas', label: 'Abonos y Ventas', icon: '💵' },
        { id: 'programacion', label: 'Programación', icon: '🗓️' },
        { id: 'ordenes', label: 'Órdenes de Servicio', icon: '🧾' },
      ]
    },
    {
      titulo: 'ADMINISTRACIÓN',
      items: [
        { id: 'usuarios', label: 'Gestión Usuarios', icon: '👤' },
        { id: 'roles', label: 'Gestión de Acceso', icon: '🛡️' },
       
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

            {/* Badge Status */}
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '4px', 
              padding: '4px 8px', 
              borderRadius: '12px', 
              backgroundColor: 'rgba(34, 197, 94, 0.15)', 
              color: '#4ade80', 
              fontSize: '10px', 
              fontWeight: '600',
              border: '1px solid rgba(34, 197, 94, 0.3)' 
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
              v1.0
            </span>
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
                        <span style={{ fontSize: '16px', opacity: activo ? 1 : 0.8 }}>{item.icon}</span>
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
          
          {/* Botón de Acción Principal */}
          <button style={{ 
            width: '100%', 
            padding: '11px 14px', 
            borderRadius: '8px', 
            border: 'none', 
            backgroundColor: '#facc15', 
            color: '#0f172a', 
            fontWeight: '700', 
            cursor: 'pointer', 
            fontSize: '13px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px',
            boxShadow: '0 4px 14px rgba(250, 204, 21, 0.25)',
            transition: 'transform 0.15s ease, background-color 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fde047'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#facc15'}
          >
            <span>✨</span> Nueva Venta
          </button>

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
                AD
              </div>
              <div>
                <span style={{ color: 'var(--text-main)', fontSize: '12px', fontWeight: '600', display: 'block', lineHeight: 1.2 }}>Admin MCA</span>
                <span style={{ color: 'var(--sidebar-muted)', fontSize: '10px', display: 'block' }}>Administrador</span>
              </div>
            </div>

            {/* Botón Salir */}
            <button 
              onClick={handleLogout}
              title="Cerrar Sesión"
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#ef4444', 
                cursor: 'pointer', 
                fontSize: '16px', 
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              🚪
            </button>
          </div>

        </div>
      </aside>

      {/* ÁREA DE CONTENIDO DINÁMICO */}
      <main style={{ flex: 1, backgroundColor: '#0f172a', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
        {seccionActual === 'panel' && <PanelControl />}
        {seccionActual === 'clientes' && <Clientes />}
        {seccionActual === 'terceros' && <GestionTerceros />}
        {seccionActual === 'materiales' && <Materiales />}
        {seccionActual === 'servicios' && <CatalogoServicios />}
        {seccionActual === 'Cotizacion' && <Cotizacion />}
        {seccionActual === 'AbonosVentas' && <AbonosVentas />}
        {seccionActual === 'programacion' && <ProgramacionActividades />}
        {seccionActual === 'ordenes' && <OrdenesServicio />}
        {seccionActual === 'usuarios' && <GestionUsuarios />}
        {seccionActual === 'roles' && <GestionRolesPermisos />}
       
      </main>

    </div>
  );
}

export default Dashboard;
