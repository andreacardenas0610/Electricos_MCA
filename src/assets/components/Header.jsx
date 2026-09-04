export function Header() {
  return (
    <header style={{ height: '60px', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between' }}>
      <input
        type="text"
        placeholder="Buscar transacción, pago o cotización..."
        style={{
          width: '320px',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-main)',
          color: 'var(--text-main)',
        }}
      />
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span>🔔</span>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>
          MCA
        </div>
      </div>
    </header>
  );
}