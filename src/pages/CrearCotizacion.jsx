import React, { useState, useMemo } from 'react';

export function CrearCotizacion() {
  const [pantallaActual, setPantallaActual] = useState('formulario');
  const [esModoOscuro, setEsModoOscuro] = useState(false);
  const [notificacion, setNotificacion] = useState(null);

  // Estados del Emisor
  const [empresa] = useState({
    nombre: 'ElectroServicios Profesionales S.A. de C.V.',
    rfc: 'ESP100225ABC',
    telefono: '+52 55 1234 5678',
    email: 'contacto@electroservicios.com',
  });

  // Estados del Formulario
  const [numCotizacion, setNumCotizacion] = useState('COT-ELEC-2026-001');
  const [fechaEmision, setFechaEmision] = useState('2026-07-26');
  const [cliente, setCliente] = useState('Residencial "Las Palmas" - Administración');
  const [direccion, setDireccion] = useState('Av. Insurgentes Sur 1450, Ciudad de México');
  const [diasVigencia, setDiasVigencia] = useState(30);
  const [descuento, setDescuento] = useState(0);
  const [tasaIva, setTasaIva] = useState(16);
  const [notas, setNotas] = useState('Garantía de 12 meses en mano de obra. Instalación bajo normativas NOM-001-SEDE vigentes.');

  const [listaClientes, setListaClientes] = useState([
    'Residencial "Las Palmas" - Administración',
    'Constructora Horizonte S.A.',
    'Industrial Norte C.A.',
  ]);

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

  const [itemEditar, setItemEditar] = useState(null);
  const [itemVer, setItemVer] = useState(null);

  const mostrarNotificacion = (msj) => {
    setNotificacion(msj);
    setTimeout(() => setNotificacion(null), 3000);
  };

  const handleAgregarFila = () => {
    setItems([
      ...items,
      { id: Date.now(), descripcion: '', cantidad: 1, precioUnit: 0 },
    ]);
  };

  const handleEliminarFila = (id) => {
    if (items.length === 1) {
      mostrarNotificacion('La cotización requiere al menos un ítem.');
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  const handleActualizarItem = (id, campo, valor) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)));
  };

  const handleGuardarEdicionModal = (e) => {
    e.preventDefault();
    setItems(items.map((item) => (item.id === itemEditar.id ? itemEditar : item)));
    setItemEditar(null);
    mostrarNotificacion('Ítem actualizado correctamente.');
  };

  const handleAgregarClientePrompt = () => {
    const nuevo = prompt('Nombre del nuevo cliente:');
    if (nuevo && nuevo.trim()) {
      setListaClientes([...listaClientes, nuevo.trim()]);
      setCliente(nuevo.trim());
    }
  };

  // Cálculos
  const subtotalProyecto = useMemo(
    () => items.reduce((acc, item) => acc + (parseFloat(item.cantidad) || 0) * (parseFloat(item.precioUnit) || 0), 0),
    [items]
  );

  const montoDescuento = useMemo(
    () => Math.min(subtotalProyecto, Math.max(0, parseFloat(descuento) || 0)),
    [subtotalProyecto, descuento]
  );

  const subtotalConDescuento = useMemo(() => subtotalProyecto - montoDescuento, [subtotalProyecto, montoDescuento]);

  const montoIva = useMemo(
    () => (subtotalConDescuento * (parseFloat(tasaIva) || 0)) / 100,
    [subtotalConDescuento, tasaIva]
  );

  const total = useMemo(() => subtotalConDescuento + montoIva, [subtotalConDescuento, montoIva]);

  const formatMoney = (val) =>
    `$ ${(parseFloat(val) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const theme = useMemo(
    () => ({
      bg: esModoOscuro ? '#0f172a' : '#f8fafc',
      cardBg: esModoOscuro ? '#1e293b' : '#ffffff',
      inputBg: esModoOscuro ? '#0f172a' : '#ffffff',
      borderColor: esModoOscuro ? '#334155' : '#e2e8f0',
      inputBorder: esModoOscuro ? '#475569' : '#cbd5e1',
      textColor: esModoOscuro ? '#f8fafc' : '#0f172a',
      subtextColor: esModoOscuro ? '#94a3b8' : '#64748b',
      labelColor: esModoOscuro ? '#cbd5e1' : '#475569',
      btnSecBg: esModoOscuro ? '#334155' : '#ffffff',
      btnSecText: esModoOscuro ? '#ffffff' : '#1e293b',
      btnPriBg: '#ca8a04',
      btnPriText: '#ffffff',
      tableBorder: esModoOscuro ? '#334155' : '#f1f5f9',
      modalOverlay: 'rgba(0, 0, 0, 0.65)',
    }),
    [esModoOscuro]
  );

  if (pantallaActual === 'vista_previa') {
    return (
      <VistaPreviaImpresion
        empresa={empresa}
        numCotizacion={numCotizacion}
        fechaEmision={fechaEmision}
        diasVigencia={diasVigencia}
        cliente={cliente}
        direccion={direccion}
        items={items}
        subtotalProyecto={subtotalProyecto}
        descuento={montoDescuento}
        tasaIva={tasaIva}
        montoIva={montoIva}
        total={total}
        notas={notas}
        formatMoney={formatMoney}
        onVolver={() => setPantallaActual('formulario')}
      />
    );
  }

  return (
    <div style={{ ...styles.container, backgroundColor: theme.bg, color: theme.textColor }}>
      {/* Toast Notificación */}
      {notificacion && (
        <div style={styles.toast}>
          {notificacion}
        </div>
      )}

      {/* Header Corregido */}
      <Header
        esModoOscuro={esModoOscuro}
        setEsModoOscuro={setEsModoOscuro}
        theme={theme}
        onGenerar={() => setPantallaActual('vista_previa')}
        onConvertir={() => mostrarNotificacion('Convertido a Orden de Servicio dinámicamente.')}
      />

      {/* Grid Principal */}
      <div style={styles.mainGrid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <DatosProyectoForm
            theme={theme}
            numCotizacion={numCotizacion}
            setNumCotizacion={setNumCotizacion}
            fechaEmision={fechaEmision}
            setFechaEmision={setFechaEmision}
            cliente={cliente}
            setCliente={setCliente}
            listaClientes={listaClientes}
            onAgregarCliente={handleAgregarClientePrompt}
            direccion={direccion}
            setDireccion={setDireccion}
            diasVigencia={diasVigencia}
            setDiasVigencia={setDiasVigencia}
          />

          <TablaItems
            theme={theme}
            items={items}
            onAgregar={handleAgregarFila}
            onActualizar={handleActualizarItem}
            onEliminar={handleEliminarFila}
            onVer={setItemVer}
            onEditar={setItemEditar}
            formatMoney={formatMoney}
          />
        </div>

        <PanelTotales
          theme={theme}
          subtotalProyecto={subtotalProyecto}
          descuento={descuento}
          setDescuento={setDescuento}
          tasaIva={tasaIva}
          setTasaIva={setTasaIva}
          montoIva={montoIva}
          total={total}
          notas={notas}
          setNotas={setNotas}
          formatMoney={formatMoney}
          esModoOscuro={esModoOscuro}
        />
      </div>

      {/* Modales */}
      {itemEditar && (
        <ModalEditarItem
          theme={theme}
          esModoOscuro={esModoOscuro}
          itemEditar={itemEditar}
          setItemEditar={setItemEditar}
          onGuardar={handleGuardarEdicionModal}
        />
      )}

      {itemVer && (
        <ModalVerItem
          theme={theme}
          esModoOscuro={esModoOscuro}
          itemVer={itemVer}
          onCerrar={() => setItemVer(null)}
          formatMoney={formatMoney}
        />
      )}
    </div>
  );
}

// ==========================================
// SUBCOMPONENTES
// ==========================================

function Header({ esModoOscuro, setEsModoOscuro, theme, onGenerar, onConvertir }) {
  return (
    <div style={styles.topHeader}>
      <div style={{ minWidth: '280px', flex: '1 1 auto' }}>
        <div style={{ ...styles.breadcrumb, color: theme.subtextColor }}>
          Cotizaciones &gt; Nueva Cotización Eléctrica
        </div>
        <h1 style={{ ...styles.title, color: theme.textColor }}>
          Cotización: Proyecto Eléctrico
        </h1>
      </div>

      <div style={styles.topButtons}>
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
            whiteSpace: 'nowrap',
          }}
        >
          {esModoOscuro ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
        </button>

        <button
          style={{ ...styles.btnSecondary, backgroundColor: theme.btnSecBg, color: theme.btnSecText, borderColor: theme.borderColor }}
          onClick={onConvertir}
        >
          📋 Convertir a Orden
        </button>

        <button
          style={{ ...styles.btnPrimary, backgroundColor: theme.btnPriBg, color: theme.btnPriText }}
          onClick={onGenerar}
        >
          ✈️ Generar Cotización
        </button>
      </div>
    </div>
  );
}

function DatosProyectoForm({
  theme,
  numCotizacion,
  setNumCotizacion,
  fechaEmision,
  setFechaEmision,
  cliente,
  setCliente,
  listaClientes,
  onAgregarCliente,
  direccion,
  setDireccion,
  diasVigencia,
  setDiasVigencia,
}) {
  return (
    <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <h2 style={{ ...styles.cardTitle, color: theme.textColor }}>📄 Información del Proyecto</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
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
        <div>
          <label style={{ ...styles.label, color: theme.labelColor }}>DÍAS DE VIGENCIA</label>
          <input
            type="number"
            min="1"
            value={diasVigencia}
            onChange={(e) => setDiasVigencia(parseInt(e.target.value) || 0)}
            style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ ...styles.label, color: theme.labelColor }}>SELECCIONAR CLIENTE</label>
          <button type="button" onClick={onAgregarCliente} style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
            + Nuevo Cliente
          </button>
        </div>
        <select
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor }}
        >
          {listaClientes.map((item, idx) => (
            <option key={idx} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ ...styles.label, color: theme.labelColor }}>DIRECCIÓN DEL PROYECTO</label>
        <input
          type="text"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor }}
        />
      </div>
    </div>
  );
}

function TablaItems({ theme, items, onAgregar, onActualizar, onEliminar, onVer, onEditar, formatMoney }) {
  return (
    <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.borderColor, overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ ...styles.cardTitle, color: theme.textColor }}>📋 Servicios y Materiales Eléctricos</h2>
        <button onClick={onAgregar} style={styles.btnAgregar}>+ Agregar Fila</button>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, textAlign: 'left', width: '45%', color: theme.subtextColor, borderColor: theme.inputBorder }}>DESCRIPCIÓN</th>
            <th style={{ ...styles.th, width: '10%', color: theme.subtextColor, borderColor: theme.inputBorder }}>CANT.</th>
            <th style={{ ...styles.th, width: '18%', color: theme.subtextColor, borderColor: theme.inputBorder }}>PRECIO UNIT.</th>
            <th style={{ ...styles.th, width: '17%', color: theme.subtextColor, borderColor: theme.inputBorder }}>SUBTOTAL</th>
            <th style={{ ...styles.th, width: '10%', color: theme.subtextColor, borderColor: theme.inputBorder }}>ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const subtotalFila = (parseFloat(item.cantidad) || 0) * (parseFloat(item.precioUnit) || 0);
            return (
              <tr key={item.id}>
                <td style={{ ...styles.td, borderColor: theme.tableBorder }}>
                  <input
                    type="text"
                    value={item.descripcion}
                    placeholder="Escriba descripción..."
                    onChange={(e) => onActualizar(item.id, 'descripcion', e.target.value)}
                    style={{ ...styles.tableInput, color: theme.textColor }}
                  />
                </td>
                <td style={{ ...styles.td, textAlign: 'center', borderColor: theme.tableBorder }}>
                  <input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) => onActualizar(item.id, 'cantidad', parseFloat(e.target.value) || 0)}
                    style={{ ...styles.tableInput, textAlign: 'center', color: theme.textColor }}
                  />
                </td>
                <td style={{ ...styles.td, textAlign: 'right', borderColor: theme.tableBorder }}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.precioUnit}
                    onChange={(e) => onActualizar(item.id, 'precioUnit', parseFloat(e.target.value) || 0)}
                    style={{ ...styles.tableInput, textAlign: 'right', color: theme.textColor }}
                  />
                </td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold', borderColor: theme.tableBorder, color: theme.textColor }}>
                  {formatMoney(subtotalFila)}
                </td>
                <td style={{ ...styles.td, borderColor: theme.tableBorder }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <button title="Ver Detalle" onClick={() => onVer(item)} style={styles.btnIcon}>👁️</button>
                    <button title="Editar" onClick={() => onEditar({ ...item })} style={styles.btnIcon}>✏️</button>
                    <button title="Eliminar" onClick={() => onEliminar(item.id)} style={styles.btnIcon}>🗑️</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PanelTotales({ theme, subtotalProyecto, descuento, setDescuento, tasaIva, setTasaIva, montoIva, total, notas, setNotas, formatMoney, esModoOscuro }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
        <h2 style={{ ...styles.cardTitle, color: theme.textColor }}>💳 Resumen de Totales</h2>

        <div style={styles.resumenRow}>
          <span style={{ color: theme.subtextColor }}>Subtotal Bruto</span>
          <span style={{ color: theme.textColor, fontWeight: '600' }}>{formatMoney(subtotalProyecto)}</span>
        </div>

        <div style={styles.resumenRow}>
          <span style={{ color: theme.subtextColor }}>Descuento ($)</span>
          <input
            type="number"
            min="0"
            value={descuento}
            onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
            style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor, width: '90px', textAlign: 'right', padding: '4px 8px' }}
          />
        </div>

        <div style={styles.resumenRow}>
          <span style={{ color: theme.subtextColor }}>IVA (%)</span>
          <input
            type="number"
            min="0"
            max="100"
            value={tasaIva}
            onChange={(e) => setTasaIva(parseFloat(e.target.value) || 0)}
            style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor, width: '90px', textAlign: 'right', padding: '4px 8px' }}
          />
        </div>

        {tasaIva > 0 && (
          <div style={styles.resumenRow}>
            <span style={{ color: theme.subtextColor }}>Monto Impuesto</span>
            <span style={{ color: theme.textColor, fontWeight: '500' }}>{formatMoney(montoIva)}</span>
          </div>
        )}

        <div style={styles.totalBox}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a', letterSpacing: '0.5px' }}>TOTAL NETO</span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', marginTop: '4px' }}>{formatMoney(total)}</div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <label style={{ ...styles.label, color: theme.labelColor }}>NOTAS DE INSTALACIÓN / GARANTÍA</label>
          <textarea
            rows="4"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textColor, resize: 'vertical' }}
          ></textarea>
        </div>
      </div>

      <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: theme.textColor }}>Estado del Documento</h3>
        <div style={{ ...styles.progressBarBg, backgroundColor: esModoOscuro ? '#0b1329' : '#e2e8f0' }}>
          <div style={{ ...styles.progressBarFill, width: '85%' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: theme.subtextColor, marginTop: '8px' }}>
          <span>Dirección y servicios completados</span>
          <span style={{ color: theme.textColor, fontWeight: 'bold' }}>85%</span>
        </div>
      </div>
    </div>
  );
}

function ModalEditarItem({ theme, esModoOscuro, itemEditar, setItemEditar, onGuardar }) {
  return (
    <div style={{ ...styles.modalOverlay, backgroundColor: theme.modalOverlay }}>
      <div style={{ ...styles.modalCard, backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: esModoOscuro ? '#facc15' : '#d97706' }}>✏️ Editar Ítem</h3>
        <form onSubmit={onGuardar}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ ...styles.label, color: theme.labelColor }}>DESCRIPCIÓN</label>
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
            <button type="submit" style={{ ...styles.btnPrimary, backgroundColor: theme.btnPriBg, color: theme.btnPriText }}>
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalVerItem({ theme, esModoOscuro, itemVer, onCerrar, formatMoney }) {
  return (
    <div style={{ ...styles.modalOverlay, backgroundColor: theme.modalOverlay }}>
      <div style={{ ...styles.modalCard, backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: esModoOscuro ? '#38bdf8' : '#0284c7' }}>👁️ Detalle del Ítem</h3>
        <div style={{ marginBottom: '10px', fontSize: '14px', color: theme.textColor }}><strong>Descripción:</strong> {itemVer.descripcion}</div>
        <div style={{ marginBottom: '10px', fontSize: '14px', color: theme.textColor }}><strong>Cantidad:</strong> {itemVer.cantidad}</div>
        <div style={{ marginBottom: '10px', fontSize: '14px', color: theme.textColor }}><strong>Precio Unitario:</strong> {formatMoney(itemVer.precioUnit)}</div>
        <div style={{ marginBottom: '20px', fontSize: '14px', color: theme.textColor }}><strong>Subtotal:</strong> {formatMoney((itemVer.cantidad || 0) * (itemVer.precioUnit || 0))}</div>
        <div style={{ textAlign: 'right' }}>
          <button onClick={onCerrar} style={{ ...styles.btnPrimary, backgroundColor: theme.btnPriBg, color: theme.btnPriText }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function VistaPreviaImpresion({
  empresa,
  numCotizacion,
  fechaEmision,
  diasVigencia,
  cliente,
  direccion,
  items,
  subtotalProyecto,
  descuento,
  tasaIva,
  montoIva,
  total,
  notas,
  formatMoney,
  onVolver,
}) {
  return (
    <div style={{ padding: '30px', backgroundColor: '#525659', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background-color: white !important; }
          .printable-area { box-shadow: none !important; padding: 0 !important; width: 100% !important; }
        }
      `}</style>

      <div className="no-print" style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button
          onClick={onVolver}
          style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ✏️ Volver a Editar
        </button>

        <button
          onClick={() => window.print()}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#ca8a04', color: '#ffffff', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🖨️ Imprimir / Guardar en PDF
        </button>
      </div>

      <div className="printable-area" style={{ width: '100%', maxWidth: '800px', backgroundColor: '#ffffff', padding: '40px', borderRadius: '8px', color: '#0f172a', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: 'bold' }}>{empresa.nombre}</h1>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '12px' }}>RFC: {empresa.rfc}</p>
            <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '12px' }}>Tel: {empresa.telefono} | Email: {empresa.email}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, color: '#ca8a04', fontSize: '18px' }}>{numCotizacion}</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Fecha: {fechaEmision}</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Vigencia: {diasVigencia} días</p>
          </div>
        </div>

        <div style={{ marginBottom: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>DATOS DEL CLIENTE</p>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{cliente}</div>
          <div style={{ fontSize: '13px', color: '#334155', marginTop: '4px' }}>{direccion}</div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #0f172a', textAlign: 'left', fontSize: '11px', color: '#475569' }}>
              <th style={{ padding: '8px 0' }}>DESCRIPCIÓN</th>
              <th style={{ padding: '8px 0', textAlign: 'center' }}>CANT.</th>
              <th style={{ padding: '8px 0', textAlign: 'right' }}>PRECIO UNIT.</th>
              <th style={{ padding: '8px 0', textAlign: 'right' }}>SUBTOTAL</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                <td style={{ padding: '10px 0' }}>{item.descripcion || 'Sin descripción'}</td>
                <td style={{ padding: '10px 0', textAlign: 'center' }}>{item.cantidad}</td>
                <td style={{ padding: '10px 0', textAlign: 'right' }}>{formatMoney(item.precioUnit)}</td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 'bold' }}>{formatMoney((item.cantidad || 0) * (item.precioUnit || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
          <div style={{ width: '240px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
              <span>Subtotal:</span>
              <span>{formatMoney(subtotalProyecto)}</span>
            </div>
            {descuento > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#ef4444', marginBottom: '6px' }}>
                <span>Descuento:</span>
                <span>- {formatMoney(descuento)}</span>
              </div>
            )}
            {tasaIva > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                <span>IVA ({tasaIva}%):</span>
                <span>{formatMoney(montoIva)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', borderTop: '2px solid #0f172a', paddingTop: '8px', color: '#0f172a' }}>
              <span>Total:</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>
        </div>

        {notas && (
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', fontSize: '12px', color: '#64748b' }}>
            <strong>Notas y Términos:</strong>
            <p style={{ margin: '4px 0 0 0', whiteSpace: 'pre-line' }}>{notas}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ESTILOS INLINE
const styles = {
  container: {
    padding: '24px',
    minHeight: '100vh',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  topHeader: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
    width: '100%',
  },
  breadcrumb: { fontSize: '12px', marginBottom: '4px' },
  title: { fontSize: '22px', margin: 0, fontWeight: 'bold', whiteSpace: 'nowrap' },
  topButtons: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto' },
  btnSecondary: { border: '1px solid', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap' },
  btnPrimary: { border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap' },
  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' },
  card: { border: '1px solid', borderRadius: '12px', padding: '20px', boxSizing: 'border-box' },
  cardTitle: { margin: '0 0 16px 0', fontSize: '15px', fontWeight: 'bold' },
  label: { display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '0.5px' },
  input: { width: '100%', border: '1px solid', padding: '10px', borderRadius: '6px', boxSizing: 'border-box', outline: 'none' },
  tableInput: { width: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '4px', fontSize: '13px' },
  btnAgregar: { backgroundColor: 'transparent', border: 'none', color: '#0284c7', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '450px' },
  th: { fontSize: '10px', padding: '10px 8px', borderBottom: '1px solid' },
  td: { padding: '8px', borderBottom: '1px solid', fontSize: '13px' },
  btnIcon: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '4px' },
  resumenRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginBottom: '12px' },
  totalBox: { backgroundColor: '#facc15', borderRadius: '8px', padding: '16px', textAlign: 'center', marginTop: '16px' },
  progressBarBg: { height: '8px', borderRadius: '4px', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: '4px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalCard: { width: '400px', padding: '24px', borderRadius: '12px', border: '1px solid', boxSizing: 'border-box' },
  toast: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 9999,
    fontSize: '13px',
    fontWeight: 'bold',
  },
};

export default CrearCotizacion;