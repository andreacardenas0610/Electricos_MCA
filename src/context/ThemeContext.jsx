import { createContext, useState, useEffect } from 'react';

// Agrega 'export' aquí
export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('mca_tema') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const nuevoTema = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('mca_tema', nuevoTema);
      return nuevoTema;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function AbonosTable() {
  const data = [
    { id: '#PAG-9482', os: 'OS-2023-EL-1102', total: '$15,200.00', pendiente: '$3,200.00', status: 'ABONO PARCIAL' },
    { id: '#PAG-9483', os: 'OS-2023-EL-1103', total: '$8,500.00', pendiente: '$0.00', status: 'COMPLETADO' },
  ];

  return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
      <h3 style={{ marginTop: 0 }}>Abonos y Ventas Eléctricas Recientes</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px' }}>
            <th style={{ padding: '10px' }}>ID PAGO</th>
            <th style={{ padding: '10px' }}>CÓDIGO OS/COT</th>
            <th style={{ padding: '10px' }}>MONTO TOTAL</th>
            <th style={{ padding: '10px' }}>SALDO PENDIENTE</th>
            <th style={{ padding: '10px' }}>ESTADO</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 10px', color: 'var(--accent-yellow)', fontWeight: 'bold' }}>{row.id}</td>
              <td style={{ padding: '12px 10px' }}>{row.os}</td>
              <td style={{ padding: '12px 10px' }}>{row.total}</td>
              <td style={{ padding: '12px 10px', color: row.pendiente !== '$0.00' ? '#ef4444' : 'inherit' }}>{row.pendiente}</td>
              <td style={{ padding: '12px 10px' }}>
                <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(250, 204, 21, 0.2)', color: 'var(--accent-yellow)' }}>
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}