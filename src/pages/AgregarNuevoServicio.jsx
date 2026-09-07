import React, { useState } from 'react';

export function AgregarNuevoServicio() {
  // CONTROL DE TEMA (oscuro / claro)
  const [esOscuro, setEsOscuro] = useState(false);

  // ESTADO DEL FORMULARIO DE NUEVO SERVICIO
  const [formData, setFormData] = useState({
    codigoServicio: '',
    nombreServicio: '',
    descripcion: '',
    unidadMedida: 'Punto',
    tiempoEstimado: '',
    precioBase: '',
  });

  // PALETA DINÁMICA DE COLORES
  const theme = {
    bgApp: esOscuro ? '#0b1329' : '#f8fafc',
    bgSidebar: esOscuro ? '#0e1830' : '#e8eef3',
    bgCard: esOscuro ? '#111c38' : '#ffffff',
    bgInner: esOscuro ? '#0b1329' : '#f1f5f9',
    bgPriceBox: esOscuro ? '#21241a' : '#fefde8',
    border: esOscuro ? '#1e2d4a' : '#e2e8f0',
    textMain: esOscuro ? '#ffffff' : '#0f172a',
    textSub: esOscuro ? '#94a3b8' : '#64748b',
    textMuted: esOscuro ? '#64748b' : '#94a3b8',
    inputBg: esOscuro ? '#0b1329' : '#ffffff',
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardarServicio = (e) => {
    e.preventDefault();
    if (!formData.nombreServicio) {
      alert('Por favor ingrese el nombre del servicio.');
      return;
    }
    alert(`Servicio "${formData.nombreServicio}" guardado con éxito.`);
  };

  const precioFormateado = parseFloat(formData.precioBase || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div style={{ ...styles.appWrapper, backgroundColor: theme.bgApp, color: theme.textMain }}>
      

      {/* CONTENIDO PRINCIPAL */}
      <main style={styles.mainContainer}>
        {/* BARRA SUPERIOR DE BÚSQUEDA Y PERFIL */}
        <header style={styles.topBar}>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="🔍 Buscar en el catálogo..."
              style={{ ...styles.topSearchInput, backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.textMain }}
            />
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <button
              onClick={() => setEsOscuro(!esOscuro)}
              style={{ ...styles.btnThemeToggle, backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.textMain }}
              title="Cambiar tema"
            >
              {esOscuro ? '☀️ Claro' : '🌙 Oscuro'}
            </button>
            <span style={{ cursor: 'pointer' }}>🔔</span>
            <span style={{ cursor: 'pointer' }}>❓</span>
            <div style={{ textAlign: 'right', fontSize: '11px' }}>
              <div style={{ fontWeight: 'bold' }}>Admin Usuario</div>
              <div style={{ color: theme.textSub }}>Gerente Técnico</div>
            </div>
            <div style={{ ...styles.userAvatar, backgroundColor: theme.border }}>👤</div>
          </div>
        </header>

        {/* TÍTULO DE LA PÁGINA */}
        <div style={styles.headerSection}>
          <h1 style={styles.pageTitle}>Agregar Nuevo Servicio</h1>
          <p style={{ ...styles.pageSubtitle, color: theme.textSub }}>
            Configure los detalles técnicos y comerciales del nuevo servicio para su integración inmediata en cotizaciones.
          </p>
        </div>

        {/* LAYOUT DE FORMULARIO (2 COLUMNAS) */}
        <form onSubmit={handleGuardarServicio} style={styles.formLayout}>
          {/* COLUMNA IZQUIERDA: INFORMACIÓN Y PARÁMETROS */}
          <div style={styles.leftColumn}>
            {/* SECCIÓN INFORMACIÓN GENERAL */}
            <div style={{ ...styles.cardSection, backgroundColor: theme.bgCard, borderColor: theme.border }}>
              <h3 style={{ ...styles.sectionTitle, color: theme.textMain }}>
                ⚡ Información General
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ ...styles.fieldLabel, color: theme.textSub }}>CÓDIGO DE SERVICIO</label>
                  <input
                    type="text"
                    name="codigoServicio"
                    placeholder="Ej. ELEC-001"
                    value={formData.codigoServicio}
                    onChange={handleChange}
                    style={{ ...styles.inputField, backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain }}
                  />
                </div>
                <div>
                  <label style={{ ...styles.fieldLabel, color: theme.textSub }}>NOMBRE DEL SERVICIO</label>
                  <input
                    type="text"
                    name="nombreServicio"
                    placeholder="Ej. Instalación de Tablero"
                    value={formData.nombreServicio}
                    onChange={handleChange}
                    style={{ ...styles.inputField, backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain }}
                  />
                </div>
              </div>

              <div>
                <label style={{ ...styles.fieldLabel, color: theme.textSub }}>DESCRIPCIÓN DETALLADA</label>
                <textarea
                  name="descripcion"
                  rows={4}
                  placeholder="Describa el alcance, materiales básicos incluidos y condiciones generales del servicio..."
                  value={formData.descripcion}
                  onChange={handleChange}
                  style={{ ...styles.textareaField, backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain }}
                />
              </div>
            </div>

            {/* SECCIÓN PARÁMETROS TÉCNICOS */}
            <div style={{ ...styles.cardSection, backgroundColor: theme.bgCard, borderColor: theme.border, marginTop: '16px' }}>
              <h3 style={{ ...styles.sectionTitle, color: theme.textMain }}>
                ⚙️ Parámetros Técnicos
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div>
                  <label style={{ ...styles.fieldLabel, color: theme.textSub }}>UNIDAD DE MEDIDA</label>
                  <select
                    name="unidadMedida"
                    value={formData.unidadMedida}
                    onChange={handleChange}
                    style={{ ...styles.selectField, backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain }}
                  >
                    <option value="Punto">Punto</option>
                    <option value="Metro">Metro (m)</option>
                    <option value="Hora">Hora</option>
                    <option value="Unidad">Unidad</option>
                    <option value="Global">Global</option>
                  </select>
                </div>
                <div>
                  <label style={{ ...styles.fieldLabel, color: theme.textSub }}>TIEMPO ESTIMADO (HORAS)</label>
                  <div style={{ ...styles.inputWithSuffix, backgroundColor: theme.inputBg, borderColor: theme.border }}>
                    <input
                      type="number"
                      name="tiempoEstimado"
                      step="0.1"
                      placeholder="0.00"
                      value={formData.tiempoEstimado}
                      onChange={handleChange}
                      style={{ ...styles.bareInput, color: theme.textMain }}
                    />
                    <span style={{ fontSize: '12px', color: theme.textSub, paddingRight: '10px' }}>hrs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: CONFIGURACIÓN DE PRECIO Y CARD DE VISTA PREVIA */}
          <div style={styles.rightColumn}>
            {/* CONFIGURACIÓN DE PRECIO */}
            <div style={{ ...styles.cardSection, backgroundColor: theme.bgPriceBox, borderColor: '#fef08a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span>💵</span>
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: esOscuro ? '#fef08a' : '#854d0e' }}>
                  Configuración de Precio
                </h3>
              </div>

              <label style={{ ...styles.fieldLabel, color: esOscuro ? '#cbd5e1' : '#854d0e' }}>PRECIO BASE (USD)</label>
              <div style={{ ...styles.priceInputBox, backgroundColor: theme.inputBg, borderColor: theme.border }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: theme.textMain }}>$</span>
                <input
                  type="number"
                  name="precioBase"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.precioBase}
                  onChange={handleChange}
                  style={{ ...styles.priceInput, color: theme.textMain }}
                />
              </div>
              <p style={{ fontSize: '10px', color: theme.textSub, marginTop: '8px', lineHeight: '1.3' }}>
                * Este precio se utilizará como base para el cálculo automático en cotizaciones de clientes.
              </p>
            </div>

            {/* VISTA PREVIA DEL SERVICIO */}
            <div style={{ ...styles.previewCard, backgroundColor: theme.bgCard, borderColor: theme.border }}>
              <div style={styles.previewHeaderDark}>
                <span style={{ fontSize: '24px' }}>🔌</span>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={styles.badgeVistaPrevia}>VISTA PREVIA</span>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#16a34a' }}>${precioFormateado}</span>
                </div>
                <h4 style={{ margin: '8px 0 4px 0', fontSize: '13px', fontWeight: 'bold' }}>
                  {formData.nombreServicio || 'Nombre del Servicio'}
                </h4>
                <p style={{ fontSize: '11px', color: theme.textSub, margin: 0, minHeight: '32px', lineHeight: '1.3' }}>
                  {formData.descripcion || 'La descripción aparecerá aquí conforme escribas...'}
                </p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '10px', color: theme.textSub }}>
                  <span>⏱️ {formData.tiempoEstimado || '0'}h</span>
                  <span>📦 {formData.unidadMedida}</span>
                </div>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              <button type="submit" style={styles.btnAgregarServicio}>
                ➕ Agregar al Servicio
              </button>
              <button
                type="button"
                style={{ ...styles.btnCancelar, backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.textMain }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>

        {/* TARJETAS DE CARACTERÍSTICAS INFERIORES (3 COLUMNAS) */}
        <div style={styles.featureCardsGrid}>
          <div style={{ ...styles.featureCard, backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div style={{ ...styles.featureIconBox, backgroundColor: esOscuro ? '#2e1065' : '#fef3c7', color: '#d97706' }}>✨</div>
            <div>
              <div style={styles.featureTitle}>Sincronización Total</div>
              <div style={{ ...styles.featureDesc, color: theme.textSub }}>
                Los cambios se reflejarán instantáneamente en el módulo de ventas.
              </div>
            </div>
          </div>

          <div style={{ ...styles.featureCard, backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div style={{ ...styles.featureIconBox, backgroundColor: esOscuro ? '#1e3a8a' : '#dbeafe', color: '#2563eb' }}>📊</div>
            <div>
              <div style={styles.featureTitle}>Cálculo de Margen</div>
              <div style={{ ...styles.featureDesc, color: theme.textSub }}>
                Configure costos adicionales para obtener rentabilidad automática.
              </div>
            </div>
          </div>

          <div style={{ ...styles.featureCard, backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div style={{ ...styles.featureIconBox, backgroundColor: esOscuro ? '#064e3b' : '#d1fae5', color: '#059669' }}>📋</div>
            <div>
              <div style={styles.featureTitle}>Control de Stock</div>
              <div style={{ ...styles.featureDesc, color: theme.textSub }}>
                Vincule materiales del almacén a este servicio eléctrico.
              </div>
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
  searchContainer: { width: '320px' },
  topSearchInput: { border: '1px solid', padding: '8px 14px', borderRadius: '20px', width: '100%', outline: 'none', fontSize: '12px', boxSizing: 'border-box' },
  btnThemeToggle: { border: '1px solid', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
  userAvatar: { width: '30px', height: '30px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  headerSection: { display: 'flex', flexDirection: 'column', gap: '2px' },
  pageTitle: { margin: 0, fontSize: '20px', fontWeight: 'bold' },
  pageSubtitle: { margin: 0, fontSize: '11px' },
  formLayout: { display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '20px' },
  leftColumn: { display: 'flex', flexDirection: 'column' },
  rightColumn: { display: 'flex', flexDirection: 'column', gap: '16px' },
  cardSection: { border: '1px solid', borderRadius: '10px', padding: '18px' },
  sectionTitle: { margin: 0, fontSize: '13px', fontWeight: 'bold' },
  fieldLabel: { display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '0.3px' },
  inputField: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid', outline: 'none', fontSize: '12px', boxSizing: 'border-box' },
  textareaField: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid', outline: 'none', fontSize: '12px', resize: 'vertical', boxSizing: 'border-box' },
  selectField: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid', outline: 'none', fontSize: '12px', boxSizing: 'border-box' },
  inputWithSuffix: { display: 'flex', alignItems: 'center', borderRadius: '6px', border: '1px solid', overflow: 'hidden' },
  bareInput: { flex: 1, padding: '10px 12px', border: 'none', background: 'none', outline: 'none', fontSize: '12px' },
  priceInputBox: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '6px', border: '1px solid' },
  priceInput: { width: '100%', border: 'none', background: 'none', outline: 'none', fontSize: '18px', fontWeight: 'bold' },
  previewCard: { border: '1px solid', borderRadius: '10px', overflow: 'hidden' },
  previewHeaderDark: { backgroundColor: '#111c38', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#facc15' },
  badgeVistaPrevia: { backgroundColor: '#dbeafe', color: '#1e40af', fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' },
  btnAgregarServicio: { backgroundColor: '#facc15', border: 'none', color: '#0b1329', padding: '12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', width: '100%' },
  btnCancelar: { border: '1px solid', padding: '10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', width: '100%' },
  featureCardsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '10px' },
  featureCard: { border: '1px solid', borderRadius: '10px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'center' },
  featureIconBox: { width: '34px', height: '34px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '16px', flexShrink: 0 },
  featureTitle: { fontSize: '12px', fontWeight: 'bold', marginBottom: '2px' },
  featureDesc: { fontSize: '10px', lineHeight: '1.3' },
};