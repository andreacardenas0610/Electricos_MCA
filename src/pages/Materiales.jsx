import React, { useState } from 'react';

export function Materiales() {
  const [busqueda, setBusqueda] = useState('');
  const [itemEditar, setItemEditar] = useState(null);
  const [esModoOscuro, setEsModoOscuro] = useState(false); // Estado para alternar el tema
  
  // ESTADO PARA EL MODAL DE NUEVA ENTRADA
  const [modalNuevaEntrada, setModalNuevaEntrada] = useState(false);
  const [nuevoMaterial, setNuevoMaterial] = useState({
    nombre: '',
    categoria: 'Conductores',
    id: '',
    stock: 0,
    unidad: 'unidades',
    estado: 'Óptimo'
  });

  // 1. DATOS DEL INVENTARIO EN VIVO
  const [materiales, setMateriales] = useState([
    { id: 'EL-BUS-585', nombre: 'Barra de Cobre 50x5mm', categoria: 'Conductores', stock: 142, unidad: 'm', estado: 'Óptimo' },
    { id: 'EL-CB-1003', nombre: 'Interruptor 3P 100A', categoria: 'Aparamenta', stock: 0, unidad: 'unidades', estado: 'Bajo Stock' },
    { id: 'EL-CAB-254', nombre: 'Cable XLPE 4C 25mm²', categoria: 'Cables', stock: 450, unidad: 'm', estado: 'Óptimo' },
    { id: 'EL-CON-025', nombre: 'Conducto PVC 25mm', categoria: 'Canalización', stock: 1200, unidad: 'm', estado: 'Óptimo' },
    { id: 'EL-TRF-002', nombre: 'Transformador Control 2kVA', categoria: 'Transformadores', stock: 2, unidad: 'unidades', estado: 'Crítico' },
    { id: 'EL-ACC-TRM4', nombre: 'Bloques Terminales 4mm²', categoria: 'Accesorios', stock: 2400, unidad: 'pz', estado: 'Óptimo' },
  ]);

  // PALETA DE COLORES DINÁMICA
  const theme = {
    bg: esModoOscuro ? '#0f172a' : '#f8fafc',
    cardBg: esModoOscuro ? '#182642' : '#ffffff',
    cardAuditoriaBg: esModoOscuro ? '#1b2a47' : '#f1f5f9',
    inputBg: esModoOscuro ? '#0b1329' : '#f1f5f9',
    borderColor: esModoOscuro ? '#213459' : '#e2e8f0',
    inputBorder: esModoOscuro ? '#243556' : '#cbd5e1',
    textColor: esModoOscuro ? '#ffffff' : '#0f172a',
    subtextColor: esModoOscuro ? '#94a3b8' : '#64748b',
    labelColor: esModoOscuro ? '#64748b' : '#475569',
    btnPrimaryBg: esModoOscuro ? '#facc15' : '#eab308',
    btnPrimaryText: esModoOscuro ? '#0f172a' : '#ffffff',
    btnSecBg: esModoOscuro ? '#1b2a47' : '#e2e8f0',
    btnSecText: esModoOscuro ? '#ffffff' : '#1e293b',
    alertBoxBg: esModoOscuro ? '#0b1329' : '#fef2f2',
    tableBorder: esModoOscuro ? '#1b2a47' : '#f1f5f9',
    cardShadow: esModoOscuro ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
  };

  // 2. ALTERNAR ESTADO (TOGGLE AL HACER CLIC EN EL BOTÓN)
  const toggleEstado = (id) => {
    setMateriales(
      materiales.map((item) => {
        if (item.id === id) {
          let siguienteEstado = 'Óptimo';
          if (item.estado === 'Óptimo') siguienteEstado = 'Bajo Stock';
          else if (item.estado === 'Bajo Stock') siguienteEstado = 'Crítico';
          else if (item.estado === 'Crítico') siguienteEstado = 'Óptimo';

          return { ...item, estado: siguienteEstado };
        }
        return item;
      })
    );
  };

  // 3. ELIMINAR MATERIAL
  const handleEliminarMaterial = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este material?')) {
      setMateriales(materiales.filter((item) => item.id !== id));
    }
  };

  // 4. GUARDAR EDICIÓN DESDE MODAL
  const handleGuardarEdicion = (e) => {
    e.preventDefault();
    setMateriales(
      materiales.map((m) => (m.id === itemEditar.id ? itemEditar : m))
    );
    setItemEditar(null);
  };

  // 5. REGISTRAR NUEVA ENTRADA
  const handleCrearMaterial = (e) => {
    e.preventDefault();
    if (!nuevoMaterial.nombre || !nuevoMaterial.id) {
      alert('Por favor completa los campos obligatorios (Nombre e ID).');
      return;
    }

    setMateriales([nuevoMaterial, ...materiales]);
    
    // Resetear formulario y cerrar modal
    setNuevoMaterial({
      nombre: '',
      categoria: 'Conductores',
      id: '',
      stock: 0,
      unidad: 'unidades',
      estado: 'Óptimo'
    });
    setModalNuevaEntrada(false);
  };

  const materialesFiltrados = materiales.filter((mat) =>
    mat.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    mat.categoria.toLowerCase().includes(busqueda.toLowerCase()) ||
    mat.id.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ ...styles.container, backgroundColor: theme.bg, color: theme.textColor }}>
      
      {/* HEADER CON BOTÓN DE TEMA */}
      <div style={styles.topHeader}>
        <div>
          <h1 style={{ ...styles.title, color: theme.textColor }}>Gestión de Materiales</h1>
          <p style={{ ...styles.subtitle, color: theme.subtextColor }}>Monitoreo y administración de componentes eléctricos industriales y flujo de inventario.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setEsModoOscuro(!esModoOscuro)}
            style={{
              backgroundColor: theme.cardBg,
              color: theme.textColor,
              border: `1px solid ${theme.borderColor}`,
              padding: '8px 14px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            {esModoOscuro ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
          </button>
          <button
            style={{ ...styles.btnNuevaEntrada, backgroundColor: theme.btnPrimaryBg, color: theme.btnPrimaryText }}
            onClick={() => setModalNuevaEntrada(true)}
          >
            ➕ Nueva Entrada
          </button>
        </div>
      </div>

      {/* METRICAS */}
      <div style={styles.metricsGrid}>
        <div style={{ ...styles.metricCard, backgroundColor: theme.cardBg, borderColor: theme.borderColor, boxShadow: theme.cardShadow }}>
          <div style={styles.metricHeader}>
            <span style={styles.iconBox}>📦</span>
            <span style={styles.badgeGreen}>+2.4%</span>
          </div>
          <div style={{ ...styles.metricLabel, color: theme.subtextColor }}>SKUS TOTALES</div>
          <div style={{ ...styles.metricValue, color: theme.textColor }}>{materiales.length}</div>
        </div>

        <div style={{ ...styles.metricCard, backgroundColor: theme.cardBg, borderColor: theme.borderColor, boxShadow: theme.cardShadow }}>
          <div style={styles.metricHeader}>
            <span style={{ ...styles.iconBox, color: '#ef4444' }}>⚠️</span>
            <span style={styles.badgeRed}>Crítico</span>
          </div>
          <div style={{ ...styles.metricLabel, color: theme.subtextColor }}>STOCK BAJO</div>
          <div style={{ ...styles.metricValue, color: esModoOscuro ? '#f87171' : '#dc2626' }}>
            {materiales.filter((m) => m.estado === 'Crítico' || m.estado === 'Bajo Stock').length}
          </div>
        </div>

        <div style={{ ...styles.metricCard, backgroundColor: theme.cardBg, borderColor: theme.borderColor, boxShadow: theme.cardShadow }}>
          <div style={styles.metricHeader}>
            <span style={styles.iconBox}>📤</span>
            <span style={{ ...styles.timeText, color: theme.subtextColor }}>Act. hace 10m</span>
          </div>
          <div style={{ ...styles.metricLabel, color: theme.subtextColor }}>SALIDAS HOY</div>
          <div style={{ ...styles.metricValue, color: theme.textColor }}>48</div>
        </div>

        <div style={{ ...styles.auditoriaCard, backgroundColor: theme.cardAuditoriaBg, borderColor: theme.borderColor, boxShadow: theme.cardShadow }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: theme.textColor }}>Auditoría de Inventario</h4>
          <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: theme.subtextColor, lineHeight: '1.4' }}>
            Iniciar revisión física programada para la Sección B.
          </p>
          <button
            style={{ ...styles.btnAuditoria, backgroundColor: theme.btnPrimaryBg, color: theme.btnPrimaryText }}
            onClick={() => alert('Iniciando Auditoría...')}
          >
            Iniciar Auditoría
          </button>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div style={styles.mainGrid}>
        <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.borderColor, boxShadow: theme.cardShadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ ...styles.cardTitle, color: theme.textColor }}>Inventario en Vivo</h3>
            <input
              type="text"
              placeholder="🔍 Buscar materiales, IDs..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                ...styles.searchInput,
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.textColor
              }}
            />
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, color: theme.subtextColor, borderColor: theme.inputBorder }}>NOMBRE DEL ÍTEM</th>
                <th style={{ ...styles.th, color: theme.subtextColor, borderColor: theme.inputBorder }}>CATEGORÍA</th>
                <th style={{ ...styles.th, color: theme.subtextColor, borderColor: theme.inputBorder }}>ID</th>
                <th style={{ ...styles.th, color: theme.subtextColor, borderColor: theme.inputBorder, textAlign: 'right' }}>NIVEL DE STOCK</th>
                <th style={{ ...styles.th, color: theme.subtextColor, borderColor: theme.inputBorder, textAlign: 'center' }}>ESTADO</th>
                <th style={{ ...styles.th, color: theme.subtextColor, borderColor: theme.inputBorder, textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {materialesFiltrados.map((item) => (
                <tr key={item.id}>
                  <td style={{ ...styles.tdName, color: theme.textColor, borderColor: theme.tableBorder }}>{item.nombre}</td>
                  <td style={{ ...styles.tdCategory, color: theme.subtextColor, borderColor: theme.tableBorder }}>{item.categoria}</td>
                  <td style={{ ...styles.tdId, color: theme.subtextColor, borderColor: theme.tableBorder }}>{item.id}</td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold', color: theme.textColor, borderColor: theme.tableBorder }}>
                    {item.stock} {item.unidad}
                  </td>
                  
                  <td style={{ ...styles.td, textAlign: 'center', borderColor: theme.tableBorder }}>
                    <button
                      onClick={() => toggleEstado(item.id)}
                      title="Haz clic para cambiar el estado"
                      style={getToggleButtonStyle(item.estado)}
                    >
                      <span style={getToggleCircleStyle(item.estado)}></span>
                      <span style={{ zIndex: 1 }}>{item.estado}</span>
                    </button>
                  </td>

                  <td style={{ ...styles.td, textAlign: 'center', borderColor: theme.tableBorder }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        title="Editar Material"
                        onClick={() => setItemEditar({ ...item })}
                        style={styles.btnIcon}
                      >
                        ✏️
                      </button>
                      <button
                        title="Eliminar Material"
                        onClick={() => handleEliminarMaterial(item.id)}
                        style={styles.btnIcon}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={styles.tableFooter}>
            <span style={{ color: theme.subtextColor }}>Mostrando {materialesFiltrados.length} de {materiales.length} materiales</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button style={{ ...styles.btnPaging, backgroundColor: theme.btnSecBg, color: theme.btnSecText, borderColor: theme.borderColor }}>Anterior</button>
              <button style={{ ...styles.btnPaging, backgroundColor: theme.btnSecBg, color: theme.btnSecText, borderColor: theme.borderColor }}>Siguiente</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.borderColor, boxShadow: theme.cardShadow }}>
            <h3 style={{ ...styles.cardTitle, color: '#ef4444' }}>⚠️ Alertas Críticas</h3>
            <div style={{ ...styles.alertBox, backgroundColor: theme.alertBoxBg }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
                <span style={{ color: theme.textColor }}>Fusible Industrial 63A</span>
                <span style={{ color: '#ef4444' }}>Quedan 2</span>
              </div>
              <p style={{ ...styles.alertText, color: theme.subtextColor }}>Stock de seguridad mínimo (15) superado.</p>
              <a href="#orden" onClick={() => alert('Generando Orden...')} style={styles.alertLink}>Generar Orden &gt;</a>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: NUEVA ENTRADA DE MATERIAL */}
      {modalNuevaEntrada && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalCard, backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textColor }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: esModoOscuro ? '#facc15' : '#d97706' }}>➕ Nueva Entrada de Material</h3>
            <form onSubmit={handleCrearMaterial}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ ...styles.label, color: theme.labelColor }}>NOMBRE DEL MATERIAL</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cable Cobre 10mm²"
                  value={nuevoMaterial.nombre}
                  onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, nombre: e.target.value })}
                  style={{ ...styles.inputModal, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ ...styles.label, color: theme.labelColor }}>CÓDIGO / ID</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: EL-CAB-99"
                    value={nuevoMaterial.id}
                    onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, id: e.target.value })}
                    style={{ ...styles.inputModal, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor }}
                  />
                </div>
                <div>
                  <label style={{ ...styles.label, color: theme.labelColor }}>CATEGORÍA</label>
                  <select
                    value={nuevoMaterial.categoria}
                    onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, categoria: e.target.value })}
                    style={{ ...styles.inputModal, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor }}
                  >
                    <option value="Conductores">Conductores</option>
                    <option value="Aparamenta">Aparamenta</option>
                    <option value="Cables">Cables</option>
                    <option value="Canalización">Canalización</option>
                    <option value="Transformadores">Transformadores</option>
                    <option value="Accesorios">Accesorios</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ ...styles.label, color: theme.labelColor }}>STOCK INICIAL</label>
                  <input
                    type="number"
                    min="0"
                    value={nuevoMaterial.stock}
                    onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, stock: parseInt(e.target.value) || 0 })}
                    style={{ ...styles.inputModal, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor }}
                  />
                </div>
                <div>
                  <label style={{ ...styles.label, color: theme.labelColor }}>UNIDAD DE MEDIDA</label>
                  <input
                    type="text"
                    placeholder="m, pz, unidades"
                    value={nuevoMaterial.unidad}
                    onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, unidad: e.target.value })}
                    style={{ ...styles.inputModal, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ ...styles.label, color: theme.labelColor }}>ESTADO INICIAL</label>
                <select
                  value={nuevoMaterial.estado}
                  onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, estado: e.target.value })}
                  style={{ ...styles.inputModal, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor }}
                >
                  <option value="Óptimo">Óptimo</option>
                  <option value="Bajo Stock">Bajo Stock</option>
                  <option value="Crítico">Crítico</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setModalNuevaEntrada(false)} style={{ ...styles.btnSecondary, backgroundColor: theme.btnSecBg, color: theme.btnSecText, borderColor: theme.borderColor }}>Cancelar</button>
                <button type="submit" style={{ ...styles.btnPrimary, backgroundColor: theme.btnPrimaryBg, color: theme.btnPrimaryText }}>Registrar Entrada</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR MATERIAL EXISTENTE */}
      {itemEditar && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalCard, backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textColor }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: esModoOscuro ? '#facc15' : '#d97706' }}>✏️ Actualizar Material</h3>
            <form onSubmit={handleGuardarEdicion}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ ...styles.label, color: theme.labelColor }}>NOMBRE DEL MATERIAL</label>
                <input type="text" value={itemEditar.nombre} onChange={(e) => setItemEditar({ ...itemEditar, nombre: e.target.value })} style={{ ...styles.inputModal, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ ...styles.label, color: theme.labelColor }}>NIVEL DE STOCK</label>
                  <input type="number" min="0" value={itemEditar.stock} onChange={(e) => setItemEditar({ ...itemEditar, stock: parseInt(e.target.value) || 0 })} style={{ ...styles.inputModal, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor }} />
                </div>
                <div>
                  <label style={{ ...styles.label, color: theme.labelColor }}>UNIDAD DE MEDIDA</label>
                  <input type="text" value={itemEditar.unidad} onChange={(e) => setItemEditar({ ...itemEditar, unidad: e.target.value })} style={{ ...styles.inputModal, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setItemEditar(null)} style={{ ...styles.btnSecondary, backgroundColor: theme.btnSecBg, color: theme.btnSecText, borderColor: theme.borderColor }}>Cancelar</button>
                <button type="submit" style={{ ...styles.btnPrimary, backgroundColor: theme.btnPrimaryBg, color: theme.btnPrimaryText }}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ESTILOS DINÁMICOS DEL BOTÓN SWITCH INTERACTIVO
const getToggleButtonStyle = (estado) => {
  const base = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: estado === 'Óptimo' ? 'flex-end' : 'flex-start',
    width: '105px',
    height: '28px',
    borderRadius: '16px',
    border: 'none',
    padding: '0 10px',
    fontSize: '10px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    outline: 'none',
  };

  if (estado === 'Óptimo') return { ...base, backgroundColor: '#dcfce7', color: '#166534' };
  if (estado === 'Bajo Stock') return { ...base, backgroundColor: '#fef3c7', color: '#92400e'};
  if (estado === 'Crítico') return { ...base, backgroundColor: '#fee2e2', color: '#b91c1c'};
  return base;
};

const getToggleCircleStyle = (estado) => {
  return {
    position: 'absolute',
    top: '3px',
    left: estado === 'Óptimo' ? '4px' : estado === 'Bajo Stock' ? '41px' : '78px',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  };
};

const styles = {
  container: { padding: '24px', minHeight: '100vh', boxSizing: 'border-box', fontFamily: 'sans-serif', transition: 'all 0.3s ease' },
  topHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { fontSize: '22px', margin: 0, fontWeight: 'bold' },
  subtitle: { fontSize: '12px', margin: '4px 0 0 0' },
  btnNuevaEntrada: { border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
  metricsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.2fr', gap: '16px', marginBottom: '20px' },
  metricCard: { border: '1px solid', borderRadius: '12px', padding: '16px', transition: 'all 0.3s ease' },
  metricHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  iconBox: { fontSize: '16px' },
  badgeGreen: { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' },
  badgeRed: { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' },
  timeText: { fontSize: '10px' },
  metricLabel: { fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.5px' },
  metricValue: { fontSize: '26px', fontWeight: 'bold', marginTop: '4px' },
  auditoriaCard: { border: '1px solid', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: 'all 0.3s ease' },
  btnAuditoria: { border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' },
  mainGrid: { display: 'grid', gridTemplateColumns: '2.4fr 1fr', gap: '20px', marginBottom: '20px' },
  card: { border: '1px solid', borderRadius: '12px', padding: '20px', transition: 'all 0.3s ease' },
  cardTitle: { margin: 0, fontSize: '15px', fontWeight: 'bold' },
  searchInput: { border: '1px solid', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', outline: 'none', width: '200px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '12px' },
  th: { fontSize: '10px', padding: '10px 8px', borderBottom: '1px solid', textAlign: 'left', fontWeight: 'bold' },
  td: { padding: '12px 8px', borderBottom: '1px solid', fontSize: '12px' },
  tdName: { padding: '12px 8px', borderBottom: '1px solid', fontSize: '12px', fontWeight: 'bold' },
  tdCategory: { padding: '12px 8px', borderBottom: '1px solid', fontSize: '12px' },
  tdId: { padding: '12px 8px', borderBottom: '1px solid', fontSize: '11px', fontFamily: 'monospace' },
  btnIcon: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '4px' },
  tableFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '11px' },
  btnPaging: { border: '1px solid', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' },
  alertBox: { borderLeft: '3px solid #ef4444', borderRadius: '6px', padding: '12px', marginTop: '12px' },
  alertText: { fontSize: '11px', margin: '6px 0 8px 0', lineHeight: '1.4' },
  alertLink: { fontSize: '11px', color: '#ef4444', textDecoration: 'none', fontWeight: 'bold' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalCard: { border: '1px solid', borderRadius: '12px', padding: '24px', width: '420px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
  label: { display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' },
  inputModal: { width: '100%', border: '1px solid', padding: '8px', borderRadius: '6px', boxSizing: 'border-box', outline: 'none', fontSize: '12px' },
  btnSecondary: { border: '1px solid', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  btnPrimary: { border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
};

export default Materiales;