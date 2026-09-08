import React, { useContext, useState, useMemo } from 'react';
import { ThemeContext } from '../context/ThemeContext';

export function CrearCotizacion({ onVolver }) {
  // Estado para el tema (usa la prop por defecto, pero permite alternarlo localmente)
  const { theme: temaGlobal, toggleTheme } = useContext(ThemeContext);
  const esModoOscuro = temaGlobal === 'dark';

  // 1. ESTADOS FORMULARIO GENERAL
  const [numCotizacion, setNumCotizacion] = useState('COT-ELEC-2024-001 (Autogenerado)');
  const [fechaEmision, setFechaEmision] = useState('2026-07-26');
  const [cliente, setCliente] = useState('Residencial "Las Palmas" - Administración');
  const [direccion, setDireccion] = useState('Av. Insurgentes Sur 1450, Ciudad de México');
  const [diasVigencia, setDiasVigencia] = useState(30);
  const [descuento, setDescuento] = useState(0);
  const [notas, setNotas] = useState('');

  // 2. ESTADO DE ÍTEMS / FILAS DE TABLA
  const [items, setItems] = useState([
    {
      id: 1,
      descripcion: 'Instalación de Tablero de Distribución Trifásico 200A',
      cantidad: 1,
      precioUnit: 4500.0,
    },
    {
      id: 2,
      descripcion: 'Cable de Cobre THHN Calibre 8 AWG (Rollo 100m)',
      cantidad: 3,
      precioUnit: 2800.0,
    },
  ]);

  // 3. ESTADOS PARA MODALES (VER Y EDITAR)
  const [itemEditar, setItemEditar] = useState(null);
  const [itemVer, setItemVer] = useState(null);

  // 4. MANEJADORES DE ACCIONES
  const handleAgregarFila = () => {
    const nuevoItem = {
      id: Date.now(),
      descripcion: '',
      cantidad: 1,
      precioUnit: 0,
    };
    setItems([...items, nuevoItem]);
  };

  const handleEliminarFila = (id) => {
    if (items.length === 1) {
      alert('La cotización debe tener al menos un ítem.');
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  const handleGuardarEdicion = (e) => {
    e.preventDefault();
    setItems(items.map((item) => (item.id === itemEditar.id ? itemEditar : item)));
    setItemEditar(null);
  };

  // 5. CÁLCULOS DINÁMICOS
  const subtotalProyecto = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.cantidad || 0) * (item.precioUnit || 0), 0);
  }, [items]);

  const total = useMemo(() => {
    return Math.max(0, subtotalProyecto - descuento);
  }, [subtotalProyecto, descuento]);

  const formatMoney = (val) =>
    `$ ${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // PALETA DE COLORES DINÁMICA
  const theme = {
    bg: esModoOscuro ? '#0f172a' : '#f8fafc',
    cardBg: esModoOscuro ? '#182642' : '#ffffff',
    inputBg: esModoOscuro ? '#0b1329' : '#f1f5f9',
    borderColor: esModoOscuro ? '#213459' : '#e2e8f0',
    inputBorder: esModoOscuro ? '#243556' : '#cbd5e1',
    textColor: esModoOscuro ? '#ffffff' : '#0f172a',
    subtextColor: esModoOscuro ? '#94a3b8' : '#64748b',
    labelColor: esModoOscuro ? '#64748b' : '#475569',
    btnSecBg: esModoOscuro ? '#1b2a47' : '#e2e8f0',
    btnSecText: esModoOscuro ? '#ffffff' : '#1e293b',
    btnPriBg: esModoOscuro ? '#facc15' : '#eab308',
    btnPriText: esModoOscuro ? '#0f172a' : '#ffffff',
    tableBorder: esModoOscuro ? '#1b2a47' : '#f1f5f9',
    modalOverlay: 'rgba(0, 0, 0, 0.6)',
    cardShadow: esModoOscuro ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
  };

  return (
    <div style={{ ...styles.container, backgroundColor: theme.bg, color: theme.textColor }}>
      
      {/* HEADER */}
      <div style={styles.topHeader}>
        <div>
          <div style={{ ...styles.breadcrumb, color: theme.subtextColor }}>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={onVolver}>
              Cotizaciones
            </span>{' '}
            &gt; Nueva Cotización Eléctrica
          </div>
          <h1 style={{ ...styles.title, color: theme.textColor }}>Cotización: Proyecto Eléctrico</h1>
        </div>

        <div style={styles.topButtons}>
          {/* Botón cambiar tema */}
          <button
            onClick={toggleTheme}
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
            style={{ ...styles.btnSecondary, backgroundColor: theme.btnSecBg, color: theme.btnSecText, borderColor: theme.borderColor }}
            onClick={() => alert('Convertido a Orden de Servicio')}
          >
            📋 Convertir a Orden de Servicio
          </button>
          <button
            style={{ ...styles.btnPrimary, backgroundColor: theme.btnPriBg, color: theme.btnPriText }}
            onClick={() => alert('¡Cotización Generada con Éxito!')}
          >
            ✈️ Generar Cotización
          </button>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div style={styles.mainGrid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* INFORMACIÓN DEL PROYECTO */}
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.borderColor, boxShadow: theme.cardShadow }}>
            <h2 style={{ ...styles.cardTitle, color: theme.textColor }}>📄 Información del Proyecto</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ ...styles.label, color: theme.labelColor }}>NÚMERO DE COTIZACIÓN</label>
                <input
                  type="text"
                  value={numCotizacion}
                  onChange={(e) => setNumCotizacion(e.target.value)}
                  style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor }}
                />
              </div>
              <div>
                <label style={{ ...styles.label, color: theme.labelColor }}>FECHA DE EMISIÓN</label>
                <input
                  type="date"
                  value={fechaEmision}
                  onChange={(e) => setFechaEmision(e.target.value)}
                  style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ ...styles.label, color: theme.labelColor }}>SELECCIONAR CLIENTE</label>
              <select
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor }}
              >
                <option value='Residencial "Las Palmas" - Administración'>Residencial "Las Palmas" - Administración</option>
                <option value="Constructora Horizonte S.A.">Constructora Horizonte S.A.</option>
                <option value="Industrial Norte C.A.">Industrial Norte C.A.</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ ...styles.label, color: theme.labelColor }}>DIRECCIÓN DEL PROYECTO</label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor }}
              />
            </div>

            <div style={{ width: '200px' }}>
              <label style={{ ...styles.label, color: theme.labelColor }}>DÍAS DE VIGENCIA</label>
              <input
                type="number"
                value={diasVigencia}
                onChange={(e) => setDiasVigencia(parseInt(e.target.value) || 0)}
                style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor }}
              />
            </div>
          </div>

          {/* SERVICIOS Y MATERIALES */}
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.borderColor, boxShadow: theme.cardShadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ ...styles.cardTitle, color: theme.textColor }}>📋 Servicios y Materiales Eléctricos</h2>
              <button onClick={handleAgregarFila} style={styles.btnAgregar}>+ Agregar Fila</button>
            </div>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, textAlign: 'left', width: '45%', color: theme.subtextColor, borderColor: theme.inputBorder }}>DESCRIPCIÓN (SERVICIO/MATERIAL)</th>
                  <th style={{ ...styles.th, width: '10%', color: theme.subtextColor, borderColor: theme.inputBorder }}>CANT.</th>
                  <th style={{ ...styles.th, width: '18%', color: theme.subtextColor, borderColor: theme.inputBorder }}>PRECIO UNIT.</th>
                  <th style={{ ...styles.th, width: '17%', color: theme.subtextColor, borderColor: theme.inputBorder }}>SUBTOTAL</th>
                  <th style={{ ...styles.th, width: '10%', color: theme.subtextColor, borderColor: theme.inputBorder }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const subtotalFila = (item.cantidad || 0) * (item.precioUnit || 0);
                  return (
                    <tr key={item.id}>
                      <td style={{ ...styles.td, borderColor: theme.tableBorder, color: theme.textColor }}>
                        {item.descripcion || <span style={{ color: theme.subtextColor }}>Sin descripción...</span>}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center', borderColor: theme.tableBorder, color: theme.textColor }}>{item.cantidad}</td>
                      <td style={{ ...styles.td, textAlign: 'right', borderColor: theme.tableBorder, color: theme.textColor }}>{formatMoney(item.precioUnit)}</td>
                      <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold', borderColor: theme.tableBorder, color: theme.textColor }}>{formatMoney(subtotalFila)}</td>
                      <td style={{ ...styles.td, borderColor: theme.tableBorder }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button title="Ver Detalle" onClick={() => setItemVer(item)} style={styles.btnIcon}>👁️</button>
                          <button title="Editar" onClick={() => setItemEditar({ ...item })} style={styles.btnIcon}>✏️</button>
                          <button title="Eliminar" onClick={() => handleEliminarFila(item.id)} style={styles.btnIcon}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RESUMEN Y ESTADO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.borderColor, boxShadow: theme.cardShadow }}>
            <h2 style={{ ...styles.cardTitle, color: theme.textColor }}>💳 Resumen de Totales</h2>
            <div style={styles.resumenRow}>
              <span style={{ color: theme.subtextColor }}>Subtotal Proyecto</span>
              <span style={{ color: theme.textColor, fontWeight: '600' }}>{formatMoney(subtotalProyecto)}</span>
            </div>
            <div style={styles.resumenRow}>
              <span style={{ color: theme.subtextColor }}>Descuento ($)</span>
              <input
                type="number"
                min="0"
                value={descuento}
                onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor, width: '100px', textAlign: 'right', padding: '4px 8px' }}
              />
            </div>
            <div style={styles.totalBox}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>TOTAL</span>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>{formatMoney(total)}</div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <label style={{ ...styles.label, color: theme.labelColor }}>NOTAS DE INSTALACIÓN / GARANTÍA</label>
              <textarea
                rows="4"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Especificar normativas..."
                style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor, resize: 'vertical' }}
              ></textarea>
            </div>
          </div>

          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.borderColor, boxShadow: theme.cardShadow }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: theme.textColor }}>Estado del Documento</h3>
            <div style={{ ...styles.progressBarBg, backgroundColor: esModoOscuro ? '#0b1329' : '#e2e8f0' }}>
              <div style={{ ...styles.progressBarFill, width: '85%' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: theme.subtextColor, marginTop: '8px' }}>
              <span>Dirección y servicios completados. Pendiente firma digital.</span>
              <span style={{ color: theme.textColor, fontWeight: 'bold' }}>85%</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL EDICIÓN */}
      {itemEditar && (
        <div style={{ ...styles.modalOverlay, backgroundColor: theme.modalOverlay }}>
          <div style={{ ...styles.modalCard, backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: esModoOscuro ? '#facc15' : '#d97706' }}>✏️ Editar Ítem</h3>
            <form onSubmit={handleGuardarEdicion}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ ...styles.label, color: theme.labelColor }}>DESCRIPCIÓN DEL MATERIAL / SERVICIO</label>
                <input
                  type="text"
                  value={itemEditar.descripcion}
                  onChange={(e) => setItemEditar({ ...itemEditar, descripcion: e.target.value })}
                  style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor }}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ ...styles.label, color: theme.labelColor }}>CANTIDAD</label>
                  <input
                    type="number"
                    min="1"
                    value={itemEditar.cantidad}
                    onChange={(e) => setItemEditar({ ...itemEditar, cantidad: parseFloat(e.target.value) || 0 })}
                    style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor }}
                    required
                  />
                </div>
                <div>
                  <label style={{ ...styles.label, color: theme.labelColor }}>PRECIO UNITARIO ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemEditar.precioUnit}
                    onChange={(e) => setItemEditar({ ...itemEditar, precioUnit: parseFloat(e.target.value) || 0 })}
                    style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor }}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setItemEditar(null)}
                  style={{ ...styles.btnSecondary, backgroundColor: theme.btnSecBg, color: theme.btnSecText, borderColor: theme.borderColor }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ ...styles.btnPrimary, backgroundColor: theme.btnPriBg, color: theme.btnPriText }}
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VISUALIZACIÓN */}
      {itemVer && (
        <div style={{ ...styles.modalOverlay, backgroundColor: theme.modalOverlay }}>
          <div style={{ ...styles.modalCard, backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: esModoOscuro ? '#38bdf8' : '#0284c7' }}>👁️ Detalle del Ítem</h3>
            <div style={{ marginBottom: '10px', fontSize: '14px', color: theme.textColor }}><strong>Descripción:</strong> {itemVer.descripcion}</div>
            <div style={{ marginBottom: '10px', fontSize: '14px', color: theme.textColor }}><strong>Cantidad:</strong> {itemVer.cantidad}</div>
            <div style={{ marginBottom: '10px', fontSize: '14px', color: theme.textColor }}><strong>Precio Unitario:</strong> {formatMoney(itemVer.precioUnit)}</div>
            <div style={{ marginBottom: '20px', fontSize: '14px', color: theme.textColor }}><strong>Subtotal:</strong> {formatMoney(itemVer.cantidad * itemVer.precioUnit)}</div>
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setItemVer(null)}
                style={{ ...styles.btnPrimary, backgroundColor: theme.btnPriBg, color: theme.btnPriText }}
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

// ESTILOS BASE
const styles = {
  container: { padding: '24px', minHeight: '100vh', boxSizing: 'border-box', fontFamily: 'sans-serif', transition: 'all 0.3s ease' },
  topHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  breadcrumb: { fontSize: '12px', marginBottom: '6px' },
  title: { fontSize: '22px', margin: 0, fontWeight: 'bold' },
  topButtons: { display: 'flex', gap: '12px', alignItems: 'center' },
  btnSecondary: { border: '1px solid', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  btnPrimary: { border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  mainGrid: { display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '20px' },
  card: { border: '1px solid', borderRadius: '12px', padding: '20px', transition: 'all 0.3s ease' },
  cardTitle: { margin: '0 0 16px 0', fontSize: '15px', fontWeight: 'bold' },
  label: { display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '6px' },
  input: { width: '100%', border: '1px solid', padding: '10px', borderRadius: '6px', boxSizing: 'border-box', outline: 'none' },
  btnAgregar: { backgroundColor: 'transparent', border: 'none', color: '#0284c7', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { fontSize: '10px', padding: '10px 8px', borderBottom: '1px solid' },
  td: { padding: '12px 8px', borderBottom: '1px solid', fontSize: '13px' },
  btnIcon: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '4px' },
  resumenRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginBottom: '12px' },
  totalBox: { backgroundColor: '#facc15', borderRadius: '8px', padding: '16px', textAlign: 'center', marginTop: '16px' },
  progressBarBg: { height: '8px', borderRadius: '4px', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: '4px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalCard: { width: '400px', padding: '24px', borderRadius: '12px', border: '1px solid', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
};

export default CrearCotizacion;