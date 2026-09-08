import React, { useContext, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext.jsx';

// ICONOS SVG
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const UserPlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="17" y1="11" x2="23" y2="11" />
  </svg>
);

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

// DATOS INICIALES
const INITIAL_USUARIOS = [
  { id: 1, nombre: 'Carlos Mendoza', email: 'carlos.m@empresa.com', rol: 'Técnico', estado: 'Activo', zona: 'Norte', otAsignadas: 5 },
  { id: 2, nombre: 'Jorge Rivera', email: 'jorge.r@empresa.com', rol: 'Supervisor', estado: 'Activo', zona: 'Centro', otAsignadas: 12 },
  { id: 3, nombre: 'Andrés López', email: 'andres.l@empresa.com', rol: 'Técnico', estado: 'Inactivo', zona: 'Sur', otAsignadas: 0 },
  { id: 4, nombre: 'Ana Gómez', email: 'ana.g@empresa.com', rol: 'Administrador', estado: 'Activo', zona: 'General', otAsignadas: 0 }
];

// MODAL CREAR USUARIO
function ModalNuevoUsuario({ isOpen, onClose, onGuardar }) {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    rol: 'Técnico',
    zona: 'Norte',
    estado: 'Activo'
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar({
      ...formData,
      id: Date.now(),
      otAsignadas: 0
    });
    onClose();
    setFormData({ nombre: '', email: '', rol: 'Técnico', zona: 'Norte', estado: 'Activo' });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Nuevo Usuario</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={styles.label}>NOMBRE COMPLETO</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>CORREO ELECTRÓNICO</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={styles.label}>ROL</label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                style={styles.input}
              >
                <option value="Técnico">Técnico</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>ZONA</label>
              <select
                value={formData.zona}
                onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                style={styles.input}
              >
                <option value="Norte">Norte</option>
                <option value="Centro">Centro</option>
                <option value="Sur">Sur</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button type="button" onClick={onClose} style={styles.btnCancelar}>
              Cancelar
            </button>
            <button type="submit" style={styles.btnGuardar}>
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// COMPONENTE PRINCIPAL
export  function GestionUsuarios() {
  const { theme: temaGlobal, toggleTheme } = useContext(ThemeContext);
  const [usuarios, setUsuarios] = useState(INITIAL_USUARIOS);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [modalAbierto, setModalAbierto] = useState(false);
  
  // Estado para el tema (true = Claro, false = Oscuro)
  const esModoClaro = temaGlobal === 'light';

  const handleCambiarRol = (id, nuevoRol) => {
    setUsuarios(usuarios.map((u) => (u.id === id ? { ...u, rol: nuevoRol } : u)));
  };

  const handleCambiarEstado = (id) => {
    setUsuarios(
      usuarios.map((u) =>
        u.id === id ? { ...u, estado: u.estado === 'Activo' ? 'Inactivo' : 'Activo' } : u
      )
    );
  };

  const handleAgregarUsuario = (nuevoUsuario) => {
    setUsuarios([...usuarios, nuevoUsuario]);
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const coincideRol = filtroRol === 'Todos' || u.rol === filtroRol;
    const coincideBusqueda =
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.zona.toLowerCase().includes(busqueda.toLowerCase());
    return coincideRol && coincideBusqueda;
  });

  // Estilos dinámicos según el tema
  const bgMain = esModoClaro ? '#f8fafc' : '#0f172a';
  const textTitle = esModoClaro ? '#0f172a' : '#ffffff';
  const textSub = esModoClaro ? '#64748b' : '#94a3b8';
  const kpiBg = esModoClaro ? '#ffffff' : '#1e293b';
  const kpiBorder = esModoClaro ? '#e2e8f0' : '#334155';
  const kpiText = esModoClaro ? '#0f172a' : '#ffffff';
  const inputBg = esModoClaro ? '#ffffff' : '#1e293b';
  const inputBorder = esModoClaro ? '#cbd5e1' : '#334155';
  const inputText = esModoClaro ? '#0f172a' : '#ffffff';

  return (
    <div className="users-page" style={{ backgroundColor: bgMain, minHeight: '100vh', padding: '24px', fontFamily: 'system-ui, sans-serif', transition: 'background-color 0.2s' }}>
      
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: textTitle }}>
            Gestión de Acceso de Usuarios
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: textSub }}>
            Asignación directa de roles y estados de cuenta
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* BOTÓN CLARO / OSCURO */}
          <button
            onClick={toggleTheme}
            style={{
              backgroundColor: esModoClaro ? '#ffffff' : '#1e293b',
              color: esModoClaro ? '#0f172a' : '#ffffff',
              border: `1px solid ${esModoClaro ? '#cbd5e1' : '#334155'}`,
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            {esModoClaro ? <MoonIcon /> : <SunIcon />}
            {esModoClaro ? 'Oscuro' : 'Claro'}
          </button>

          {/* BOTÓN NUEVO USUARIO */}
          <button
            onClick={() => setModalAbierto(true)}
            style={{
              backgroundColor: '#facc15',
              color: '#0f172a',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '20px',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <UserPlusIcon /> NUEVO USUARIO
          </button>
        </div>
      </div>

      {/* MÉTRICAS Y RESUMEN */}
      <div className="users-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ ...styles.kpiCard, backgroundColor: kpiBg, borderColor: kpiBorder }}>
          <span style={styles.kpiLabel}>TOTAL USUARIOS</span>
          <div style={{ ...styles.kpiValue, color: kpiText }}>{usuarios.length}</div>
        </div>
        <div style={{ ...styles.kpiCard, backgroundColor: kpiBg, borderColor: kpiBorder }}>
          <span style={styles.kpiLabel}>ADMINISTRADORES</span>
          <div style={{ ...styles.kpiValue, color: '#f59e0b' }}>
            {usuarios.filter((u) => u.rol === 'Administrador').length}
          </div>
        </div>
        <div style={{ ...styles.kpiCard, backgroundColor: kpiBg, borderColor: kpiBorder }}>
          <span style={styles.kpiLabel}>SUPERVISORES</span>
          <div style={{ ...styles.kpiValue, color: '#3b82f6' }}>
            {usuarios.filter((u) => u.rol === 'Supervisor').length}
          </div>
        </div>
        <div style={{ ...styles.kpiCard, backgroundColor: kpiBg, borderColor: kpiBorder }}>
          <span style={styles.kpiLabel}>TÉCNICOS DE CAMPO</span>
          <div style={{ ...styles.kpiValue, color: '#22c55e' }}>
            {usuarios.filter((u) => u.rol === 'Técnico').length}
          </div>
        </div>
      </div>

      {/* BÚSQUEDA Y FILTROS */}
      <div className="users-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '10px', color: textSub }}>
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre, correo o zona..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 38px',
              borderRadius: '20px',
              border: `1px solid ${inputBorder}`,
              backgroundColor: inputBg,
              color: inputText,
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['Todos', 'Administrador', 'Supervisor', 'Técnico'].map((rol) => (
            <button
              key={rol}
              onClick={() => setFiltroRol(rol)}
              style={{
                padding: '6px 16px',
                borderRadius: '16px',
                border: 'none',
                backgroundColor: filtroRol === rol ? (esModoClaro ? '#0f172a' : '#ffffff') : (esModoClaro ? '#e2e8f0' : '#1e293b'),
                color: filtroRol === rol ? (esModoClaro ? '#ffffff' : '#0f172a') : textSub,
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {rol}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA DE USUARIOS Y ROLES */}
      <div className="users-table-wrap" style={{ backgroundColor: esModoClaro ? '#ffffff' : '#111c38', borderRadius: '12px', padding: '16px', color: esModoClaro ? '#0f172a' : '#f8fafc', boxShadow: esModoClaro ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px' }}>Usuario</th>
              <th style={{ padding: '12px' }}>Zona / Sede</th>
              <th style={{ padding: '12px' }}>Rol Asignado</th>
              <th style={{ padding: '12px' }}>OTs Activas</th>
              <th style={{ padding: '12px' }}>Estado</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 12px' }}>
                  <div style={{ fontWeight: 'bold', color: kpiText }}>{u.nombre}</div>
                  <div style={{ fontSize: '11px', color: textSub }}>{u.email}</div>
                </td>
                <td style={{ padding: '14px 12px', color: kpiText }}>📍 {u.zona}</td>
                <td style={{ padding: '14px 12px' }}>
                  <select
                    value={u.rol}
                    onChange={(e) => handleCambiarRol(u.id, e.target.value)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${inputBorder}`,
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: u.rol === 'Administrador' ? '#fef3c7' : u.rol === 'Supervisor' ? '#e0f2fe' : (esModoClaro ? '#f1f5f9' : '#334155'),
                      color: u.rol === 'Administrador' ? '#92400e' : u.rol === 'Supervisor' ? '#0369a1' : (esModoClaro ? '#334155' : '#f8fafc'),
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Técnico">Técnico</option>
                  </select>
                </td>
                <td style={{ padding: '14px 12px', fontWeight: 'bold', color: '#2563eb' }}>
                  {u.otAsignadas} OTs
                </td>
                <td style={{ padding: '14px 12px' }}>
                  <span
                    style={{
                      backgroundColor: u.estado === 'Activo' ? '#dcfce7' : '#fee2e2',
                      color: u.estado === 'Activo' ? '#166534' : '#991b1b',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '3px 8px',
                      borderRadius: '10px'
                    }}
                  >
                    {u.estado}
                  </span>
                </td>
                <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                  <button
                    onClick={() => handleCambiarEstado(u.id)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: u.estado === 'Activo' ? '#dc2626' : '#16a34a',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {u.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ModalNuevoUsuario
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onGuardar={handleAgregarUsuario}
      />
    </div>
  );
}

// ESTILOS
const styles = {
  kpiCard: {
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid'
  },
  kpiLabel: {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: '0.5px'
  },
  kpiValue: {
    fontSize: '22px',
    fontWeight: 'bold',
    marginTop: '4px'
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    padding: '24px',
    borderRadius: '12px',
    width: '400px'
  },
  label: {
    display: 'block',
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: '4px'
  },
  input: {
    width: '100%',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    boxSizing: 'border-box',
    outline: 'none'
  },
  btnCancelar: {
    padding: '8px 14px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    cursor: 'pointer',
    fontSize: '12px'
  },
  btnGuardar: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#facc15',
    color: '#0f172a',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '12px'
  }
};
export default GestionUsuarios;