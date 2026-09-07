import React, { useState } from 'react';

export function GestionUsuarios() {
  // CONTROL DE TEMA (oscuro / claro)
  const [esOscuro, setEsOscuro] = useState(false);

  // ESTADO DE BÚSQUEDA Y USUARIOS
  const [busqueda, setBusqueda] = useState('');
  const [usuarios, setUsuarios] = useState([
    {
      id: 'MCA-042',
      nombre: 'Michael Esteban Rubio Pareja',
      initials: 'ME',
      email: 'm.rubio@electricosmca.com',
      rol: 'ADMIN',
      nivel: 'Nivel 3 (Alto)',
      ultimoAcceso: 'Hoy, 08:45 AM',
      estado: 'activo',
    },
    {
      id: 'MCA-029',
      nombre: 'Alejandro García',
      initials: 'AG',
      email: 'a.garcia@electricosmca.com',
      rol: 'SUPERVISOR',
      nivel: 'Nivel 2 (Medio)',
      ultimoAcceso: 'Ayer, 04:12 PM',
      estado: 'activo',
    },
    {
      id: 'MCA-081',
      nombre: 'Laura Villamizar',
      initials: 'LV',
      email: 'l.villamizar@electricosmca.com',
      rol: 'OPERADOR',
      nivel: 'Nivel 1 (Bajo)',
      ultimoAcceso: 'Oct 24, 09:20 AM',
      estado: 'activo',
    },
    {
      id: 'MCA-012',
      nombre: 'Ricardo Suárez',
      initials: 'RS',
      email: 'r.suarez@electricosmca.com',
      rol: 'OPERADOR',
      nivel: 'Nivel 1 (Bajo)',
      ultimoAcceso: 'Inactivo (30d+)',
      estado: 'inactivo',
    },
  ]);

  // PALETA DINÁMICA DE COLORES
  const theme = {
    bgApp: esOscuro ? '#0b1329' : '#f8fafc',
    bgSidebar: esOscuro ? '#0e1830' : '#e8eef3',
    bgCard: esOscuro ? '#111c38' : '#ffffff',
    bgInner: esOscuro ? '#0b1329' : '#f1f5f9',
    border: esOscuro ? '#1e2d4a' : '#e2e8f0',
    borderSoft: esOscuro ? '#162447' : '#f1f5f9',
    textMain: esOscuro ? '#ffffff' : '#0f172a',
    textSub: esOscuro ? '#94a3b8' : '#64748b',
    textMuted: esOscuro ? '#64748b' : '#94a3b8',
    inputBg: esOscuro ? '#0b1329' : '#ffffff',
  };

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.id.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ ...styles.appWrapper, backgroundColor: theme.bgApp, color: theme.textMain }}>
      
      {/* CONTENIDO PRINCIPAL */}
      <main style={styles.mainContainer}>
        {/* BARRA SUPERIOR */}
        <header style={styles.topBar}>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="🔍 Buscar usuarios del sistema..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ ...styles.topSearchInput, backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.textMain }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setEsOscuro(!esOscuro)}
              style={{ ...styles.btnThemeToggle, backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.textMain }}
              title="Cambiar tema"
            >
              {esOscuro ? '☀️ Claro' : '🌙 Oscuro'}
            </button>
            <span style={{ cursor: 'pointer' }}>🔔</span>
            <span style={{ cursor: 'pointer' }}>⣿</span>
            <div style={{ ...styles.userAvatar, backgroundColor: theme.border }}>👤</div>
          </div>
        </header>

        {/* HEADER DE LA SECCIÓN */}
        <div style={styles.headerSection}>
          <div>
            <h1 style={styles.pageTitle}>Gestión de Administrador</h1>
            <p style={{ ...styles.pageSubtitle, color: theme.textSub }}>
              Administre el acceso al sistema, roles y niveles de seguridad para el personal de Eléctricos MCA.
            </p>
          </div>
          <button style={styles.btnNuevoUsuario}>
            👤+ NUEVO USUARIO
          </button>
        </div>

        {/* METRICS / STATS CARDS (GRID 4 COLUMNAS) */}
        <div style={styles.metricsGrid}>
          <div style={{ ...styles.metricCard, backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div style={{ ...styles.metricIcon, backgroundColor: '#dbeafe', color: '#1e40af' }}>👥</div>
            <div>
              <div style={{ ...styles.metricLabel, color: theme.textSub }}>Usuarios Totales</div>
              <div style={styles.metricValue}>42</div>
            </div>
          </div>

          <div style={{ ...styles.metricCard, backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div style={{ ...styles.metricIcon, backgroundColor: '#fef3c7', color: '#d97706' }}>🛡️</div>
            <div>
              <div style={{ ...styles.metricLabel, color: theme.textSub }}>Nivel 3 (Alto)</div>
              <div style={styles.metricValue}>08</div>
            </div>
          </div>

          <div style={{ ...styles.metricCard, backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div style={{ ...styles.metricIcon, backgroundColor: '#f1f5f9', color: '#475569' }}>⚙️</div>
            <div>
              <div style={{ ...styles.metricLabel, color: theme.textSub }}>Supervisores</div>
              <div style={styles.metricValue}>12</div>
            </div>
          </div>

          <div style={{ ...styles.metricCard, backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div style={{ ...styles.metricIcon, backgroundColor: '#fee2e2', color: '#dc2626' }}>🔄</div>
            <div>
              <div style={{ ...styles.metricLabel, color: theme.textSub }}>Inactivos</div>
              <div style={styles.metricValue}>03</div>
            </div>
          </div>
        </div>

        {/* TABLA: DIRECTORIO DE PERSONAL ACTIVO */}
        <div style={{ ...styles.cardSection, backgroundColor: theme.bgCard, borderColor: theme.border }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={styles.sectionTitle}>Directorio de Personal Activo</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ ...styles.btnIconHeader, backgroundColor: theme.bgInner, borderColor: theme.border }}>🎛️</button>
              <button style={{ ...styles.btnIconHeader, backgroundColor: theme.bgInner, borderColor: theme.border }}>📥</button>
            </div>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border }}>NOMBRE DE USUARIO</th>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border }}>EMAIL</th>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border }}>ROL ASIGNADO</th>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border }}>NIVEL DE ACCESO</th>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border }}>ÚLTIMO ACCESO</th>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border, textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td style={{ ...styles.td, borderColor: theme.borderSoft }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={styles.avatarUser}>{item.initials}</div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{item.nombre}</div>
                        <div style={{ fontSize: '9px', color: theme.textSub }}>ID: {item.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...styles.td, borderColor: theme.borderSoft, color: theme.textSub }}>{item.email}</td>
                  <td style={{ ...styles.td, borderColor: theme.borderSoft }}>
                    <span
                      style={{
                        ...styles.badgeRol,
                        backgroundColor:
                          item.rol === 'ADMIN'
                            ? '#dbeafe'
                            : item.rol === 'SUPERVISOR'
                            ? '#e2e8f0'
                            : '#f1f5f9',
                        color: item.rol === 'ADMIN' ? '#1e40af' : '#475569',
                      }}
                    >
                      {item.rol}
                    </span>
                  </td>
                  <td style={{ ...styles.td, borderColor: theme.borderSoft }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold' }}>⚡ {item.nivel}</div>
                  </td>
                  <td style={{ ...styles.td, borderColor: theme.borderSoft, color: item.estado === 'inactivo' ? theme.textMuted : theme.textMain }}>
                    {item.ultimoAcceso}
                  </td>
                  <td style={{ ...styles.td, borderColor: theme.borderSoft, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button style={styles.btnActionIcon} title="Ver">👁️</button>
                      <button style={styles.btnActionIcon} title="Editar">✏️</button>
                      <button style={styles.btnActionIcon} title="Eliminar">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PAGINACIÓN */}
          <div style={{ ...styles.paginationBar, color: theme.textSub }}>
            <span>Mostrando 1-10 de 42 usuarios activos</span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button style={styles.btnPage}>&lt;</button>
              <button style={{ ...styles.btnPage, ...styles.btnPageActive }}>1</button>
              <button style={styles.btnPage}>2</button>
              <button style={styles.btnPage}>3</button>
              <span>...</span>
              <button style={styles.btnPage}>5</button>
              <button style={styles.btnPage}>&gt;</button>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: NIVELES DE ACCESO & SEGURIDAD INDUSTRIAL */}
        <div style={styles.bottomGrid}>
          {/* TARJETA NIVELES DE ACCESO */}
          <div style={{ ...styles.cardSection, backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span>🛡️</span>
              <h3 style={styles.sectionTitle}>Nivel de Acceso High-Level</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ ...styles.levelCard, backgroundColor: theme.bgInner, borderColor: theme.border }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '2px' }}>
                  Nivel 3 (Alto): Administración
                </div>
                <p style={{ margin: 0, fontSize: '10px', color: theme.textSub, lineHeight: '1.3' }}>
                  Dashboard e Indicadores: Generación de estadísticas, consolidados, ingresos y métricas globales. Acceso completo a la gestión de roles y permisos.
                </p>
              </div>

              <div style={{ ...styles.levelCard, backgroundColor: theme.bgInner, borderColor: theme.border }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '2px' }}>
                  Nivel 2 (Medio): Supervisión
                </div>
                <p style={{ margin: 0, fontSize: '10px', color: theme.textSub, lineHeight: '1.3' }}>
                  Gestión de Materiales: Control de existencias, entradas, salidas y alertas de stock. Gestión de órdenes de trabajo y asignación de personal.
                </p>
              </div>
            </div>
          </div>

          {/* TARJETA SEGURIDAD INDUSTRIAL (DARK CARD) */}
          <div style={styles.securityCardDark}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>
                Seguridad Industrial
              </h3>
              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', lineHeight: '1.4' }}>
                Recuerde que cada modificación de acceso queda registrada para fines de auditoría. Asegúrese de que los usuarios tengan asignados únicamente los permisos mínimos necesarios.
              </p>
            </div>

            <button style={styles.btnAuditoria}>
              VER REGISTRO DE AUDITORÍA
            </button>
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
  brandSubtitle: { fontSize: '8px', marginBottom: '24px', letterSpacing: '0.5px' },
  navList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  navItem: { padding: '8px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' },
  navItemActive: { backgroundColor: '#1e2d4a', color: '#facc15', fontWeight: 'bold' },
  sidebarFooter: { borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' },
  mainContainer: { flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '16px' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  searchContainer: { width: '380px' },
  topSearchInput: { border: '1px solid', padding: '8px 14px', borderRadius: '6px', width: '100%', outline: 'none', fontSize: '11px', boxSizing: 'border-box' },
  btnThemeToggle: { border: '1px solid', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },
  userAvatar: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  headerSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { margin: 0, fontSize: '18px', fontWeight: 'bold' },
  pageSubtitle: { margin: '2px 0 0 0', fontSize: '11px' },
  btnNuevoUsuario: { backgroundColor: '#facc15', border: 'none', color: '#0b1329', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' },
  metricCard: { border: '1px solid', borderRadius: '10px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'center' },
  metricIcon: { width: '36px', height: '36px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '16px', flexShrink: 0 },
  metricLabel: { fontSize: '10px', fontWeight: 'bold' },
  metricValue: { fontSize: '18px', fontWeight: 'bold', marginTop: '2px' },
  cardSection: { border: '1px solid', borderRadius: '10px', padding: '16px' },
  sectionTitle: { margin: 0, fontSize: '13px', fontWeight: 'bold' },
  btnIconHeader: { border: '1px solid', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { fontSize: '9px', padding: '8px', borderBottom: '1px solid', textAlign: 'left', fontWeight: 'bold', letterSpacing: '0.4px' },
  td: { padding: '10px 8px', borderBottom: '1px solid', fontSize: '11px' },
  avatarUser: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0b1329', color: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px', fontWeight: 'bold' },
  badgeRol: { padding: '3px 8px', borderRadius: '10px', fontSize: '9px', fontWeight: 'bold' },
  btnActionIcon: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', padding: '2px' },
  paginationBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', fontSize: '10px' },
  btnPage: { border: 'none', background: 'none', padding: '4px 8px', cursor: 'pointer', fontSize: '10px', borderRadius: '4px' },
  btnPageActive: { backgroundColor: '#facc15', color: '#0b1329', fontWeight: 'bold' },
  bottomGrid: { display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '16px' },
  levelCard: { border: '1px solid', borderRadius: '6px', padding: '10px' },
  securityCardDark: { backgroundColor: '#111c38', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  btnAuditoria: { backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', padding: '8px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', width: 'fit-content', marginTop: '12px' },
};