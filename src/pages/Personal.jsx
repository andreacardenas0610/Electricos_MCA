import { useState } from 'react';

export function Personal() {
  const [personal, setPersonal] = useState([
    {
      id: 1,
      nombre: 'Carlos Mendoza',
      cargo: 'Técnico Especialista en Alta Tensión',
      especialidad: 'Transformadores',
      estado: 'En Campo',
      proyectosAsignados: 3
    },
    {
      id: 2,
      nombre: 'S. Peterson',
      cargo: 'Ingeniero Electricista / Cotizador',
      especialidad: 'Proyectos Industriales',
      estado: 'Oficina',
      proyectosAsignados: 5
    },
    {
      id: 3,
      nombre: 'Ana María Gómez',
      cargo: 'Supervisora de Seguridad Industrial',
      especialidad: 'Normativa RETIE',
      estado: 'En Campo',
      proyectosAsignados: 2
    },
    {
      id: 4,
      nombre: 'Roberto Silva',
      cargo: 'Técnico Liniero',
      especialidad: 'Redes Aéreas',
      estado: 'Disponible',
      proyectosAsignados: 0
    }
  ]);

  return (
    <div style={{ padding: '24px 32px', color: '#ffffff', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* CABECERA DE LA SECCIÓN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#ffffff' }}>
            👷 Gestión de Personal
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
            Control de técnicos, supervisores y personal asignado a proyectos
          </p>
        </div>
        <button style={{
          backgroundColor: '#facc15',
          color: '#0f172a',
          border: 'none',
          padding: '10px 18px',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>➕</span> Registrar Personal
        </button>
      </div>

      {/* TARJETAS RESUMEN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: '#182642', border: '1px solid #213459', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>TOTAL PERSONAL</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>{personal.length}</div>
        </div>
        <div style={{ backgroundColor: '#182642', border: '1px solid #213459', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>EN CAMPO</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', marginTop: '4px' }}>
            {personal.filter(p => p.estado === 'En Campo').length}
          </div>
        </div>
        <div style={{ backgroundColor: '#182642', border: '1px solid #213459', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>DISPONIBLES</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>
            {personal.filter(p => p.estado === 'Disponible').length}
          </div>
        </div>
      </div>

      {/* TABLA DE PERSONAL */}
      <div style={{ backgroundColor: '#182642', border: '1px solid #213459', borderRadius: '12px', padding: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ color: '#64748b', borderBottom: '1px solid #243556', fontSize: '11px', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 8px' }}>Nombre</th>
              <th style={{ padding: '12px 8px' }}>Cargo / Rol</th>
              <th style={{ padding: '12px 8px' }}>Especialidad</th>
              <th style={{ padding: '12px 8px', textAlign: 'center' }}>Proyectos</th>
              <th style={{ padding: '12px 8px', textAlign: 'center' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {personal.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #1d2c4b' }}>
                <td style={{ padding: '14px 8px', fontWeight: 'bold', color: '#ffffff' }}>
                  {p.nombre}
                </td>
                <td style={{ padding: '14px 8px', color: '#94a3b8' }}>
                  {p.cargo}
                </td>
                <td style={{ padding: '14px 8px', color: '#94a3b8' }}>
                  {p.especialidad}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 'bold', color: '#facc15' }}>
                  {p.proyectosAsignados}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    backgroundColor: 
                      p.estado === 'En Campo' ? '#1e3a8a' : 
                      p.estado === 'Disponible' ? '#064e3b' : '#374151',
                    color: 
                      p.estado === 'En Campo' ? '#93c5fd' : 
                      p.estado === 'Disponible' ? '#6ee7b7' : '#d1d5db'
                  }}>
                    {p.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default Personal;