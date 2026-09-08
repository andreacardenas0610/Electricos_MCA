import React, { useContext, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext.jsx';

// ==========================================
// ICONOS SVG
// ==========================================
const SearchIcon = ({ color = "#94a3b8" }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ClockIcon = ({ color = "#64748b" }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const EyeIcon = ({ color = "#475569" }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const EditIcon = ({ color = "#475569" }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#22c55e" stroke="#22c55e" strokeWidth="0.5">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
  </svg>
);

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
  </svg>
);

const ShieldWatermark = ({ color = "#e2e8f0" }) => (
  <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// LISTA INTERNA DE TÉCNICOS (Solo registro del dueño)
const TECNICOS_REGISTRADOS = [
  { id: 't1', nombre: 'Carlos Mendoza', telefono: '+51987654321' },
  { id: 't2', nombre: 'Juan Pérez', telefono: '+51912345678' },
  { id: 't3', nombre: 'Roberto Gómez', telefono: '+51955554444' },
  { id: 't4', nombre: 'Sin Asignar', telefono: '' }
];

const INITIAL_DATA = [
  { id: 1, codigo: 'ELEC-001', nombre: 'Instalación de Tablero Trifásico', desc: 'Montaje, cableado y pruebas', unidad: 'Proyecto', precio: '$850.00', subPrecio: 'USD', tiempo: '2 Días', categoria: 'Instalación', estado: 'Activo', tecnico: 'Carlos Mendoza' },
  { id: 2, codigo: 'ELEC-042', nombre: 'Mantenimiento Preventivo', desc: 'Limpieza y reapriete', unidad: 'Hora', precio: '$65.00', subPrecio: 'USD / HORA', tiempo: '4 Horas', categoria: 'Mantenimiento', estado: 'Activo', tecnico: 'Juan Pérez' },
  { id: 3, codigo: 'ELEC-203', nombre: 'Medición de Pozo a Tierra', desc: 'Certificación con telurómetro', unidad: 'Punto', precio: '$120.00', subPrecio: 'USD / POZO', tiempo: '1 Día', categoria: 'Protocolos', estado: 'Activo', tecnico: 'Roberto Gómez' },
  { id: 4, codigo: 'ELEC-009', nombre: 'Instalación Luminarias LED', desc: 'Colocación de paneles', unidad: 'Punto', precio: '$18.00', subPrecio: 'USD / PUNTO', tiempo: 'Inmediato', categoria: 'Instalación', estado: 'Pausado', tecnico: 'Sin Asignar' }
];

export function GestionRolesPermisos() {
  const { theme: temaGlobal, toggleTheme } = useContext(ThemeContext);
  const [servicios, setServicios] = useState(INITIAL_DATA);
  const [tab, setTab] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const darkMode = temaGlobal === 'dark';
  
  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [modoModal, setModoModal] = useState('crear');
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({
    codigo: '', nombre: '', desc: '', unidad: 'Proyecto', precio: '', subPrecio: 'USD', tiempo: '', categoria: 'Instalación', estado: 'Activo', tecnico: 'Sin Asignar'
  });

  const theme = {
    bg: darkMode ? '#0b0f19' : '#eef2f6',
    cardBg: darkMode ? '#151c2c' : '#ffffff',
    headerBg: darkMode ? '#111827' : '#ffffff',
    textMain: darkMode ? '#f8fafc' : '#0f172a',
    textSub: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#1e293b' : '#e2e8f0',
    inputBg: darkMode ? '#1e293b' : '#f1f5f9',
    tableBorder: darkMode ? '#1e293b' : '#f1f5f9',
    iconColor: darkMode ? '#cbd5e1' : '#475569'
  };

  const handleOpenCrear = () => {
    setModoModal('crear');
    setFormData({
      codigo: `ELEC-0${Math.floor(Math.random() * 899 + 100)}`,
      nombre: '', desc: '', unidad: 'Proyecto', precio: '$0.00', subPrecio: 'USD', tiempo: '1 Día', categoria: 'Instalación', estado: 'Activo', tecnico: 'Sin Asignar'
    });
    setModalOpen(true);
  };

  const handleOpenVer = (item) => {
    setModoModal('ver');
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleOpenEditar = (item) => {
    setModoModal('editar');
    setSelectedItem(item);
    setFormData({ ...item });
    setModalOpen(true);
  };

  const handleEliminar = (id) => {
    if (window.confirm('¿Está seguro de eliminar este servicio?')) {
      setServicios(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleToggleEstado = (id) => {
    setServicios(prev => prev.map(s => s.id === id ? { ...s, estado: s.estado === 'Activo' ? 'Pausado' : 'Activo' } : s));
  };

  // Enviar orden directa al WhatsApp del técnico en campo
  const handleEnviarWhatsApp = (item) => {
    const tecnicoObj = TECNICOS_REGISTRADOS.find(t => t.nombre === item.tecnico);
    const mensaje = `Hola ${item.tecnico}, se te ha asignado el siguiente trabajo:\n\n📌 *Código:* ${item.codigo}\n🛠 *Servicio:* ${item.nombre}\n📝 *Detalle:* ${item.desc}\n⏱ *Tiempo Est.:* ${item.tiempo}\n\nPor favor confirmar recepción.`;
    const url = `https://wa.me/${tecnicoObj?.telefono || ''}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (modoModal === 'crear') {
      const nuevoServicio = { ...formData, id: Date.now() };
      setServicios(prev => [nuevoServicio, ...prev]);
    } else if (modoModal === 'editar') {
      setServicios(prev => prev.map(s => s.id === selectedItem.id ? { ...formData } : s));
    }
    setModalOpen(false);
  };

  const serviciosFiltrados = servicios.filter(item => {
    const matchTab = tab === 'Todos' || item.categoria === tab;
    const matchSearch = item.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                        item.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
                        item.tecnico.toLowerCase().includes(busqueda.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.bg, fontFamily: 'system-ui, -apple-system, sans-serif', transition: 'all 0.2s ease' }}>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* HEADER BAR */}
        <header style={{ backgroundColor: theme.headerBg, height: '50px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '7px' }}><SearchIcon color={theme.textSub} /></span>
            <input
              type="text"
              placeholder="Buscar servicio o técnico..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ width: '100%', padding: '5px 10px 5px 30px', borderRadius: '14px', border: 'none', backgroundColor: theme.inputBg, color: theme.textMain, fontSize: '11px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={toggleTheme}
              style={{
                backgroundColor: '#1e293b',
                color: '#ffffff',
                border: 'none',
                padding: '5px 14px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <SunIcon />
              <span>{darkMode ? 'Modo Oscuro' : 'Modo Claro'}</span>
            </button>

            {/* Badge de Rol Único */}
            <span style={{ backgroundColor: '#facc15', color: '#0f172a', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
              PANEL ADMINISTRADOR GENERAL
            </span>
          </div>
        </header>

        {/* BODY */}
        <div style={{ padding: '20px', flex: 1 }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '18px', color: theme.textMain, fontWeight: 'bold' }}>Centro de Mando Eléctrico</h1>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: theme.textSub }}>Control privado de tarifario, costos y asignación de trabajos a campo.</p>
            </div>
            <button onClick={handleOpenCrear} style={{ backgroundColor: '#facc15', border: 'none', padding: '7px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <PlusIcon /> Nuevo Servicio
            </button>
          </div>

          {/* TARJETAS MÉTRICAS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <span style={{ ...styles.cardTag, color: theme.textSub }}>PARTIDAS ACTIVAS</span>
              <div style={{ ...styles.cardNum, color: theme.textMain }}>{servicios.filter(s => s.estado === 'Activo').length}</div>
              <span style={{ fontSize: '10px', color: '#854d0e', fontWeight: 'bold' }}>⚡ Control total privado</span>
            </div>
            <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <span style={{ ...styles.cardTag, color: theme.textSub }}>TÉCNICOS ASIGNADOS</span>
              <div style={{ ...styles.cardNum, color: theme.textMain }}>{servicios.filter(s => s.tecnico !== 'Sin Asignar').length}</div>
              <span style={{ fontSize: '10px', color: theme.textSub }}>En campo activo</span>
            </div>
            <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <span style={{ ...styles.cardTag, color: theme.textSub }}>COSTO PROMEDIO PUNTO</span>
              <div style={{ ...styles.cardNum, color: theme.textMain }}>$45.00</div>
              <span style={{ fontSize: '10px', color: theme.textSub }}>Margen configurado</span>
            </div>
            <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border, position: 'relative' }}>
              <span style={{ ...styles.cardTag, color: theme.textSub }}>ACCESO AL SISTEMA</span>
              <div style={{ ...styles.cardNum, color: theme.textMain, fontSize: '15px' }}>Exclusivo Dueño</div>
              <div style={{ height: '3px', backgroundColor: theme.border, marginTop: '10px', borderRadius: '2px' }}>
                <div style={{ width: '100%', height: '100%', backgroundColor: '#facc15' }} />
              </div>
              <div style={{ position: 'absolute', right: '4px', bottom: '0px', opacity: 0.3 }}>
                <ShieldWatermark color={theme.textSub} />
              </div>
            </div>
          </div>

          {/* CAJA TABLA */}
          <div style={{ backgroundColor: theme.cardBg, borderRadius: '8px', border: `1px solid ${theme.border}`, padding: '12px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['Todos', 'Instalación', 'Mantenimiento', 'Protocolos'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{
                      border: 'none',
                      backgroundColor: tab === t ? (darkMode ? '#3b82f6' : '#1e293b') : 'transparent',
                      color: tab === t ? '#ffffff' : theme.textSub,
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* TABLA PRINCIPAL */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSub, textAlign: 'left', fontSize: '9px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px' }}>CÓDIGO</th>
                  <th style={{ padding: '8px' }}>SERVICIO</th>
                  <th style={{ padding: '8px' }}>TÉCNICO EN CAMPO</th>
                  <th style={{ padding: '8px' }}>PRECIO BASE</th>
                  <th style={{ padding: '8px' }}>TIEMPO</th>
                  <th style={{ padding: '8px' }}>ESTADO</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>ACCIONES Y ENVÍO</th>
                </tr>
              </thead>
              <tbody>
                {serviciosFiltrados.length > 0 ? (
                  serviciosFiltrados.map((row) => (
                    <tr key={row.id} style={{ borderBottom: `1px solid ${theme.tableBorder}` }}>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{ backgroundColor: darkMode ? '#1e3a8a' : '#dbeafe', color: darkMode ? '#93c5fd' : '#1e40af', fontWeight: 'bold', padding: '3px 6px', borderRadius: '3px', fontSize: '9px' }}>
                          {row.codigo}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ fontWeight: 'bold', color: theme.textMain }}>{row.nombre}</div>
                        <div style={{ fontSize: '9px', color: theme.textSub }}>{row.desc}</div>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{ backgroundColor: row.tecnico === 'Sin Asignar' ? (darkMode ? '#334155' : '#f1f5f9') : (darkMode ? '#065f46' : '#d1fae5'), color: row.tecnico === 'Sin Asignar' ? theme.textSub : (darkMode ? '#a7f3d0' : '#065f46'), padding: '3px 8px', borderRadius: '10px', fontSize: '9px', fontWeight: 'bold' }}>
                          👤 {row.tecnico}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ fontWeight: 'bold', color: theme.textMain }}>{row.precio}</div>
                        <div style={{ fontSize: '8px', color: theme.textSub }}>{row.subPrecio}</div>
                      </td>
                      <td style={{ padding: '10px 8px', color: theme.textMain }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <ClockIcon color={theme.textSub} /> {row.tiempo}
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <button
                          onClick={() => handleToggleEstado(row.id)}
                          style={{
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: row.estado === 'Activo' ? (darkMode ? '#064e3b' : '#dcfce7') : (darkMode ? '#78350f' : '#fef3c7'),
                            color: row.estado === 'Activo' ? (darkMode ? '#6ee7b7' : '#166534') : (darkMode ? '#fde047' : '#92400e'),
                            padding: '2px 8px',
                            borderRadius: '8px',
                            fontSize: '9px',
                            fontWeight: 'bold'
                          }}
                        >
                          • {row.estado}
                        </button>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                          {/* BOTÓN ENVIAR TRABAJO POR WHATSAPP */}
                          {row.tecnico !== 'Sin Asignar' && (
                            <button
                              onClick={() => handleEnviarWhatsApp(row)}
                              title="Enviar orden de trabajo al WhatsApp del técnico"
                              style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9px', fontWeight: 'bold', color: '#15803d' }}
                            >
                              <WhatsAppIcon /> WhatsApp
                            </button>
                          )}
                          <button onClick={() => handleOpenVer(row)} style={styles.btnIcon} title="Ver servicio"><EyeIcon color={theme.iconColor} /></button>
                          <button onClick={() => handleOpenEditar(row)} style={styles.btnIcon} title="Editar / Asignar Técnico"><EditIcon color={theme.iconColor} /></button>
                          <button onClick={() => handleEliminar(row.id)} style={styles.btnIcon} title="Eliminar"><TrashIcon /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: theme.textSub }}>
                      No se encontraron registros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* PAGINACIÓN FOOTER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', fontSize: '10px', color: theme.textSub }}>
              <span>Mostrando {serviciosFiltrados.length} de {servicios.length} servicios</span>
              <div style={{ display: 'flex', gap: '3px' }}>
                <button style={{ ...styles.pBtn, backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.textSub }}>&lt;</button>
                <button style={{ ...styles.pBtn, backgroundColor: '#facc15', color: '#0f172a', fontWeight: 'bold', border: 'none' }}>1</button>
                <button style={{ ...styles.pBtn, backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.textSub }}>&gt;</button>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* MODAL (VER / EDITAR / ASIGNAR) */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, width: '420px', borderRadius: '8px', padding: '20px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: theme.textMain }}>
              {modoModal === 'crear' && 'Agregar Nuevo Servicio'}
              {modoModal === 'editar' && 'Editar Servicio / Asignar Técnico'}
              {modoModal === 'ver' && 'Detalles Privados del Servicio'}
            </h3>

            {modoModal === 'ver' ? (
              <div style={{ fontSize: '12px', color: theme.textMain, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div><strong>Código:</strong> {selectedItem?.codigo}</div>
                <div><strong>Nombre:</strong> {selectedItem?.nombre}</div>
                <div><strong>Descripción:</strong> {selectedItem?.desc}</div>
                <div><strong>Técnico Asignado:</strong> {selectedItem?.tecnico}</div>
                <div><strong>Categoría:</strong> {selectedItem?.categoria}</div>
                <div><strong>Precio Base:</strong> {selectedItem?.precio} ({selectedItem?.subPrecio})</div>
                <div><strong>Tiempo Estimado:</strong> {selectedItem?.tiempo}</div>
                <div><strong>Estado:</strong> {selectedItem?.estado}</div>
                <button onClick={() => setModalOpen(false)} style={{ ...styles.btnPrimary, marginTop: '12px' }}>Cerrar</button>
              </div>
            ) : (
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px' }}>
                <input
                  type="text"
                  placeholder="Nombre del servicio"
                  required
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain }}
                />
                <input
                  type="text"
                  placeholder="Descripción corta"
                  value={formData.desc}
                  onChange={e => setFormData({ ...formData, desc: e.target.value })}
                  style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain }}
                />
                
                {/* SELECTOR DE TÉCNICO REGISTRADO */}
                <div>
                  <label style={{ fontSize: '10px', color: theme.textSub, display: 'block', marginBottom: '2px' }}>Técnico Asignado (Campo):</label>
                  <select
                    value={formData.tecnico}
                    onChange={e => setFormData({ ...formData, tecnico: e.target.value })}
                    style={{ ...styles.input, width: '100%', backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain }}
                  >
                    {TECNICOS_REGISTRADOS.map(tec => (
                      <option key={tec.id} value={tec.nombre}>{tec.nombre}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <select
                    value={formData.categoria}
                    onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                    style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain }}
                  >
                    <option value="Instalación">Instalación</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Protocolos">Protocolos</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Precio ($850.00)"
                    value={formData.precio}
                    onChange={e => setFormData({ ...formData, precio: e.target.value })}
                    style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Tiempo (2 Días)"
                    value={formData.tiempo}
                    onChange={e => setFormData({ ...formData, tiempo: e.target.value })}
                    style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain }}
                  />
                  <select
                    value={formData.estado}
                    onChange={e => setFormData({ ...formData, estado: e.target.value })}
                    style={{ ...styles.input, backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain }}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Pausado">Pausado</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                  <button type="button" onClick={() => setModalOpen(false)} style={styles.btnSecondary}>Cancelar</button>
                  <button type="submit" style={styles.btnPrimary}>Guardar Cambios</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  card: { padding: '12px', borderRadius: '6px', border: '1px solid' },
  cardTag: { fontSize: '8px', fontWeight: 'bold', letterSpacing: '0.3px' },
  cardNum: { fontSize: '18px', fontWeight: 'bold', margin: '2px 0' },
  btnIcon: { background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' },
  pBtn: { width: '20px', height: '20px', border: '1px solid', borderRadius: '3px', fontSize: '9px', cursor: 'pointer' },
  input: { padding: '6px 10px', borderRadius: '4px', border: '1px solid', fontSize: '11px', outline: 'none' },
  btnPrimary: { backgroundColor: '#facc15', border: 'none', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px', color: '#0f172a', cursor: 'pointer' },
  btnSecondary: { backgroundColor: '#94a3b8', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', color: '#ffffff', cursor: 'pointer' }
};

export default GestionRolesPermisos;