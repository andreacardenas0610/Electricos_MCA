import { useState, useEffect } from 'react';

export function PanelControl() {
  const [periodoGrafico, setPeriodoGrafico] = useState('1A');
  const [mostrarModal, setMostrarModal] = useState(false);

  // Estados iniciales de las actividades
  const [actividades, setActividades] = useState([
    {
      id: 1,
      evento: 'Reposición de Stock',
      subtexto: 'Unidad Transformadora XT-400',
      icono: '📦',
      personal: 'Carlos M.',
      hora: '10:45 AM',
      fecha: 'Hoy',
      estado: 'Completado', // Valores posibles: 'Completado' | 'Pendiente' | 'Finalizado'
    },
    {
      id: 2,
      evento: 'Nueva Cotización Creada',
      subtexto: 'Complejo Industrial P-92',
      icono: '💰',
      personal: 'S. Peterson',
      hora: '09:12 AM',
      fecha: 'Hoy',
      estado: 'Pendiente',
    },
    {
      id: 3,
      evento: 'Retraso en Mantenimiento',
      subtexto: 'Unidad de Flota #4',
      icono: '⚠️',
      personal: 'Sistema',
      hora: '',
      fecha: 'Ayer',
      estado: 'Finalizado',
    },
    {
      id: 4,
      evento: 'Inspección de Equipos',
      subtexto: 'Planta Principal',
      icono: '🔍',
      personal: 'M. López',
      hora: '08:30 AM',
      fecha: 'Hoy',
      estado: 'Completado',
    }
  ]);

  // Rotación cíclica de estados: Completado -> Pendiente -> Finalizado -> Completado
  const cambiarEstado = (id) => {
    setActividades(prev => prev.map(item => {
      if (item.id === id) {
        const siguiente = 
          item.estado === 'Completado' ? 'Pendiente' : 
          item.estado === 'Pendiente' ? 'Finalizado' : 'Completado';
        return { ...item, estado: siguiente };
      }
      return item;
    }));
  };

  // Mapeo de estilos y posición exacta del círculo según el estado
  const estilosEstado = {
    'Completado': {
      bg: '#e6f7ea',
      texto: '#1b5e20',
      posicionCirculo: '4px' // Extremo izquierdo
    },
    'Pendiente': {
      bg: '#fef3d6',
      texto: '#8c4a00',
      posicionCirculo: '42px' // Centro
    },
    'Finalizado': {
      bg: '#fde8e8',
      texto: '#991b1b',
      posicionCirculo: '80px' // Extremo derecho
    }
  };

  // Persistencia de tema claro/oscuro
  const [esOscuro, setEsOscuro] = useState(() => {
    try {
      const temaGuardado = localStorage.getItem('tema_panel');
      return temaGuardado !== null ? JSON.parse(temaGuardado) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    localStorage.setItem('tema_panel', JSON.stringify(esOscuro));
  }, [esOscuro]);

  // Configuración de paleta según tema
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
    primario: '#facc15',
    primarioTexto: '#0f172a',
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
      
      {/* BARRA SUPERIOR */}
      <header style={{ 
        display: 'flex', 
        justify: 'space-between', 
        alignItems: 'center', 
        backgroundColor: tema.bgHeader, 
        padding: '12px 20px', 
        borderRadius: '10px', 
        border: `1px solid ${tema.border}`,
        width: '100%',
        boxSizing: 'border-box'
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
          <button 
            onClick={() => setEsOscuro(!esOscuro)}
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

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(0, 1fr) 320px', 
        gap: '20px', 
        width: '100%',
        boxSizing: 'border-box'
      }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          
          {/* GRÁFICO DE INGRESOS */}
          <div style={{ 
            backgroundColor: tema.bgCard, 
            border: `1px solid ${tema.border}`, 
            borderRadius: '12px', 
            padding: '24px'
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
            
            <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', gap: '12px', paddingTop: '20px', borderBottom: `1px solid ${tema.border}` }}>
              {[
                { alt: '35%' }, { alt: '50%' }, { alt: '40%' }, { alt: '60%' },
                { alt: '52%' }, { alt: '70%' }, { alt: '64%' }, { alt: '82%' },
                { alt: '88%' }, { alt: '92%' }, { alt: '100%', destacar: true }
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
              <span>ENE</span><span>MAR</span><span>MAY</span><span>JUL</span><span>SEP</span><span>NOV</span>
              <span style={{ color: tema.primario }}>ACTUAL</span>
            </div>
          </div>

          {/* TABLA DE ACTIVIDADES CON TOGGLE FUNCIONAL */}
          <div style={{ 
            backgroundColor: tema.bgCard, 
            border: `1px solid ${tema.border}`, 
            borderRadius: '12px', 
            padding: '24px'
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
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {actividades.map((item, idx) => {
                  const infoEst = estilosEstado[item.estado] || estilosEstado['Completado'];

                  return (
                    <tr key={item.id} style={{ borderBottom: idx !== actividades.length - 1 ? `1px solid ${tema.borderSubtil}` : 'none' }}>
                      <td style={{ padding: '12px 4px' }}>
                        <div style={{ fontWeight: 'bold', color: tema.textoPrincipal }}>{item.icono} {item.evento}</div>
                        <div style={{ fontSize: '10px', color: tema.textoMuted }}>{item.subtexto}</div>
                      </td>
                      <td style={{ padding: '12px 4px', color: tema.textoSecundario }}>{item.personal}</td>
                      <td style={{ padding: '12px 4px', color: tema.textoSecundario }}>
                        {item.hora && <>{item.hora}<br/></>}
                        <span style={{ fontSize: '10px', color: tema.textoMuted }}>{item.fecha}</span>
                      </td>
                      <td style={{ padding: '12px 4px', textAlign: 'center' }}>
                        
                        {/* BOTÓN TOGGLE */}
                        <div
                          onClick={() => cambiarEstado(item.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            position: 'relative',
                            width: '110px',
                            height: '32px',
                            backgroundColor: infoEst.bg,
                            borderRadius: '16px',
                            padding: '3px 5px',
                            cursor: 'pointer',
                            userSelect: 'none',
                            boxSizing: 'border-box',
                            transition: 'background-color 0.3s ease'
                          }}
                        >
                          {/* Círculo deslizable */}
                          <span
                            style={{
                              position: 'absolute',
                              top: '3px',
                              left: infoEst.posicionCirculo,
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              backgroundColor: '#ffffff',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              zIndex: 2
                            }}
                          />

                          {/* Etiqueta de texto */}
                          <span
                            style={{
                              width: '100%',
                              textAlign: 'center',
                              color: infoEst.texto,
                              fontWeight: '700',
                              fontSize: '11px',
                              zIndex: 1
                            }}
                          >
                            {item.estado}
                          </span>
                        </div>

                      </td>
                    </tr>
                  );
                })}
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
            justify: 'space-between'
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

            <button 
              onClick={() => setMostrarModal(true)}
              style={{ 
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
              }}
            >
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
            alignItems: 'center'
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
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: tema.textoSecundario, fontWeight: 'bold' }}>Eficiencia de Materiales</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: tema.textoPrincipal, marginTop: '4px' }}>94.8%</div>
            </div>
            <div style={{ backgroundColor: tema.primario, color: tema.primarioTexto, padding: '12px', borderRadius: '8px' }}>🏗️</div>
          </div>

        </div>

      </div>

      {/* MODAL */}
      {mostrarModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(11, 19, 41, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: tema.bgCard,
            border: `1px solid ${tema.border}`,
            borderRadius: '12px',
            width: '550px',
            maxWidth: '90%',
            padding: '24px',
            color: tema.textoPrincipal
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${tema.border}`, paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>📋 Fila de Cotizaciones Pendientes</h3>
              <button 
                onClick={() => setMostrarModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: tema.textoSecundario }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: tema.textoSecundario, margin: '16px 0' }}>
              Hay <strong style={{ color: tema.primario }}>24 cotizaciones</strong> pendientes por un total estimado de <strong>$8,204,000</strong>.
            </p>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setMostrarModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: `1px solid ${tema.border}`,
                  backgroundColor: tema.bgInput,
                  color: tema.textoPrincipal,
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
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

export default PanelControl;