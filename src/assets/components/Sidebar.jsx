import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

export function Sidebar({ activeTab, setActiveTab }) {
  const { theme, toggleTheme } = useContext(ThemeContext);

  const menuItems = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'servicios', label: '📦 Servicios' },
    { id: 'materiales', label: '🧱 Materiales' },
    { id: 'cotizaciones', label: '📄 Cotizaciones' },
    { id: 'abonos', label: '💰 Abonos y Ventas' },
    { id: 'programacion', label: '🗓️ Programación' },
    { id: 'usuarios', label: '👤 Gestión Usuarios' },
    { id: 'roles', label: '🛡️ Roles y Permisos' },
  ];

  return (
    <aside style={{ width: '240px', backgroundColor: 'var(--bg-sidebar)', padding: '20px', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
      <h2 style={{ color: 'var(--accent-yellow)', margin: 0 }}>Eléctricos MCA</h2>
      <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '24px' }}>Gestión Empresarial</span>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              backgroundColor: activeTab === item.id ? 'rgba(250, 204, 21, 0.15)' : 'transparent',
              color: activeTab === item.id ? 'var(--accent-yellow)' : 'var(--text-muted)',
              fontWeight: activeTab === item.id ? 'bold' : 'normal',
              transition: 'all 0.2s ease',
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '16px' }}>
        <button
          onClick={toggleTheme}
          style={{ padding: '8px', cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--accent-yellow)', borderRadius: '6px' }}
        >
          {theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
        </button>

        <button style={{ backgroundColor: 'var(--accent-yellow)', color: '#000', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          + Nueva Venta
        </button>
      </div>
    </aside>
  );
}