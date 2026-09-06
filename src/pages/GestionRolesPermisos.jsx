import React, { useState } from 'react';

export function GestionRolesPermisos() {
  // CONTROL DE TEMA (oscuro / claro)
  const [esOscuro, setEsOscuro] = useState(true);

  // NOTIFICACIÓN FLOTANTE (Toast)
  const [mostrarToast, setMostrarToast] = useState(false);

  // ESTADO DE PERMISOS POR NIVEL
  const [permisosNivel3, setPermisosNivel3] = useState({
    dashboard: true,
    metricas: true,
    consolidados: true,
  });

  const [permisosNivel2, setPermisosNivel2] = useState({
    gestionRoles: true,
    gestionMateriales: true,
    alertasStock: true,
    controlEntradas: false,
  });

  const [permisosNivel1, setPermisosNivel1] = useState({
    registroUsuarios: true,
    edicionPerfiles: true,
    gestionTerceros: false,
    datosLaborales: false,
  });

  // REGISTRO DE CAMBIOS RECIENTES (LOGS)
  const [logs, setLogs] = useState([
    {
      usuario: 'Michael Esteban Rubio',
      accion: 'Modificó permisos Nivel 2',
      modulo: 'ROLES',
      fecha: '15 Oct 2023 - 09:42 AM',
      nivel: 'NIVEL 3',
    },
    {
      usuario: 'Admin Central',
      accion: 'Actualizó stock de materiales',
      modulo: 'INVENTARIO',
      fecha: '15 Oct 2023 - 08:15 AM',
      nivel: 'NIVEL 2',
    },
  ]);

  // PALETA DINÁMICA DE COLORES
  const theme = {
    bgApp: esOscuro ? '#0b1329' : '#f1f5f9',
    bgSidebar: esOscuro ? '#0e1830' : '#ffffff',
    bgCard: esOscuro ? '#111c38' : '#ffffff',
    bgInner: esOscuro ? '#0b1329' : '#f8fafc',
    border: esOscuro ? '#1e2d4a' : '#e2e8f0',
    borderSoft: esOscuro ? '#162447' : '#f1f5f9',
    textMain: esOscuro ? '#ffffff' : '#0f172a',
    textSub: esOscuro ? '#94a3b8' : '#64748b',
    textMuted: esOscuro ? '#64748b' : '#94a3b8',
    inputBg: esOscuro ? '#0b1329' : '#ffffff',
  };

  // MANEJAR CAMBIO EN TOGGLES
  const handleToggle = (nivel, key) => {
    if (nivel === 3) {
      setPermisosNivel3({ ...permisosNivel3, [key]: !permisosNivel3[key] });
    } else if (nivel === 2) {
      setPermisosNivel2({ ...permisosNivel2, [key]: !permisosNivel2[key] });
    } else if (nivel === 1) {
      setPermisosNivel1({ ...permisosNivel1, [key]: !permisosNivel1[key] });
    }
  };

  // GUARDAR CAMBIOS
  const handleGuardarCambios = () => {
    const nuevoLog = {
      usuario: 'Admin Central',
      accion: 'Actualizó permisos del sistema',
      modulo: 'ROLES',
      fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) + ' - ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      nivel: 'NIVEL 3',
    };
    setLogs([nuevoLog, ...logs]);

    setMostrarToast(true);
    setTimeout(() => {
      setMostrarToast(false);
    }, 3500);
  };

  return (
    <div style={{ ...styles.appWrapper, backgroundColor: theme.bgApp, color: theme.textMain }}>
      

      {/* CONTENIDO PRINCIPAL */}
      <main style={styles.mainContainer}>
        {/* BARRA SUPERIOR */}
        <header style={styles.topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🔄</span>
            <span style={{ fontWeight: 'bold', fontSize: '15px' }}>Gestión de Roles y Permisos</span>
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
            <div style={{ textAlign: 'right', fontSize: '11px' }}>
              <div style={{ fontWeight: 'bold' }}>Admin Central</div>
              <div style={{ color: theme.textSub }}>Sede Principal</div>
            </div>
            <div style={{ ...styles.userAvatar, backgroundColor: theme.border }}>👤</div>
          </div>
        </header>

        {/* HEADER DE SECCIÓN */}
        <div style={styles.headerSection}>
          <div>
            <h1 style={styles.pageTitle}>Configuración de Niveles de Acceso</h1>
            <p style={{ ...styles.pageSubtitle, color: theme.textSub }}>
              Administre la jerarquía de seguridad y visualización de datos de la plataforma.
            </p>
          </div>
          <button style={styles.btnGuardar} onClick={handleGuardarCambios}>
            💾 GUARDAR CAMBIOS
          </button>
        </div>

        {/* TARJETAS DE NIVELES (GRID 3 COLUMNAS) */}
        <div style={styles.levelsGrid}>
          {/* NIVEL 3 - ALTA */}
          <div style={{ ...styles.levelCard, backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div style={styles.levelHeader}>
              <div style={{ ...styles.iconBox, backgroundColor: '#facc15', color: '#0b1329' }}>🛡️</div>
              <div>
                <h3 style={styles.levelTitle}>Nivel 3 (Alta)</h3>
                <span style={styles.badgeAdmin}>ADMINISTRADOR</span>
              </div>
            </div>

            <div style={{ ...styles.permisosHeader, color: theme.textMuted, borderColor: theme.borderSoft }}>PERMISOS</div>

            <div style={styles.permisoRow}>
              <span style={{ fontSize: '12px' }}>📊 Dashboard e Indicadores</span>
              <ToggleSwitch active={permisosNivel3.dashboard} onClick={() => handleToggle(3, 'dashboard')} />
            </div>
            <div style={styles.permisoRow}>
              <span style={{ fontSize: '12px' }}>📈 Métricas Globales</span>
              <ToggleSwitch active={permisosNivel3.metricas} onClick={() => handleToggle(3, 'metricas')} />
            </div>
            <div style={styles.permisoRow}>
              <span style={{ fontSize: '12px' }}>💵 Consolidados e Ingresos</span>
              <ToggleSwitch active={permisosNivel3.consolidados} onClick={() => handleToggle(3, 'consolidados')} />
            </div>

            {/* AVISO DE SEGURIDAD DENTRO DE LA PRIMERA COLUMNA */}
            <div style={{ ...styles.securityWarningCard, backgroundColor: theme.bgInner, borderColor: theme.border }}>
              <div style={{ fontWeight: 'bold', color: '#facc15', fontSize: '13px', marginBottom: '6px' }}>
                Aviso de Seguridad
              </div>
              <p style={{ fontSize: '11px', color: theme.textSub, margin: 0, lineHeight: '1.4' }}>
                Los cambios en los permisos de Nivel 3 requieren autenticación multifactor para su validación. Proceda con precaución industrial.
              </p>
            </div>
          </div>

          {/* NIVEL 2 - MEDIA */}
          <div style={{ ...styles.levelCard, backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div style={styles.levelHeader}>
              <div style={{ ...styles.iconBox, backgroundColor: '#1e2d4a', color: '#ffffff' }}>👤</div>
              <div>
                <h3 style={styles.levelTitle}>Nivel 2 (Media)</h3>
                <span style={styles.badgeSupervisor}>SUPERVISOR</span>
              </div>
            </div>

            <div style={{ ...styles.permisosHeader, color: theme.textMuted, borderColor: theme.borderSoft }}>PERMISOS</div>

            <div style={styles.permisoRow}>
              <span style={{ fontSize: '12px' }}>🔑 Gestión de Roles y Permisos</span>
              <ToggleSwitch active={permisosNivel2.gestionRoles} onClick={() => handleToggle(2, 'gestionRoles')} />
            </div>
            <div style={styles.permisoRow}>
              <span style={{ fontSize: '12px' }}>📦 Gestión de Materiales</span>
              <ToggleSwitch active={permisosNivel2.gestionMateriales} onClick={() => handleToggle(2, 'gestionMateriales')} />
            </div>
            <div style={styles.permisoRow}>
              <span style={{ fontSize: '12px' }}>🔔 Alertas de Stock</span>
              <ToggleSwitch active={permisosNivel2.alertasStock} onClick={() => handleToggle(2, 'alertasStock')} />
            </div>
            <div style={styles.permisoRow}>
              <span style={{ fontSize: '12px' }}>📲 Control de Entradas/Salidas</span>
              <ToggleSwitch active={permisosNivel2.controlEntradas} onClick={() => handleToggle(2, 'controlEntradas')} />
            </div>
          </div>

          {/* NIVEL 1 - BAJA */}
          <div style={{ ...styles.levelCard, backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div style={styles.levelHeader}>
              <div style={{ ...styles.iconBox, backgroundColor: '#1e2d4a', color: '#ffffff' }}>👥</div>
              <div>
                <h3 style={styles.levelTitle}>Nivel 1 (Baja)</h3>
                <span style={styles.badgeOperador}>OPERADOR</span>
              </div>
            </div>

            <div style={{ ...styles.permisosHeader, color: theme.textMuted, borderColor: theme.borderSoft }}>PERMISOS</div>

            <div style={styles.permisoRow}>
              <span style={{ fontSize: '12px' }}>👤+ Registro de Usuarios</span>
              <ToggleSwitch active={permisosNivel1.registroUsuarios} onClick={() => handleToggle(1, 'registroUsuarios')} />
            </div>
            <div style={styles.permisoRow}>
              <span style={{ fontSize: '12px' }}>✏️ Edición de Perfiles</span>
              <ToggleSwitch active={permisosNivel1.edicionPerfiles} onClick={() => handleToggle(1, 'edicionPerfiles')} />
            </div>
            <div style={styles.permisoRow}>
              <span style={{ fontSize: '12px' }}>🪪 Gestión de Terceros</span>
              <ToggleSwitch active={permisosNivel1.gestionTerceros} onClick={() => handleToggle(1, 'gestionTerceros')} />
            </div>
            <div style={styles.permisoRow}>
              <span style={{ fontSize: '12px' }}>🗂️ Datos Laborales Personales</span>
              <ToggleSwitch active={permisosNivel1.datosLaborales} onClick={() => handleToggle(1, 'datosLaborales')} />
            </div>
          </div>
        </div>

        {/* TABLA: REGISTRO DE CAMBIOS RECIENTES */}
        <div style={{ ...styles.cardSection, backgroundColor: theme.bgCard, borderColor: theme.border }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={styles.sectionTitle}>Registro de Cambios Recientes</h3>
            <button style={{ ...styles.btnLink, color: '#facc15' }}>🔄 VER LOG COMPLETO</button>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border }}>USUARIO</th>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border }}>ACCIÓN</th>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border }}>MÓDULO</th>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border }}>FECHA</th>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border, textAlign: 'right' }}>NIVEL</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={index}>
                  <td style={{ ...styles.td, borderColor: theme.borderSoft, fontWeight: 'bold' }}>{log.usuario}</td>
                  <td style={{ ...styles.td, borderColor: theme.borderSoft, color: theme.textSub }}>{log.accion}</td>
                  <td style={{ ...styles.td, borderColor: theme.borderSoft }}>
                    <span style={styles.tagModulo}>{log.modulo}</span>
                  </td>
                  <td style={{ ...styles.td, borderColor: theme.borderSoft, color: theme.textSub }}>{log.fecha}</td>
                  <td style={{ ...styles.td, borderColor: theme.borderSoft, textAlign: 'right' }}>
                    <span style={log.nivel === 'NIVEL 3' ? styles.badgeNivel3 : styles.badgeNivel2}>
                      ● {log.nivel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOAST DE NOTIFICACIÓN FLOTANTE */}
        {mostrarToast && (
          <div style={styles.toastContainer}>
            <div style={styles.toastContent}>
              <span style={{ fontSize: '18px' }}>🟡</span>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '12px' }}>Configuración Guardada</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Los cambios han sido aplicados al sistema.</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// COMPONENTE AUXILIAR TOGGLE SWITCH
function ToggleSwitch({ active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: '38px',
        height: '20px',
        backgroundColor: active ? '#facc15' : '#334155',
        borderRadius: '12px',
        padding: '2px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: active ? 'flex-end' : 'flex-start',
        transition: 'background-color 0.2s',
      }}
    >
      <div
        style={{
          width: '16px',
          height: '16px',
          backgroundColor: active ? '#0b1329' : '#94a3b8',
          borderRadius: '50%',
        }}
      />
    </div>
  );
}

// ESTILOS DE LA APLICACIÓN
const styles = {
  appWrapper: { display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif', transition: 'background-color 0.2s, color 0.2s' },
  sidebar: { width: '220px', borderRight: '1px solid', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  brandTitle: { fontSize: '16px', fontWeight: 'bold', color: '#facc15' },
  brandSubtitle: { fontSize: '10px', marginBottom: '24px' },
  navList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  navItem: { padding: '10px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' },
  navItemActive: { backgroundColor: '#1e2d4a', color: '#ffffff', fontWeight: 'bold' },
  sidebarFooter: { borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' },
  mainContainer: { flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnThemeToggle: { border: '1px solid', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
  userAvatar: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  headerSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { margin: 0, fontSize: '20px', fontWeight: 'bold' },
  pageSubtitle: { margin: '4px 0 0 0', fontSize: '12px' },
  btnGuardar: { backgroundColor: '#facc15', border: 'none', color: '#0b1329', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' },
  levelsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' },
  levelCard: { border: '1px solid', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column' },
  levelHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' },
  iconBox: { width: '32px', height: '32px', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px' },
  levelTitle: { margin: 0, fontSize: '14px', fontWeight: 'bold' },
  badgeAdmin: { backgroundColor: 'rgba(250,204,21,0.2)', color: '#facc15', fontSize: '8px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' },
  badgeSupervisor: { backgroundColor: 'rgba(148,163,184,0.2)', color: '#cbd5e1', fontSize: '8px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' },
  badgeOperador: { backgroundColor: 'rgba(148,163,184,0.2)', color: '#cbd5e1', fontSize: '8px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' },
  permisosHeader: { fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.5px', paddingBottom: '6px', borderBottom: '1px solid', marginBottom: '12px' },
  permisoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  securityWarningCard: { marginTop: 'auto', border: '1px solid', borderRadius: '8px', padding: '12px' },
  cardSection: { border: '1px solid', borderRadius: '10px', padding: '20px' },
  sectionTitle: { margin: 0, fontSize: '14px', fontWeight: 'bold' },
  btnLink: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
  th: { fontSize: '10px', padding: '8px', borderBottom: '1px solid', textAlign: 'left' },
  td: { padding: '12px 8px', borderBottom: '1px solid', fontSize: '12px' },
  tagModulo: { backgroundColor: 'rgba(250,204,21,0.15)', color: '#facc15', padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold' },
  badgeNivel3: { backgroundColor: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' },
  badgeNivel2: { backgroundColor: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' },
  toastContainer: { position: 'fixed', bottom: '24px', left: '260px', zIndex: 999 },
  toastContent: { backgroundColor: '#111c38', border: '1px solid #1e2d4a', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', color: '#ffffff' },
};