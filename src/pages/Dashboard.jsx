import { useState } from 'react';
import { PanelControl } from './PanelControl';
import { Materiales } from './Materiales';
import Cotizacion from './Cotizacion';
import AbonosVentas from './AbonosVentas';

export function Dashboard() {
  const [seccionActual, setSeccionActual] = useState('panel');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', backgroundColor: '#0f172a', fontFamily: 'sans-serif', overflowX: 'hidden' }}>
      
      {/* SIDEBAR FIJO */}
      <aside style={{ 
        width: '260px', 
        minWidth: '260px',
        backgroundColor: '#1b2a47', 
        borderRight: '1px solid #243556', 
        padding: '32px 24px 24px 24px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        boxSizing: 'border-box'
      }}>
        <div>
          {/* Logo / Marca */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ color: '#facc15', fontSize: '24px', fontWeight: 'bold', margin: 0, lineHeight: '1.2', letterSpacing: '-0.5px' }}>
              Eléctricos<br />MCA
            </h1>
            <span style={{ fontSize: '11px', color: '#8899ac', letterSpacing: '1.5px', fontWeight: '600', display: 'block', marginTop: '6px' }}>
              GESTIÓN INDUSTRIAL
            </span>
          </div>

          {/* Menú de Navegación */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => setSeccionActual('panel')} 
              style={btnStyle(seccionActual === 'panel')}
            >
              <span style={{ fontSize: '18px' }}>🎛️</span> Panel de Control
            </button>

            <button 
              onClick={() => setSeccionActual('materiales')} 
              style={btnStyle(seccionActual === 'materiales')}
            >
              <span style={{ fontSize: '18px' }}>📦</span> Materiales
            </button>

            <button 
              onClick={() => setSeccionActual('Cotizacion')} 
              style={btnStyle(seccionActual === 'Cotizacion')}
            >
              <span style={{ fontSize: '18px' }}>📋</span> Cotización
            </button>


             <button 
              onClick={() => setSeccionActual('AbonosVentas')} 
              style={btnStyle(seccionActual === 'AbonosVentas')}
            >
              <span style={{ fontSize: '18px' }}>💵</span> Abonos y Ventas
            </button>
          </nav>
        </div>


        {/* Botón Inferior y Configuración */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button style={{ 
            width: '100%', 
            padding: '14px', 
            borderRadius: '10px', 
            border: 'none', 
            backgroundColor: '#facc15', 
            color: '#0f172a', 
            fontWeight: 'bold', 
            cursor: 'pointer', 
            fontSize: '14px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px',
            boxShadow: '0 4px 12px rgba(250, 204, 21, 0.2)'
          }}>
            <span>➕</span> Nueva Venta
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '16px', borderTop: '1px solid #243556' }}>
            <button style={{ background: 'none', border: 'none', color: '#94a3b8', textAlign: 'left', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
              ⚙️ Configuración
            </button>
            <button style={{ background: 'none', border: 'none', color: '#94a3b8', textAlign: 'left', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main style={{ flex: 1, backgroundColor: '#0f172a', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
        {seccionActual === 'panel' && <PanelControl />}
        {seccionActual === 'materiales' && <Materiales />}
        {seccionActual === 'Cotizacion' && <Cotizacion />}
        {seccionActual === 'AbonosVentas' && <AbonosVentas />}
      </main>

    </div>
  );
}

// Estilos dinámicos para los botones
const btnStyle = (activo) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  width: '100%',
  padding: '14px 16px',
  borderRadius: '10px',
  border: 'none',
  backgroundColor: activo ? '#23385d' : 'transparent',
  color: activo ? '#facc15' : '#a0aec0',
  fontWeight: activo ? 'bold' : '500',
  cursor: 'pointer',
  textAlign: 'left',
  fontSize: '14px',
  transition: 'all 0.2s ease'
});

export default Dashboard;