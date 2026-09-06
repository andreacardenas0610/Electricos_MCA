import { useState } from 'react';
import { Login } from './Login';

// Importación de las vistas
import { PanelControl } from './PanelControl';
import { Materiales } from './Materiales';
import Cotizacion from './Cotizacion';
import AbonosVentas from './AbonosVentas';
import { CatalogoServicios } from './CatalogoServicios';
import { ProgramacionActividades } from './ProgramacionActividades';
import { GestionUsuarios } from './GestionUsuarios';
import { GestionRolesPermisos } from './GestionRolesPermisos';
import { Personal } from './Personal';

export function Dashboard() {
  const [autenticado, setAutenticado] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  const [seccionActual, setSeccionActual] = useState('panel');

  const handleLogin = () => {
    localStorage.setItem('isLoggedIn', 'true');
    setAutenticado(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setAutenticado(false);
  };

  if (!autenticado) {
    return <Login onLogin={handleLogin} />;
  }

  // Agrupación del menú por categorías
  const menuGrupos = [
    {
      titulo: 'GENERAL',
      items: [
        { id: 'panel', label: 'Panel de Control', icon: '🎛️' },
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
      ]
    },
    {
      titulo: 'ADMINISTRACIÓN',
      items: [
        { id: 'usuarios', label: 'Gestión Usuarios', icon: '👤' },
        { id: 'roles', label: 'Roles y Permisos', icon: '🛡️' },
        { id: 'personal', label: 'Personal', icon: '👷' },
      ]
    }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', backgroundColor: '#0f172a', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", overflowX: 'hidden' }}>
      
      {/* Inyección de estilos dinámicos para la barra de scroll personalizada */}
      <style>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 4px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: #334155;
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
        backgroundColor: '#1e293b', 
        borderRight: '1px solid #334155', 
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
              <span style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1.2px', fontWeight: '700', display: 'block', marginTop: '4px', textTransform: 'uppercase' }}>
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
                  color: '#64748b', 
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
                          backgroundColor: activo ? '#334155' : 'transparent',
                          color: activo ? '#facc15' : '#cbd5e1',
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
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.color = '#ffffff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!activo) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#cbd5e1';
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
          
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
            backgroundColor: '#0f172a', 
            padding: '10px 12px', 
            borderRadius: '8px',
            border: '1px solid #334155'
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
                <span style={{ color: '#f8fafc', fontSize: '12px', fontWeight: '600', display: 'block', lineHeight: 1.2 }}>Admin MCA</span>
                <span style={{ color: '#94a3b8', fontSize: '10px', display: 'block' }}>Administrador</span>
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
        {seccionActual === 'materiales' && <Materiales />}
        {seccionActual === 'servicios' && <CatalogoServicios />}
        {seccionActual === 'Cotizacion' && <Cotizacion />}
        {seccionActual === 'AbonosVentas' && <AbonosVentas />}
        {seccionActual === 'programacion' && <ProgramacionActividades />}
        {seccionActual === 'usuarios' && <GestionUsuarios />}
        {seccionActual === 'roles' && <GestionRolesPermisos />}
        {seccionActual === 'personal' && <Personal />}
      </main>

    </div>
  );
}

export default Dashboard;