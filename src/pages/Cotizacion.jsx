import { useState } from 'react';
import { CrearCotizacion } from './CrearCotizacion';

export function Cotizaciones() {
  const [modoEdicion, setModoEdicion] = useState(false);
  const [esModoOscuro, setEsModoOscuro] = useState(false); // Estado para cambiar el tema

  // Si le damos clic a Generar Cotización, cambia la pantalla al formulario detallado
  if (modoEdicion) {
    return <CrearCotizacion onVolver={() => setModoEdicion(false)} esModoOscuro={esModoOscuro} />;
  }

  // Paleta de colores dinámica según el tema seleccionado
  const theme = {
    bg: esModoOscuro ? '#0b1329' : '#f8fafc',
    cardBg: esModoOscuro ? '#182642' : '#ffffff',
    inputBg: esModoOscuro ? '#0f172a' : '#f1f5f9',
    borderColor: esModoOscuro ? '#213459' : '#e2e8f0',
    inputBorder: esModoOscuro ? '#243556' : '#cbd5e1',
    textColor: esModoOscuro ? '#ffffff' : '#0f172a',
    subtextColor: esModoOscuro ? '#94a3b8' : '#64748b',
    labelColor: esModoOscuro ? '#64748b' : '#475569',
    badgeBg: esModoOscuro ? '#334155' : '#e2e8f0',
    badgeText: esModoOscuro ? '#ffffff' : '#334155',
    btnBg: esModoOscuro ? '#facc15' : '#eab308',
    btnText: esModoOscuro ? '#0f172a' : '#ffffff',
  };

  return (
    <div style={{ padding: '24px', color: theme.textColor, backgroundColor: theme.bg, minHeight: '100vh', width: '100%', boxSizing: 'border-box', transition: 'all 0.3s ease' }}>
      
      {/* ENCABEZADO SUPERIOR CON ALTERNADOR DE TEMA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
          Nueva Cotización Eléctrica{' '}
          <span style={{ backgroundColor: theme.badgeBg, color: theme.badgeText, padding: '2px 8px', borderRadius: '12px', fontSize: '10px' }}>
            Borrador
          </span>
        </div>

        {/* Botón para cambiar entre Modo Claro y Oscuro */}
        <button
          onClick={() => setEsModoOscuro(!esModoOscuro)}
          style={{
            backgroundColor: theme.cardBg,
            color: theme.textColor,
            border: `1px solid ${theme.borderColor}`,
            padding: '6px 12px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {esModoOscuro ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 2fr', gap: '20px' }}>
        
        {/* COLUMNA IZQUIERDA (ENCABEZADO + TOTALES) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.borderColor}`, borderRadius: '12px', padding: '20px', boxShadow: esModoOscuro ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Encabezado</h3>
              <span style={{ color: esModoOscuro ? '#facc15' : '#d97706', fontWeight: 'bold', fontSize: '13px' }}>#COT-2023-0084</span>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '10px', color: theme.labelColor, display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>FECHA DE EMISIÓN</label>
              <input type="text" defaultValue="10/27/2023" style={{ width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textColor, padding: '8px', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '10px', color: theme.labelColor, display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>CLIENTE</label>
              <select style={{ width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textColor, padding: '8px', borderRadius: '6px', boxSizing: 'border-box' }}>
                <option>Constructora Horizonte S.A.</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '10px', color: theme.labelColor, display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>DIRECCIÓN DEL PROYECTO</label>
              <textarea defaultValue="Av. Central 450, Edificio Mirador - Piso 4, Ciudad Empresarial." style={{ width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textColor, padding: '8px', borderRadius: '6px', boxSizing: 'border-box' }}></textarea>
            </div>

            <div>
              <label style={{ fontSize: '10px', color: theme.labelColor, display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>VALIDEZ (DÍAS)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="number" defaultValue="15" style={{ width: '60px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textColor, padding: '8px', borderRadius: '6px' }} />
                <span style={{ fontSize: '12px', color: theme.subtextColor }}>Días hábiles</span>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.borderColor}`, borderRadius: '12px', padding: '20px', boxShadow: esModoOscuro ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h4 style={{ margin: '0 0 12px 0' }}>Resumen de Totales</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: theme.subtextColor, marginBottom: '6px' }}>
              <span>Subtotal Servicios</span>
              <span style={{ color: theme.textColor, fontWeight: '500' }}>$ 1.250.000</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: theme.subtextColor, marginBottom: '20px' }}>
              <span>Subtotal Materiales</span>
              <span style={{ color: theme.textColor, fontWeight: '500' }}>$ 845.300</span>
            </div>

            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: theme.textColor }}>
              Total <span style={{ color: theme.textColor }}>$2.095.300</span>
            </div>

            {/* BOTÓN QUE ACTIVA LA SEGUNDA VISTA */}
            <button 
              onClick={() => setModoEdicion(true)} 
              style={{ width: '100%', backgroundColor: theme.btnBg, color: theme.btnText, border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              📄 GENERAR COTIZACIÓN
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA (TABLAS SIMPLES) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.borderColor}`, borderRadius: '12px', padding: '20px', boxShadow: esModoOscuro ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h4 style={{ margin: '0 0 12px 0' }}>Servicios y Mano de Obra</h4>
            {/* Contenido de la lista de servicios */}
          </div>
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.borderColor}`, borderRadius: '12px', padding: '20px', boxShadow: esModoOscuro ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h4 style={{ margin: '0 0 12px 0' }}>Materiales</h4>
            {/* Contenido de la lista de materiales */}
          </div>
        </div>

      </div>

    </div>
  );
}

export default Cotizaciones;