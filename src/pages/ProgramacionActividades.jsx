import React, { useState } from 'react';

export function ProgramacionActividades() {
  // CONTROL DE TEMA (oscuro / claro)
  const [esOscuro, setEsOscuro] = useState(false);

  // ESTADO DEL FORMULARIO "NUEVA ASIGNACIÓN"
  const [formData, setFormData] = useState({
    cliente: 'Corporativo Andes S.A.',
    ordenServicio: 'OS-9842 (Mantenimiento Preventivo)',
    tecnico: 'Ing. Carlos Ruiz (Senior)',
    fecha: '2023-10-24',
    horaInicio: '08:00',
    horaFin: '12:00',
  });

  // PRÓXIMOS SERVICIOS AGENDADOS
  const [serviciosAgendados, setServiciosAgendados] = useState([
    {
      id: 1,
      codigo: 'OS-9842',
      cliente: 'Corporativo Andes S.A.',
      subcliente: 'Sede Industrial Sur',
      tecnico: 'Carlos Ruiz',
      tecnicoInitials: 'CR',
      fechaHora: '24 Oct, 2023',
      rangoHora: '08:00 AM - 12:00 PM',
      estado: 'PROGRAMADO',
    },
    {
      id: 2,
      codigo: 'OS-9845',
      cliente: 'Minería El Dorado',
      subcliente: 'Planta de Proceso B',
      tecnico: 'Marta Gómez',
      tecnicoInitials: 'MG',
      fechaHora: '25 Oct, 2023',
      rangoHora: '02:00 PM - 05:00 PM',
      estado: 'REPROGRAMADO',
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVerificarDisponibilidad = (e) => {
    e.preventDefault();
    alert(`Disponibilidad verificada para ${formData.tecnico} el ${formData.fecha}`);
  };

  return (
    <div style={{ ...styles.appWrapper, backgroundColor: theme.bgApp, color: theme.textMain }}>
      
      {/* CONTENIDO PRINCIPAL */}
      <main style={styles.mainContainer}>
        {/* BARRA SUPERIOR BÚSQUEDA Y USUARIO */}
        <header style={styles.topBar}>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="🔍 Buscador global..."
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
            <div style={{ textAlign: 'right', fontSize: '11px' }}>
              <div style={{ fontWeight: 'bold' }}>Admin Documentos</div>
              <div style={{ color: theme.textSub, fontSize: '9px' }}>DEPARTAMENTO TÉCNICO</div>
            </div>
            <div style={{ ...styles.userAvatar, backgroundColor: theme.border }}>👤</div>
            <span style={{ cursor: 'pointer', fontSize: '14px' }}>🔔</span>
          </div>
        </header>

        {/* HEADER DE LA PÁGINA */}
        <div style={styles.headerSection}>
          <div>
            <h1 style={styles.pageTitle}>Programación y Asignación de Actividades</h1>
            <p style={{ ...styles.pageSubtitle, color: theme.textSub }}>
              Gestión centralizada de órdenes de servicio y cuadrillas técnicas.
            </p>
          </div>
          <button style={styles.btnProgramarNivel}>
            ➕ PROGRAMAR NUEVA ACTIVIDAD
          </button>
        </div>

        {/* GRID CENTRAL: NUEVA ASIGNACIÓN + CALENDARIO DE AGENDA */}
        <div style={styles.middleGrid}>
          {/* PANEL IZQUIERDO: FORMULARIO DE NUEVA ASIGNACIÓN */}
          <div style={{ ...styles.cardSection, backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px' }}>📝</span>
              <h3 style={{ ...styles.sectionTitle, color: theme.textMain }}>Nueva Asignación</h3>
            </div>

            <form onSubmit={handleVerificarDisponibilidad} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ ...styles.fieldLabel, color: theme.textSub }}>SELECCIONAR CLIENTE</label>
                <select
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleChange}
                  style={{ ...styles.selectField, backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain }}
                >
                  <option value="Corporativo Andes S.A.">Corporativo Andes S.A.</option>
                  <option value="Minería El Dorado">Minería El Dorado</option>
                  <option value="ElectroIndustrias">ElectroIndustrias</option>
                </select>
              </div>

              <div>
                <label style={{ ...styles.fieldLabel, color: theme.textSub }}>SELECCIONAR ORDEN DE SERVICIO</label>
                <select
                  name="ordenServicio"
                  value={formData.ordenServicio}
                  onChange={handleChange}
                  style={{ ...styles.selectField, backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain }}
                >
                  <option value="OS-9842 (Mantenimiento Preventivo)">OS-9842 (Mantenimiento Preventivo)</option>
                  <option value="OS-9845 (Instalación de Celdas)">OS-9845 (Instalación de Celdas)</option>
                </select>
              </div>

              <div>
                <label style={{ ...styles.fieldLabel, color: theme.textSub }}>ASIGNAR TÉCNICO RESPONSABLE</label>
                <select
                  name="tecnico"
                  value={formData.tecnico}
                  onChange={handleChange}
                  style={{ ...styles.selectField, backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain }}
                >
                  <option value="Ing. Carlos Ruiz (Senior)">Ing. Carlos Ruiz (Senior)</option>
                  <option value="Marta Gómez (Especialista)">Marta Gómez (Especialista)</option>
                </select>
              </div>

              <div>
                <label style={{ ...styles.fieldLabel, color: theme.textSub }}>FECHA PROGRAMADA</label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  style={{ ...styles.inputField, backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ ...styles.fieldLabel, color: theme.textSub }}>HORA INICIO</label>
                  <input
                    type="time"
                    name="horaInicio"
                    value={formData.horaInicio}
                    onChange={handleChange}
                    style={{ ...styles.inputField, backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain }}
                  />
                </div>
                <div>
                  <label style={{ ...styles.fieldLabel, color: theme.textSub }}>HORA FIN</label>
                  <input
                    type="time"
                    name="horaFin"
                    value={formData.horaFin}
                    onChange={handleChange}
                    style={{ ...styles.inputField, backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain }}
                  />
                </div>
              </div>

              <button type="submit" style={styles.btnVerificar}>
                VERIFICAR DISPONIBILIDAD
              </button>
            </form>
          </div>

          {/* PANEL DERECHO: VISTA DE AGENDA / CALENDARIO */}
          <div style={{ ...styles.cardSection, backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ ...styles.sectionTitle, color: theme.textMain }}>Vista de Agenda</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={styles.badgeMes}>OCTUBRE 2023</span>
                <span style={{ cursor: 'pointer', fontSize: '12px' }}>&lt;</span>
                <span style={{ cursor: 'pointer', fontSize: '12px' }}>&gt;</span>
              </div>
            </div>

            {/* GRILLA DE CALENDARIO DE OCTUBRE */}
            <div style={styles.calendarGrid}>
              {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((d) => (
                <div key={d} style={{ ...styles.calendarDayHeader, color: theme.textMuted }}>{d}</div>
              ))}

              {/* DÍAS Y EVENTOS AGENDADOS */}
              {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => {
                const es24 = dia === 24;
                const es25 = dia === 25;
                const es28 = dia === 28;

                return (
                  <div
                    key={dia}
                    style={{
                      ...styles.calendarCell,
                      borderColor: theme.borderSoft,
                      backgroundColor: es24 ? (esOscuro ? '#3a2e10' : '#fef9c3') : 'transparent',
                    }}
                  >
                    <span style={{ fontSize: '10px', color: theme.textSub }}>{dia}</span>
                    {es24 && <div style={styles.chipOSDark}>OS-9842</div>}
                    {es25 && <div style={styles.chipOSBlack}>Mantenimie...</div>}
                    {es28 && <div style={styles.chipOSBlack}>Mantenimie...</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* TABLA: PRÓXIMOS SERVICIOS AGENDADOS */}
        <div style={{ ...styles.cardSection, backgroundColor: theme.bgCard, borderColor: theme.border }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={styles.sectionTitle}>Próximos Servicios Agendados</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ ...styles.btnSecundario, backgroundColor: theme.bgInner, color: theme.textMain, borderColor: theme.border }}>
                EXPORTAR PDF
              </button>
              <button style={styles.btnFiltrar}>
                FILTRAR LISTA
              </button>
            </div>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border }}>CÓDIGO ORDEN</th>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border }}>CLIENTE</th>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border }}>TÉCNICO</th>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border }}>FECHA / HORA</th>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border }}>ESTADO</th>
                <th style={{ ...styles.th, color: theme.textMuted, borderColor: theme.border, textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {serviciosAgendados.map((item) => (
                <tr key={item.id}>
                  <td style={{ ...styles.td, borderColor: theme.borderSoft, fontWeight: 'bold' }}>{item.codigo}</td>
                  <td style={{ ...styles.td, borderColor: theme.borderSoft }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{item.cliente}</div>
                    <div style={{ fontSize: '9px', color: theme.textSub }}>{item.subcliente}</div>
                  </td>
                  <td style={{ ...styles.td, borderColor: theme.borderSoft }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={styles.avatarMini}>{item.tecnicoInitials}</div>
                      <span style={{ fontSize: '11px' }}>{item.tecnico}</span>
                    </div>
                  </td>
                  <td style={{ ...styles.td, borderColor: theme.borderSoft }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{item.fechaHora}</div>
                    <div style={{ fontSize: '9px', color: theme.textSub }}>{item.rangoHora}</div>
                  </td>
                  <td style={{ ...styles.td, borderColor: theme.borderSoft }}>
                    <span
                      style={
                        item.estado === 'PROGRAMADO'
                          ? styles.badgeProgramado
                          : styles.badgeReprogramado
                      }
                    >
                      {item.estado}
                    </span>
                  </td>
                  <td style={{ ...styles.td, borderColor: theme.borderSoft, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button style={styles.btnActionIcon} title="Editar">✏️</button>
                      <button style={styles.btnActionIcon} title="Cancelar/Eliminar">🚫</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER GENERAL */}
        <footer style={{ ...styles.footer, color: theme.textSub }}>
          <div>© 2023 ELÉCTRICOS MCA S.A.S - Todos los derechos reservados.</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ cursor: 'pointer' }}>Soporte Técnico</span>
            <span style={{ cursor: 'pointer' }}>Política de Privacidad</span>
          </div>
        </footer>
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
  navItemActive: { backgroundColor: '#facc15', color: '#0b1329', fontWeight: 'bold' },
  sidebarFooter: { borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' },
  mainContainer: { flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '16px' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  searchContainer: { width: '300px' },
  topSearchInput: { border: '1px solid', padding: '7px 12px', borderRadius: '20px', width: '100%', outline: 'none', fontSize: '11px', boxSizing: 'border-box' },
  btnThemeToggle: { border: '1px solid', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },
  userAvatar: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  headerSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { margin: 0, fontSize: '18px', fontWeight: 'bold' },
  pageSubtitle: { margin: '2px 0 0 0', fontSize: '11px' },
  btnProgramarNivel: { backgroundColor: '#facc15', border: 'none', color: '#0b1329', padding: '10px 18px', borderRadius: '20px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' },
  middleGrid: { display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '16px' },
  cardSection: { border: '1px solid', borderRadius: '10px', padding: '16px' },
  sectionTitle: { margin: 0, fontSize: '13px', fontWeight: 'bold' },
  fieldLabel: { display: 'block', fontSize: '9px', fontWeight: 'bold', marginBottom: '4px', letterSpacing: '0.3px' },
  inputField: { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid', outline: 'none', fontSize: '11px', boxSizing: 'border-box' },
  selectField: { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid', outline: 'none', fontSize: '11px', boxSizing: 'border-box' },
  btnVerificar: { width: '100%', padding: '10px', borderRadius: '20px', border: '1px solid #0b1329', backgroundColor: '#ffffff', color: '#0b1329', fontWeight: 'bold', fontSize: '10px', cursor: 'pointer', marginTop: '6px' },
  badgeMes: { backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '10px', fontSize: '9px', fontWeight: 'bold' },
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginTop: '8px' },
  calendarDayHeader: { textAlign: 'center', fontSize: '9px', fontWeight: 'bold', paddingBottom: '6px' },
  calendarCell: { height: '42px', border: '1px solid', borderRadius: '4px', padding: '2px', display: 'flex', flexDirection: 'column', gap: '2px' },
  chipOSDark: { backgroundColor: '#0b1329', color: '#ffffff', fontSize: '8px', padding: '2px 4px', borderRadius: '3px', textAlign: 'center', fontWeight: 'bold' },
  chipOSBlack: { backgroundColor: '#0b1329', color: '#ffffff', fontSize: '7px', padding: '2px 4px', borderRadius: '3px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden' },
  btnSecundario: { border: '1px solid', padding: '6px 12px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' },
  btnFiltrar: { backgroundColor: '#0b1329', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '20px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '8px' },
  th: { fontSize: '9px', padding: '8px', borderBottom: '1px solid', textAlign: 'left', fontWeight: 'bold' },
  td: { padding: '10px 8px', borderBottom: '1px solid', fontSize: '11px' },
  avatarMini: { width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#0b1329', color: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '9px', fontWeight: 'bold' },
  badgeProgramado: { backgroundColor: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '10px', fontSize: '9px', fontWeight: 'bold' },
  badgeReprogramado: { backgroundColor: '#e2e8f0', color: '#475569', padding: '3px 8px', borderRadius: '10px', fontSize: '9px', fontWeight: 'bold' },
  btnActionIcon: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', padding: '2px' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', fontSize: '10px' },
};