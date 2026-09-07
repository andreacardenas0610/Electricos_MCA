import React, { useState } from 'react';

export function CatalogoServicios() {
  // CONTROL DE TEMA (oscuro / claro)
  const [esOscuro, setEsOscuro] = useState(false);

  // FILTRO ACTIVO DE CATEGORÍA
  const [filtroActivo, setFiltroActivo] = useState('Todos');

  // BÚSQUEDA
  const [busqueda, setBusqueda] = useState('');

  // LISTADO DE SERVICIOS
  const [servicios, setServicios] = useState([
    {
      id: 1,
      codigo: 'ELEC-001',
      nombre: 'Instalación de Tablero Trifásico',
      descripcion: 'Montaje, cableado y...',
      categoria: 'Instalación',
      unidad: 'Proyecto',
      precio: 850.00,
      tiempo: '2 Días',
      estado: 'Activo',
    },
    {
      id: 2,
      codigo: 'ELEC-002',
      nombre: 'Mantenimiento Preventivo',
      descripcion: 'Limpieza, reajuste de...',
      categoria: 'Mantenimiento',
      unidad: 'Hora',
      precio: 65.00,
      tiempo: '4 Horas',
      estado: 'Activo',
    },
    {
      id: 3,
      codigo: 'ELEC-003',
      nombre: 'Medición de Pozo a Tierra',
      descripcion: 'Certificación con...',
      categoria: 'Protocolos',
      unidad: 'Punto',
      precio: 120.00,
      tiempo: '1 Día',
      estado: 'Activo',
    },
    {
      id: 4,
      codigo: 'ELEC-004',
      nombre: 'Instalación Luminarias LED',
      descripcion: 'Colocación de paneles...',
      categoria: 'Instalación',
      unidad: 'Punto',
      precio: 18.00,
      tiempo: 'Inmediato',
      estado: 'Pausado',
    },
  ]);

  // PALETA DINÁMICA DE COLORES
  const theme = {
    bgApp: esOscuro ? '#0b1329' : '#f8fafc',
    bgSidebar: esOscuro ? '#0e1830' : '#e8eef3',
    bgCard: esOscuro ? '#111c38' : '#ffffff',
    bgInner: esOscuro ? '#0b1329' : '#f1f5f9',
    border: esOscuro ? '#1e2d4a' : '#e2e8f0',
    textMain: esOscuro ? '#ffffff' : '#0f172a',
    textSub: esOscuro ? '#94a3b8' : '#64748b',
    textMuted: esOscuro ? '#64748b' : '#94a3b8',
    inputBg: esOscuro ? '#0b1329' : '#ffffff',
  };

  // FILTRADO DE SERVICIOS
  const serviciosFiltrados = servicios.filter((s) => {
    const coincideFiltro = filtroActivo === 'Todos' || s.categoria === filtroActivo;
    const coincideBusqueda =
      s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.codigo.toLowerCase().includes(busqueda.toLowerCase());
    return coincideFiltro && coincideBusqueda;
  });

  return (
    <div style={{ ...styles.appWrapper, backgroundColor: theme.bgApp, color: theme.textMain }}>
      

      {/* CONTENIDO PRINCIPAL */}
      <main style={styles.mainContainer}>
        {/* BARRA SUPERIOR DE BÚSQUEDA Y ACCIONES */}
        <header style={styles.topBar}>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="🔍 Buscar servicios eléctricos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ ...styles.topSearchInput, backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.textMain }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button style={styles.btnCrearDocumento}>Crear Nuevo Documento</button>
            <button
              onClick={() => setEsOscuro(!esOscuro)}
              style={{ ...styles.btnThemeToggle, backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.textMain }}
              title="Cambiar tema"
            >
              {esOscuro ? '☀️ Claro' : '🌙 Oscuro'}
            </button>
            <span style={{ cursor: 'pointer' }}>🔔</span>
            <span style={{ cursor: 'pointer' }}>❓</span>
            <div style={{ ...styles.userAvatar, backgroundColor: theme.border }}>👤</div>
          </div>
        </header>

        {/* HEADER DE SECCIÓN */}
        <div style={styles.headerSection}>
          <div>
            <h1 style={styles.pageTitle}>Servicios Eléctricos</h1>
            <p style={{ ...styles.pageSubtitle, color: theme.textSub }}>
              Gestione las partidas, instalaciones y mantenimientos eléctricos.
            </p>
          </div>
          <button style={styles.btnAgregarServicio}>➕ Agregar Servicio</button>
        </div>

        {/* METRICAS / METRICS CARDS (GRID 4 COLUMNAS) */}
        <div style={styles.metricsGrid}>
          {/* CARD 1 */}
          <div style={{ ...styles.metricCard, backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div style={{ ...styles.metricLabel, color: theme.textMuted }}>PARTIDAS ACTIVAS</div>
            <div style={styles.metricValue}>38</div>
            <div style={{ fontSize: '10px', color: '#16a34a', marginTop: '4px' }}>⚡ +5 nuevas este mes</div>
          </div>

          {/* CARD 2 */}
          <div style={{ ...styles.metricCard, backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div style={{ ...styles.metricLabel, color: theme.textMuted }}>TIPO MÁS SOLICITADO</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Instalación</div>
            <div style={{ fontSize: '10px', color: theme.textSub, marginTop: '4px' }}>42% del volumen total</div>
          </div>

          {/* CARD 3 */}
          <div style={{ ...styles.metricCard, backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div style={{ ...styles.metricLabel, color: theme.textMuted }}>COSTO PROMEDIO PUNTO</div>
            <div style={styles.metricValue}>$45.00</div>
            <div style={{ fontSize: '10px', color: theme.textSub, marginTop: '4px' }}>Actualizado hace 2 días</div>
          </div>

          {/* CARD 4 */}
          <div style={{ ...styles.metricCard, backgroundColor: theme.bgCard, borderColor: theme.border, position: 'relative' }}>
            <div style={{ ...styles.metricLabel, color: theme.textMuted }}>CERTIFICACIONES VIGENTES</div>
            <div style={styles.metricValue}>100%</div>
            <div style={styles.progressBarBg}>
              <div style={styles.progressBarFill} />
            </div>
            <span style={{ position: 'absolute', right: '14px', bottom: '14px', fontSize: '16px' }}>🛡️</span>
          </div>
        </div>

        {/* CONTENEDOR DE TABLA DE SERVICIOS */}
        <div style={{ ...styles.tableCard, backgroundColor: theme.bgCard, borderColor: theme.border }}>
          {/* FILTROS Y BUSQUEDA */}
          <div style={styles.filtersBar}>
            <div style={styles.tabsContainer}>
              {['Todos', 'Instalación', 'Mantenimiento', 'Protocolos'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFiltroActivo(tab)}
                  style={{
                    ...styles.tabButton,
                    backgroundColor: filtroActivo === tab ? '#0b1329' : 'transparent',
                    color: filtroActivo === tab ? '#ffffff' : theme.textSub,
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ ...styles.btnIconFilter, backgroundColor: theme.bgInner, borderColor: theme.border }}>🎛️</button>
              <button style={{ ...styles.btnIconFilter, backgroundColor: theme.bgInner, borderColor: theme.border }}>☰</button>
            </div>
          </div>

          {/* TABLA DE DATOS */}
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border }}>CÓDIGO</th>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border }}>NOMBRE DEL SERVICIO</th>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border }}>UNIDAD DE MEDIDA</th>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border }}>PRECIO BASE</th>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border }}>TIEMPO ESTIMADO</th>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border }}>ESTADO</th>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border, textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {serviciosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td style={{ ...styles.td, borderColor: theme.border }}>
                    <div style={styles.badgeCodigo}>{item.codigo}</div>
                  </td>
                  <td style={{ ...styles.td, borderColor: theme.border }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{item.nombre}</div>
                    <div style={{ fontSize: '10px', color: theme.textSub }}>{item.descripcion}</div>
                  </td>
                  <td style={{ ...styles.td, borderColor: theme.border }}>
                    <span style={{ ...styles.badgeUnidad, backgroundColor: theme.bgInner, color: theme.textSub }}>
                      {item.unidad}
                    </span>
                  </td>
                  <td style={{ ...styles.td, borderColor: theme.border }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px' }}>${item.precio.toFixed(2)}</div>
                    <div style={{ fontSize: '9px', color: theme.textSub }}>USD / {item.unidad.toUpperCase()}</div>
                  </td>
                  <td style={{ ...styles.td, borderColor: theme.border, color: theme.textSub }}>
                    ⏱️ {item.tiempo}
                  </td>
                  <td style={{ ...styles.td, borderColor: theme.border }}>
                    <span
                      style={
                        item.estado === 'Activo'
                          ? styles.badgeEstadoActivo
                          : styles.badgeEstadoPausado
                      }
                    >
                      ● {item.estado}
                    </span>
                  </td>
                  <td style={{ ...styles.td, borderColor: theme.border, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button style={styles.btnActionIcon} title="Ver detalles">👁️</button>
                      <button style={styles.btnActionIcon} title="Editar">✏️</button>
                      <button style={styles.btnActionIcon} title="Eliminar">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PAGINACIÓN DE LA TABLA */}
          <div style={{ ...styles.paginationBar, color: theme.textSub }}>
            <span>Mostrando {serviciosFiltrados.length} de 38 servicios</span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button style={styles.btnPage}>&lt;</button>
              <button style={{ ...styles.btnPage, ...styles.btnPageActive }}>1</button>
              <button style={styles.btnPage}>2</button>
              <button style={styles.btnPage}>3</button>
              <button style={styles.btnPage}>&gt;</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ESTILOS EN OBJETO JAVASCRIPT
const styles = {
  appWrapper: { display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif', transition: 'background-color 0.2s, color 0.2s' },
  sidebar: { width: '220px', borderRight: '1px solid', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  brandTitle: { fontSize: '15px', fontWeight: 'bold', color: '#facc15' },
  brandSubtitle: { fontSize: '9px', marginBottom: '24px' },
  navList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  navItem: { padding: '8px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' },
  navItemActive: { backgroundColor: '#1e2d4a', color: '#facc15', fontWeight: 'bold' },
  btnNuevaVenta: { backgroundColor: '#facc15', border: 'none', width: '100%', padding: '10px', borderRadius: '6px', fontWeight: 'bold', color: '#0b1329', cursor: 'pointer', fontSize: '12px', marginBottom: '16px' },
  sidebarFooter: { borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' },
  mainContainer: { flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '16px' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  searchContainer: { width: '380px' },
  topSearchInput: { border: '1px solid', padding: '8px 14px', borderRadius: '6px', width: '100%', outline: 'none', fontSize: '12px', boxSizing: 'border-box' },
  btnCrearDocumento: { backgroundColor: '#fde047', border: 'none', color: '#0b1329', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' },
  btnThemeToggle: { border: '1px solid', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
  userAvatar: { width: '30px', height: '30px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  headerSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { margin: 0, fontSize: '20px', fontWeight: 'bold' },
  pageSubtitle: { margin: '2px 0 0 0', fontSize: '11px' },
  btnAgregarServicio: { backgroundColor: '#facc15', border: 'none', color: '#0b1329', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' },
  metricCard: { border: '1px solid', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column' },
  metricLabel: { fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.5px' },
  metricValue: { fontSize: '22px', fontWeight: 'bold', marginTop: '6px' },
  progressBarBg: { width: '100%', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', marginTop: '8px' },
  progressBarFill: { width: '100%', height: '100%', backgroundColor: '#facc15', borderRadius: '2px' },
  tableCard: { border: '1px solid', borderRadius: '10px', padding: '16px' },
  filtersBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  tabsContainer: { display: 'flex', gap: '4px', backgroundColor: 'rgba(0,0,0,0.03)', padding: '4px', borderRadius: '20px' },
  tabButton: { border: 'none', padding: '6px 14px', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' },
  btnIconFilter: { border: '1px solid', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { fontSize: '9px', padding: '10px 8px', borderBottom: '1px solid', textAlign: 'left', fontWeight: 'bold', letterSpacing: '0.4px' },
  td: { padding: '12px 8px', borderBottom: '1px solid', fontSize: '11px' },
  badgeCodigo: { backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', display: 'inline-block' },
  badgeUnidad: { padding: '3px 8px', borderRadius: '12px', fontSize: '10px' },
  badgeEstadoActivo: { backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' },
  badgeEstadoPausado: { backgroundColor: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' },
  btnActionIcon: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '2px' },
  paginationBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '11px' },
  btnPage: { border: 'none', background: 'none', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', borderRadius: '4px' },
  btnPageActive: { backgroundColor: '#facc15', color: '#0b1329', fontWeight: 'bold' },
};