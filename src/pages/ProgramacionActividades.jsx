import React, { useContext, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext.jsx';

// ICONOS SVG ACCIONES (OJO, LÁPIZ, CANECA) Y NAVEGACIÓN
const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const INITIAL_SERVICIOS = [
  {
    id: 1,
    codigo: 'OT-1092',
    cliente: 'Corporativo Andes S.A.',
    sede: 'Sede Industrial Sur',
    tecnico: 'Carlos Mendoza',
    fecha: '2026-09-10',
    horaInicio: '08:00',
    horaFin: '12:00',
    prioridad: 'Alta',
    estado: 'Programado',
  },
  {
    id: 2,
    codigo: 'OT-1093',
    cliente: 'Minera El Rosario',
    sede: 'Planta Principal',
    tecnico: 'Jorge Rivera',
    fecha: '2026-09-11',
    horaInicio: '10:30',
    horaFin: '14:30',
    prioridad: 'Media',
    estado: 'En Proceso',
  },
  {
    id: 3,
    codigo: 'OT-1094',
    cliente: 'ElectroSur Perú',
    sede: 'Subestación Central',
    tecnico: 'Andrés López',
    fecha: '2026-09-12',
    horaInicio: '14:00',
    horaFin: '18:00',
    prioridad: 'Baja',
    estado: 'Completado',
  },
];

export  function ProgramacionActividades() {
  const { theme: temaGlobal, toggleTheme } = useContext(ThemeContext);
  const esOscuro = temaGlobal === 'dark';
  const colores = esOscuro
    ? { fondo: '#0b1329', tarjeta: '#111c38', texto: '#f8fafc', secundario: '#94a3b8', borde: '#1e2d4a', entrada: '#0b1329' }
    : { fondo: '#f8fafc', tarjeta: '#ffffff', texto: '#0f172a', secundario: '#64748b', borde: '#e2e8f0', entrada: '#ffffff' };
  const [servicios, setServicios] = useState(INITIAL_SERVICIOS);
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [modoVista, setModoVista] = useState('tabla'); // 'tabla' o 'calendario'

  // Modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalDetalles, setModalDetalles] = useState(false);

  // Formulario / Selección
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '',
    cliente: '',
    sede: '',
    tecnico: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    prioridad: 'Media',
    estado: 'Programado',
  });

  // Abrir modal de creación (Incluso desde el calendario)
  const handleNuevo = (fechaInicial = '') => {
    const nuevoCodigo = `OT-${1095 + servicios.length}`;
    setFormData({
      codigo: nuevoCodigo,
      cliente: '',
      sede: '',
      tecnico: '',
      fecha: fechaInicial || new Date().toISOString().split('T')[0],
      horaInicio: '08:00',
      horaFin: '12:00',
      prioridad: 'Media',
      estado: 'Programado',
    });
    setModalAbierto(true);
  };

  const handleEditar = (serv) => {
    setServicioSeleccionado(serv);
    setFormData({ ...serv });
    setModalEditar(true);
  };

  const handleVerDetalles = (serv) => {
    setServicioSeleccionado(serv);
    setModalDetalles(true);
  };

  const handleGuardarCambios = (e) => {
    e.preventDefault();
    setServicios(servicios.map((s) => (s.id === servicioSeleccionado.id ? { ...formData } : s)));
    setModalEditar(false);
  };

  const handleGuardarNuevo = (e) => {
    e.preventDefault();
    const nuevoRegistro = {
      ...formData,
      id: Date.now(),
    };
    setServicios([nuevoRegistro, ...servicios]);
    setModalAbierto(false);
  };

  const handleEliminar = (id) => {
    if (window.confirm('¿Está seguro de eliminar esta orden de trabajo?')) {
      setServicios(servicios.filter((s) => s.id !== id));
    }
  };

  const serviciosFiltrados = servicios.filter((s) => {
    const coincideFiltro = filtroEstado === 'Todos' || s.estado === filtroEstado;
    const coincideBusqueda =
      s.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.tecnico.toLowerCase().includes(busqueda.toLowerCase());
    return coincideFiltro && coincideBusqueda;
  });

  // Generador de la cuadrícula del calendario
  const renderCalendario = () => {
    const diasMes = Array.from({ length: 30 }, (_, i) => {
      const dia = (i + 1).toString().padStart(2, '0');
      return `2026-09-${dia}`;
    });

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginTop: '16px' }}>
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia) => (
          <div key={dia} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px', color: '#64748b', paddingBottom: '8px' }}>
            {dia}
          </div>
        ))}
        {diasMes.map((fecha) => {
          const eventosDelDia = serviciosFiltrados.filter((s) => s.fecha === fecha);
          return (
            <div
              key={fecha}
              onClick={() => handleNuevo(fecha)}
              style={{
                minHeight: '90px',
                backgroundColor: colores.tarjeta,
                border: `1px solid ${colores.borde}`,
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px' }}>
                {fecha.split('-')[2]}
              </div>
              {eventosDelDia.map((item) => (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVerDetalles(item);
                  }}
                  style={{
                    backgroundColor: item.estado === 'Completado' ? '#dcfce7' : item.estado === 'En Proceso' ? '#e0f2fe' : '#fef3c7',
                    color: item.estado === 'Completado' ? '#166534' : item.estado === 'En Proceso' ? '#075985' : '#854d0e',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.codigo} - {item.tecnico}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  const kpiCard = () => ({
    ...styles.kpiCard,
    backgroundColor: colores.tarjeta,
    borderColor: colores.borde,
  });

  return (
    <div className="schedule-page" style={{ backgroundColor: esOscuro ? '#0b1329' : '#f8fafc', color: esOscuro ? '#f8fafc' : '#0f172a', minHeight: '100vh', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* BARRA SUPERIOR CON BUSCADOR Y BOTÓN CREAR */}
      <div className="schedule-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ position: 'relative', width: '380px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '10px' }}>
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Buscar por código, cliente o técnico..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 38px',
              borderRadius: '20px',
              border: `1px solid ${colores.borde}`,
              backgroundColor: colores.entrada,
              color: colores.texto,
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button type="button" onClick={toggleTheme} style={{ backgroundColor: esOscuro ? '#1e293b' : '#ffffff', color: esOscuro ? '#ffffff' : '#0f172a', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          {esOscuro ? '☀️ Claro' : '🌙 Oscuro'}
        </button>

        <button
          onClick={() => handleNuevo()}
          style={{
            backgroundColor: '#facc15',
            color: colores.texto,
            border: 'none',
            padding: '10px 20px',
            borderRadius: '20px',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          + AGENDAR NUEVA OT
        </button>
      </div>

      {/* HEADER Y SELECTOR DE VISTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: colores.texto }}>
            Programación de Actividades
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: colores.secundario }}>
            Asignación de cuadrillas y órdenes de trabajo de campo
          </p>
        </div>

        {/* SELECTOR DE VISTA: TABLA O CALENDARIO */}
        <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '8px', padding: '3px' }}>
          <button
            onClick={() => setModoVista('tabla')}
            style={{
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              backgroundColor: modoVista === 'tabla' ? '#ffffff' : 'transparent',
              color: modoVista === 'tabla' ? '#0f172a' : '#64748b',
            }}
          >
            Tabla
          </button>
          <button
            onClick={() => setModoVista('calendario')}
            style={{
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              backgroundColor: modoVista === 'calendario' ? '#ffffff' : 'transparent',
              color: modoVista === 'calendario' ? '#0f172a' : '#64748b',
            }}
          >
            Calendario
          </button>
        </div>
      </div>

      {/* TARJETAS KPI RESUMEN */}
      <div className="schedule-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={kpiCard()}>
          <span style={styles.kpiLabel}>TOTAL ACTIVIDADES</span>
          <div style={{ ...styles.kpiValue, color: esOscuro ? '#f8fafc' : '#0f172a' }}>{servicios.length}</div>
        </div>
        <div style={kpiCard()}>
          <span style={styles.kpiLabel}>PROGRAMADAS</span>
          <div style={{ ...styles.kpiValue, color: '#3b82f6' }}>
            {servicios.filter((s) => s.estado === 'Programado').length}
          </div>
        </div>
        <div style={kpiCard()}>
          <span style={styles.kpiLabel}>EN PROCESO</span>
          <div style={{ ...styles.kpiValue, color: '#f59e0b' }}>
            {servicios.filter((s) => s.estado === 'En Proceso').length}
          </div>
        </div>
        <div style={kpiCard()}>
          <span style={styles.kpiLabel}>COMPLETADAS</span>
          <div style={{ ...styles.kpiValue, color: '#22c55e' }}>
            {servicios.filter((s) => s.estado === 'Completado').length}
          </div>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="schedule-table-wrap" style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', border: `1px solid ${colores.borde}`, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflowX: 'auto' }}>
        
        {/* PESTAÑAS DE FILTRO RÁPIDO */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {['Todos', 'Programado', 'En Proceso', 'Completado'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFiltroEstado(tab)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: filtroEstado === tab ? '#0f172a' : '#e2e8f0',
                backgroundColor: filtroEstado === tab ? '#0f172a' : '#ffffff',
                color: filtroEstado === tab ? '#ffffff' : '#64748b',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* MUESTRA TABLA O CALENDARIO SEGÚN EL MODO SELECCIONADO */}
        {modoVista === 'tabla' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px' }}>CÓDIGO OT</th>
                <th style={{ padding: '12px' }}>CLIENTE / SEDE</th>
                <th style={{ padding: '12px' }}>TÉCNICO</th>
                <th style={{ padding: '12px' }}>FECHA / HORA</th>
                <th style={{ padding: '12px' }}>PRIORIDAD</th>
                <th style={{ padding: '12px' }}>ESTADO</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {serviciosFiltrados.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 12px', fontWeight: 'bold', color: '#2563eb' }}>{s.codigo}</td>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ fontWeight: '600', color: colores.texto }}>{s.cliente}</div>
                    <div style={{ fontSize: '11px', color: colores.secundario }}>{s.sede}</div>
                  </td>
                  <td style={{ padding: '14px 12px', color: colores.texto, fontWeight: '500' }}>👤 {s.tecnico}</td>
                  <td style={{ padding: '14px 12px', color: colores.texto }}>
                    <div>📅 {s.fecha}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>⏰ {s.horaInicio} - {s.horaFin}</div>
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{
                      backgroundColor: s.prioridad === 'Alta' ? '#fee2e2' : s.prioridad === 'Media' ? '#fef3c7' : '#f1f5f9',
                      color: s.prioridad === 'Alta' ? '#991b1b' : s.prioridad === 'Media' ? '#92400e' : '#475569',
                      fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '10px'
                    }}>
                      {s.prioridad}
                    </span>
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{
                      backgroundColor: s.estado === 'Completado' ? '#dcfce7' : s.estado === 'En Proceso' ? '#e0f2fe' : '#fef3c7',
                      color: s.estado === 'Completado' ? '#166534' : s.estado === 'En Proceso' ? '#075985' : '#854d0e',
                      fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px'
                    }}>
                      {s.estado}
                    </span>
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => handleVerDetalles(s)} title="Ver detalles" style={styles.actionBtn}>
                        <EyeIcon />
                      </button>
                      <button onClick={() => handleEditar(s)} title="Editar registro y fecha" style={styles.actionBtn}>
                        <EditIcon />
                      </button>
                      <button onClick={() => handleEliminar(s.id)} title="Eliminar" style={{ ...styles.actionBtn, color: '#ef4444' }}>
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          renderCalendario()
        )}
      </div>

      {/* MODAL CREADOR / EDICIÓN */}
      {(modalAbierto || modalEditar) && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContainer}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: colores.texto }}>
              {modalEditar ? `Editar Actividad (${formData.codigo})` : 'Agendar Nueva OT'}
            </h3>
            <form onSubmit={modalEditar ? handleGuardarCambios : handleGuardarNuevo} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={styles.label}>CLIENTE</label>
                <input
                  type="text"
                  value={formData.cliente}
                  onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>SEDE / UBICACIÓN</label>
                <input
                  type="text"
                  value={formData.sede}
                  onChange={(e) => setFormData({ ...formData, sede: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>TÉCNICO RESPONSABLE</label>
                <input
                  type="text"
                  value={formData.tecnico}
                  onChange={(e) => setFormData({ ...formData, tecnico: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>

              {/* MODIFICACIÓN COMPLETA DE FECHAS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={styles.label}>FECHA</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    required
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>HORA INICIO</label>
                  <input
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                    required
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>HORA FIN</label>
                  <input
                    type="time"
                    value={formData.horaFin}
                    onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={styles.label}>PRIORIDAD</label>
                  <select
                    value={formData.prioridad}
                    onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                    style={styles.input}
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>

                <div>
                  <label style={styles.label}>ESTADO</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    style={styles.input}
                  >
                    <option value="Programado">Programado</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Completado">Completado</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setModalAbierto(false); setModalEditar(false); }}
                  style={{ padding: '8px 16px', fontSize: '12px', border: `1px solid ${colores.borde}`, borderRadius: '6px', background: colores.tarjeta, color: colores.texto, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#facc15', border: 'none', padding: '8px 18px', fontWeight: 'bold', fontSize: '12px', borderRadius: '6px', cursor: 'pointer', color: '#0f172a' }}
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLES */}
      {modalDetalles && servicioSeleccionado && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContainer, width: '400px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: colores.texto }}>
              Detalles Orden {servicioSeleccionado.codigo}
            </h3>
            <div style={{ fontSize: '13px', lineHeight: '1.8', color: colores.texto }}>
              <p><strong>Cliente:</strong> {servicioSeleccionado.cliente}</p>
              <p><strong>Sede:</strong> {servicioSeleccionado.sede}</p>
              <p><strong>Técnico:</strong> {servicioSeleccionado.tecnico}</p>
              <p><strong>Fecha:</strong> {servicioSeleccionado.fecha}</p>
              <p><strong>Horario:</strong> {servicioSeleccionado.horaInicio} - {servicioSeleccionado.horaFin}</p>
              <p><strong>Prioridad:</strong> {servicioSeleccionado.prioridad}</p>
              <p><strong>Estado:</strong> {servicioSeleccionado.estado}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => { setModalDetalles(false); handleEditar(servicioSeleccionado); }}
                style={{ flex: 1, padding: '8px', backgroundColor: '#facc15', color: '#0f172a', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Editar
              </button>
              <button
                onClick={() => setModalDetalles(false)}
                style={{ flex: 1, padding: '8px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
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

const styles = {
  kpiCard: {
    backgroundColor: '#ffffff',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  kpiLabel: {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: '0.5px',
  },
  kpiValue: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: '4px',
  },
  actionBtn: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: '#64748b',
    padding: '4px',
    borderRadius: '4px',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justify: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    width: '460px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  },
  label: {
    display: 'block',
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    boxSizing: 'border-box',
    outline: 'none',
  },
};
export default ProgramacionActividades;