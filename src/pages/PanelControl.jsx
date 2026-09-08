import { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext';

export function PanelControl() {
  const [periodoGrafico, setPeriodoGrafico] = useState('1A');

  // Cargar el estado inicial guardado en localStorage (por defecto oscuro si no existe)
  const { theme: temaGlobal, toggleTheme } = useContext(ThemeContext);
  const esOscuro = temaGlobal === 'dark';

  // Guardar en localStorage cada vez que cambie 'esOscuro'
  useEffect(() => {
    localStorage.setItem('tema_panel', JSON.stringify(esOscuro));
  }, [esOscuro]);

  // Paleta de colores dinámica según el modo
  const tema = {
    bgPrincipal: esOscuro ? '#0b1329' : '#f8fafc',
    bgCard: esOscuro ? '#182642' : '#ffffff',
    bgHeader: esOscuro ? '#131f37' : '#ffffff',
    bgInput: esOscuro ? '#0f172a' : '#f1f5f9',
    bgBadge: esOscuro ? '#0f172a' : '#e2e8f0',
    border: esOscuro ? '#213459' : '#e2e8f0',
    borderSubtil: esOscuro ? '#1d2c4b' : '#f1f5f9',
    textoPrincipal: esOscuro ? '#ffffff' : '#0f172a',
    textoSecundario: esOscuro ? '#94a3b8' : '#64748b',
    textoMuted: esOscuro ? '#64748b' : '#94a3b8',
    primario: esOscuro ? '#facc15' : '#facc15',
    primarioTexto: esOscuro ? '#0f172a' : '#ffffff',
    barraGrafico: esOscuro ? '#c7d2fe' : '#93c5fd',
    iconoBg: esOscuro ? '#23385d' : '#f1f5f9'
  };

  return (
    <div style={{ 
      padding: '24px 32px', 
      backgroundColor: tema.bgPrincipal,
      color: tema.textoPrincipal, 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '20px', 
      width: '100%', 
      minHeight: '100vh',
      boxSizing: 'border-box',
      transition: 'all 0.3s ease'
    }}>
      
      {/* BARRA SUPERIOR DE BÚSQUEDA Y USUARIO */}
      <header style={{ 
        display: 'flex', 
        justify: 'space-between', 
        alignItems: 'center', 
        backgroundColor: tema.bgHeader, 
        padding: '12px 20px', 
        borderRadius: '10px', 
        border: `1px solid ${tema.border}`,
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: esOscuro ? 'none' : '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <span style={{ color: tema.textoMuted }}>🔍</span>
          <input 
            type="text" 
            placeholder="Buscar proyectos, cotizaciones o personal..." 
            style={{ 
              backgroundColor: 'transparent', 
              border: 'none', 
              color: tema.textoPrincipal, 
              outline: 'none', 
              width: '100%', 
              fontSize: '13px' 
            }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* BOTÓN CONMUTADOR MODO CLARO / OSCURO */}
          <button 
            onClick={toggleTheme}
            style={{
              backgroundColor: tema.bgBadge,
              border: `1px solid ${tema.border}`,
              color: tema.textoPrincipal,
              padding: '6px 12px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {esOscuro ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
          </button>

          <span style={{ cursor: 'pointer', color: tema.textoSecundario }}>🔔</span>
          <span style={{ cursor: 'pointer', color: tema.textoSecundario }}>❓</span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: `1px solid ${tema.border}`, paddingLeft: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Administrador</div>
              <div style={{ fontSize: '10px', color: tema.textoMuted }}>Perfil de Admin</div>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: tema.primario, overflow: 'hidden' }}>
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO EN REJILLA QUE OCUPA EL 100% DE ANCHO */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(0, 1fr) 320px', 
        gap: '20px', 
        width: '100%',
        boxSizing: 'border-box'
      }}>
        
        {/* COLUMNA IZQUIERDA: GRÁFICO + TABLA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          
          {/* CARD: GRÁFICO DE INGRESOS */}
          <div style={{ 
            backgroundColor: tema.bgCard, 
            border: `1px solid ${tema.border}`, 
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: esOscuro ? 'none' : '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', color: tema.textoSecundario, fontWeight: 'bold', letterSpacing: '0.5px' }}>
                  INGRESOS ANUALES TOTALES
                </span>
                <div style={{ fontSize: '32px', fontWeight: '800', color: tema.primario, marginTop: '4px' }}>
                  $12,493,407
                </div>
              </div>
              <div style={{ display: 'flex', backgroundColor: tema.bgInput, padding: '3px', borderRadius: '6px', border: `1px solid ${tema.border}` }}>
                {['1M', '6M', '1A'].map((p) => (
                  <button 
                    key={p}
                    onClick={() => setPeriodoGrafico(p)}
                    style={{ 
                      border: 'none', 
                      backgroundColor: periodoGrafico === p ? tema.primario : 'transparent', 
                      color: periodoGrafico === p ? tema.primarioTexto : tema.textoSecundario, 
                      fontWeight: 'bold', 
                      padding: '6px 12px', 
                      borderRadius: '4px', 
                      cursor: 'pointer', 
                      fontSize: '11px' 
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* BARRAS DEL GRÁFICO */}
            <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', gap: '12px', paddingTop: '20px', borderBottom: `1px solid ${tema.border}` }}>
              {[
                { alt: '35%' },
                { alt: '50%' },
                { alt: '40%' },
                { alt: '60%' },
                { alt: '52%' },
                { alt: '70%' },
                { alt: '64%' },
                { alt: '82%' },
                { alt: '88%' },
                { alt: '92%' },
                { alt: '100%', destacar: true }
              ].map((bar, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ 
                    width: '100%', 
                    height: bar.alt, 
                    backgroundColor: bar.destacar ? tema.primario : tema.barraGrafico, 
                    borderRadius: '3px 3px 0 0', 
                    opacity: bar.destacar ? 1 : 0.8 
                  }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', color: tema.textoMuted, fontWeight: 'bold' }}>
              <span>ENE</span>
              <span>MAR</span>
              <span>MAY</span>
              <span>JUL</span>
              <span>SEP</span>
              <span>NOV</span>
              <span style={{ color: tema.primario }}>ACTUAL</span>
            </div>
          </div>

          {/* CARD: ACTIVIDAD OPERATIVA RECIENTE */}
          <div style={{ 
            backgroundColor: tema.bgCard, 
            border: `1px solid ${tema.border}`, 
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: esOscuro ? 'none' : '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: tema.textoPrincipal }}>Actividad Operativa Reciente</h3>
              <span style={{ fontSize: '12px', color: tema.primario, cursor: 'pointer', fontWeight: 'bold' }}>Ver Todos los Logs</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: tema.textoMuted, borderBottom: `1px solid ${tema.border}`, fontSize: '10px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 4px' }}>EVENTO</th>
                  <th style={{ padding: '8px 4px' }}>PERSONAL</th>
                  <th style={{ padding: '8px 4px' }}>FECHA/HORA</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right' }}>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${tema.borderSubtil}` }}>
                  <td style={{ padding: '12px 4px' }}>
                    <div style={{ fontWeight: 'bold', color: tema.textoPrincipal }}>📦 Reposición de Stock</div>
                    <div style={{ fontSize: '10px', color: tema.textoMuted }}>Unidad Transformadora XT-400</div>
                  </td>
                  <td style={{ padding: '12px 4px', color: tema.textoSecundario }}>Carlos M.</td>
                  <td style={{ padding: '12px 4px', color: tema.textoSecundario }}>10:45 AM<br/><span style={{ fontSize: '10px', color: tema.textoMuted }}>Hoy</span></td>
                  <td style={{ padding: '12px 4px', textAlign: 'right' }}>
                    <span style={{ backgroundColor: esOscuro ? '#064e3b' : '#d1fae5', color: esOscuro ? '#6ee7b7' : '#047857', padding: '4px 8px', borderRadius: '12px', fontSize: '9px', fontWeight: 'bold' }}>COMPLETADO</span>
                  </td>
                </tr>

                <tr style={{ borderBottom: `1px solid ${tema.borderSubtil}` }}>
                  <td style={{ padding: '12px 4px' }}>
                    <div style={{ fontWeight: 'bold', color: tema.textoPrincipal }}>💰 Nueva Cotización Creada</div>
                    <div style={{ fontSize: '10px', color: tema.textoMuted }}>Complejo Industrial P-92</div>
                  </td>
                  <td style={{ padding: '12px 4px', color: tema.textoSecundario }}>S. Peterson</td>
                  <td style={{ padding: '12px 4px', color: tema.textoSecundario }}>09:12 AM<br/><span style={{ fontSize: '10px', color: tema.textoMuted }}>Hoy</span></td>
                  <td style={{ padding: '12px 4px', textAlign: 'right' }}>
                    <span style={{ backgroundColor: esOscuro ? '#1e3a8a' : '#dbeafe', color: esOscuro ? '#93c5fd' : '#1d4ed8', padding: '4px 8px', borderRadius: '12px', fontSize: '9px', fontWeight: 'bold' }}>BORRADOR</span>
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: '12px 4px' }}>
                    <div style={{ fontWeight: 'bold', color: tema.textoPrincipal }}>⚠️ Retraso en Mantenimiento</div>
                    <div style={{ fontSize: '10px', color: tema.textoMuted }}>Unidad de Flota #4</div>
                  </td>
                  <td style={{ padding: '12px 4px', color: tema.textoSecundario }}>Sistema</td>
                  <td style={{ padding: '12px 4px', color: tema.textoSecundario }}>Ayer</td>
                  <td style={{ padding: '12px 4px', textAlign: 'right' }}>
                    <span style={{ backgroundColor: esOscuro ? '#78350f' : '#fef3c7', color: esOscuro ? '#fde047' : '#b45309', padding: '4px 8px', borderRadius: '12px', fontSize: '9px', fontWeight: 'bold' }}>PENDIENTE</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        {/* COLUMNA DERECHA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ 
            backgroundColor: tema.bgCard, 
            border: `1px solid ${tema.border}`, 
            borderRadius: '12px', 
            padding: '24px', 
            display: 'flex', 
            flexDirection: 'column', 
            justify: 'space-between',
            boxShadow: esOscuro ? 'none' : '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: tema.textoPrincipal }}>Cotizaciones Pendientes</h3>
                  <span style={{ fontSize: '11px', color: tema.textoMuted }}>Pipeline esperando aprobación</span>
                </div>
                <div style={{ backgroundColor: tema.bgInput, padding: '8px', borderRadius: '8px' }}>📋</div>
              </div>

              <div style={{ fontSize: '36px', fontWeight: 'bold', color: tema.primario, margin: '16px 0 4px 0' }}>24</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: tema.textoPrincipal, marginBottom: '24px' }}>Est. $8,204,000</div>

              <div style={{ borderTop: `1px solid ${tema.border}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: tema.textoSecundario }}>Alta Prioridad</span>
                  <strong style={{ color: tema.primario }}>08</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: tema.textoSecundario }}>Por Vencer (72h)</span>
                  <strong style={{ color: tema.textoPrincipal }}>03</strong>
                </div>
              </div>
            </div>

            <button style={{ 
              width: '100%', 
              marginTop: '24px', 
              padding: '12px', 
              borderRadius: '8px', 
              border: 'none', 
              backgroundColor: tema.primario, 
              color: tema.primarioTexto, 
              fontWeight: 'bold', 
              cursor: 'pointer', 
              fontSize: '13px' 
            }}>
              Revisar Fila →
            </button>
          </div>

          <div style={{ 
            backgroundColor: tema.bgCard, 
            border: `1px solid ${tema.border}`, 
            borderRadius: '12px', 
            padding: '20px', 
            display: 'flex', 
            justify: 'space-between', 
            alignItems: 'center',
            boxShadow: esOscuro ? 'none' : '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: tema.textoSecundario, fontWeight: 'bold' }}>Proyectos Activos</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: tema.textoPrincipal, marginTop: '4px' }}>42</div>
            </div>
            <div style={{ backgroundColor: tema.iconoBg, padding: '12px', borderRadius: '8px' }}>🛠️</div>
          </div>

          <div style={{ 
            backgroundColor: tema.bgCard, 
            border: `1px solid ${tema.border}`, 
            borderRadius: '12px', 
            padding: '20px', 
            display: 'flex', 
            justify: 'space-between', 
            alignItems: 'center',
            boxShadow: esOscuro ? 'none' : '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: tema.textoSecundario, fontWeight: 'bold' }}>Eficiencia de Materiales</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: tema.textoPrincipal, marginTop: '4px' }}>94.8%</div>
            </div>
            <div style={{ backgroundColor: tema.primario, color: tema.primarioTexto, padding: '12px', borderRadius: '8px' }}>🏗️</div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default PanelControl;
