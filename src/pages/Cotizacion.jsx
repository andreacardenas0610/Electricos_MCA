import { useState } from 'react';
import { CrearCotizacion } from './CrearCotizacion';

export function Cotizaciones() {
  const [modoEdicion, setModoEdicion] = useState(false);
  const [esModoOscuro, setEsModoOscuro] = useState(false);

  // Estados dinámicos para Servicios y Materiales (Coinciden con $1.250.000 y $845.300)
  const [servicios, setServicios] = useState([
    { id: 1, descripcion: 'Instalación de Tablero Eléctrico Principal', horas: 10, tarifaHora: 80000, total: 800000 },
    { id: 2, descripcion: 'Cableado y Conexión de Iluminación', horas: 6, tarifaHora: 75000, total: 450000 }
  ]);

  const [materiales, setMateriales] = useState([
    { id: 1, nombre: 'Cable Cobre THHN #12 (Rollo 100m)', cantidad: 2, precioUnitario: 220000, total: 440000 },
    { id: 2, nombre: 'Interruptor Termomagnético 20A', cantidad: 5, precioUnitario: 45000, total: 225000 },
    { id: 3, nombre: 'Caja de Paso Metálica 20x20', cantidad: 3, precioUnitario: 60100, total: 180300 }
  ]);

  // Cálculos dinámicos
  const subtotalServicios = servicios.reduce((acc, item) => acc + item.total, 0);
  const subtotalMateriales = materiales.reduce((acc, item) => acc + item.total, 0);
  const totalCotizacion = subtotalServicios + subtotalMateriales;

  // Modificadores de listas
  const agregarServicio = () => {
    setServicios([...servicios, { id: Date.now(), descripcion: 'Nuevo Servicio', horas: 1, tarifaHora: 50000, total: 50000 }]);
  };

  const agregarMaterial = () => {
    setMateriales([...materiales, { id: Date.now(), nombre: 'Nuevo Material', cantidad: 1, precioUnitario: 10000, total: 10000 }]);
  };

  const eliminarServicio = (id) => setServicios(servicios.filter(s => s.id !== id));
  const eliminarMaterial = (id) => setMateriales(materiales.filter(m => m.id !== id));

  const formatearCOP = (valor) => '$ ' + valor.toLocaleString('es-CO');

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
        <div style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Nueva Cotización Eléctrica{' '}
          <span style={{ backgroundColor: theme.badgeBg, color: theme.badgeText, padding: '2px 8px', borderRadius: '12px', fontSize: '10px' }}>
            Borrador
          </span>
        </div>

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

      <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: '20px', alignItems: 'start' }}>
        
        {/* COLUMNA IZQUIERDA (ENCABEZADO + TOTALES) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* ENCABEZADO */}
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.borderColor}`, borderRadius: '12px', padding: '20px', boxShadow: esModoOscuro ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>Encabezado</h3>
              <span style={{ color: esModoOscuro ? '#facc15' : '#d97706', fontWeight: 'bold', fontSize: '13px' }}>#COT-2023-0084</span>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '10px', color: theme.labelColor, display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>FECHA DE EMISIÓN</label>
              <input type="date" defaultValue="2023-10-27" style={{ width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textColor, padding: '8px', borderRadius: '6px', boxSizing: 'border-box', fontSize: '12px' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '10px', color: theme.labelColor, display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>CLIENTE</label>
              <select style={{ width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textColor, padding: '8px', borderRadius: '6px', boxSizing: 'border-box', fontSize: '12px' }}>
                <option>Constructora Horizonte S.A.</option>
                <option>Industrias Alfa S.A.</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '10px', color: theme.labelColor, display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>DIRECCIÓN DEL PROYECTO</label>
              <textarea defaultValue="Av. Central 450, Edificio Mirador - Piso 4, Ciudad Empresarial." rows="3" style={{ width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textColor, padding: '8px', borderRadius: '6px', boxSizing: 'border-box', fontSize: '12px', fontFamily: 'inherit' }}></textarea>
            </div>

            <div>
              <label style={{ fontSize: '10px', color: theme.labelColor, display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>VALIDEZ (DÍAS)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="number" defaultValue="15" style={{ width: '60px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textColor, padding: '8px', borderRadius: '6px', fontSize: '12px' }} />
                <span style={{ fontSize: '12px', color: theme.subtextColor }}>Días hábiles</span>
              </div>
            </div>
          </div>

          {/* RESUMEN DE TOTALES */}
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.borderColor}`, borderRadius: '12px', padding: '20px', boxShadow: esModoOscuro ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Resumen de Totales</h4>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: theme.subtextColor, marginBottom: '6px' }}>
              <span>Subtotal Servicios</span>
              <span style={{ color: theme.textColor, fontWeight: 'bold' }}>{formatearCOP(subtotalServicios)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: theme.subtextColor, marginBottom: '16px' }}>
              <span>Subtotal Materiales</span>
              <span style={{ color: theme.textColor, fontWeight: 'bold' }}>{formatearCOP(subtotalMateriales)}</span>
            </div>

            <div style={{ borderTop: `1px solid ${theme.borderColor}`, paddingTop: '12px', fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: theme.textColor }}>
              Total {formatearCOP(totalCotizacion)}
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

        {/* COLUMNA DERECHA (TABLAS CON INFORMACIÓN) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* TABLA DE SERVICIOS */}
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.borderColor}`, borderRadius: '12px', padding: '20px', boxShadow: esModoOscuro ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '15px' }}>Servicios y Mano de Obra</h4>
              <button onClick={agregarServicio} style={{ backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textColor, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                + Agregar Servicio
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: theme.subtextColor, borderBottom: `1px solid ${theme.borderColor}`, fontSize: '10px' }}>
                  <th style={{ padding: '8px 4px' }}>DESCRIPCIÓN</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center', width: '60px' }}>HORAS</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right', width: '100px' }}>TARIFA</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right', width: '100px' }}>TOTAL</th>
                  <th style={{ padding: '8px 4px', width: '30px' }}></th>
                </tr>
              </thead>
              <tbody>
                {servicios.map((s) => (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${theme.borderColor}` }}>
                    <td style={{ padding: '8px 4px' }}>
                      <input 
                        type="text" 
                        value={s.descripcion} 
                        onChange={(e) => setServicios(servicios.map(item => item.id === s.id ? { ...item, descripcion: e.target.value } : item))}
                        style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: theme.textColor, fontSize: '12px', outline: 'none' }}
                      />
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                      <input 
                        type="number" 
                        value={s.horas} 
                        onChange={(e) => {
                          const h = parseFloat(e.target.value) || 0;
                          setServicios(servicios.map(item => item.id === s.id ? { ...item, horas: h, total: h * item.tarifaHora } : item));
                        }}
                        style={{ width: '45px', textAlign: 'center', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textColor, borderRadius: '4px', fontSize: '11px' }}
                      />
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                      <input 
                        type="number" 
                        value={s.tarifaHora} 
                        onChange={(e) => {
                          const t = parseFloat(e.target.value) || 0;
                          setServicios(servicios.map(item => item.id === s.id ? { ...item, tarifaHora: t, total: item.horas * t } : item));
                        }}
                        style={{ width: '80px', textAlign: 'right', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textColor, borderRadius: '4px', fontSize: '11px' }}
                      />
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold' }}>{formatearCOP(s.total)}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                      <button onClick={() => eliminarServicio(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '12px' }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TABLA DE MATERIALES */}
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.borderColor}`, borderRadius: '12px', padding: '20px', boxShadow: esModoOscuro ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '15px' }}>Materiales</h4>
              <button onClick={agregarMaterial} style={{ backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textColor, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                + Agregar Material
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: theme.subtextColor, borderBottom: `1px solid ${theme.borderColor}`, fontSize: '10px' }}>
                  <th style={{ padding: '8px 4px' }}>NOMBRE DEL MATERIAL</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center', width: '60px' }}>CANT.</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right', width: '100px' }}>P. UNITARIO</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right', width: '100px' }}>TOTAL</th>
                  <th style={{ padding: '8px 4px', width: '30px' }}></th>
                </tr>
              </thead>
              <tbody>
                {materiales.map((m) => (
                  <tr key={m.id} style={{ borderBottom: `1px solid ${theme.borderColor}` }}>
                    <td style={{ padding: '8px 4px' }}>
                      <input 
                        type="text" 
                        value={m.nombre} 
                        onChange={(e) => setMateriales(materiales.map(item => item.id === m.id ? { ...item, nombre: e.target.value } : item))}
                        style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: theme.textColor, fontSize: '12px', outline: 'none' }}
                      />
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                      <input 
                        type="number" 
                        value={m.cantidad} 
                        onChange={(e) => {
                          const c = parseFloat(e.target.value) || 0;
                          setMateriales(materiales.map(item => item.id === m.id ? { ...item, cantidad: c, total: c * item.precioUnitario } : item));
                        }}
                        style={{ width: '45px', textAlign: 'center', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textColor, borderRadius: '4px', fontSize: '11px' }}
                      />
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                      <input 
                        type="number" 
                        value={m.precioUnitario} 
                        onChange={(e) => {
                          const p = parseFloat(e.target.value) || 0;
                          setMateriales(materiales.map(item => item.id === m.id ? { ...item, precioUnitario: p, total: item.cantidad * p } : item));
                        }}
                        style={{ width: '80px', textAlign: 'right', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textColor, borderRadius: '4px', fontSize: '11px' }}
                      />
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold' }}>{formatearCOP(m.total)}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                      <button onClick={() => eliminarMaterial(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '12px' }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Cotizaciones;