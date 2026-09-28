import React from 'react';

const PALETA = {
  verde: { bg: '#e8f8ed', border: '#c2ebd0', textColor: '#1e5e3a' },
  amarillo: { bg: '#fef6d8', border: '#fbe2a0', textColor: '#7a4b08' },
  rojo: { bg: '#fce8e6', border: '#f7c5c0', textColor: '#8c1d18' },
  azul: { bg: '#e3ecfb', border: '#c3d7f7', textColor: '#1e40af' },
  indigo: { bg: '#e9e8fd', border: '#cfcdf8', textColor: '#3f3aa8' }
};

export const ESTADOS = {
  cotizacion: [
    { nombre: 'Aprobado', ...PALETA.verde },
    { nombre: 'Pendiente', ...PALETA.amarillo },
    { nombre: 'Rechazado', ...PALETA.rojo }
  ],
  inventario: [
    { nombre: 'Óptimo', ...PALETA.verde },
    { nombre: 'Bajo Stock', ...PALETA.amarillo },
    { nombre: 'Crítico', ...PALETA.rojo }
  ],
  servicio: [
    { nombre: 'Activo', ...PALETA.verde },
    { nombre: 'Pausado', ...PALETA.amarillo }
  ],
  usuario: [
    { nombre: 'Activo', ...PALETA.verde },
    { nombre: 'Inactivo', ...PALETA.rojo }
  ],
  pago: [
    { nombre: 'PENDIENTE', ...PALETA.rojo },
    { nombre: 'ABONO PARCIAL', ...PALETA.amarillo },
    { nombre: 'LIQUIDADO', ...PALETA.verde }
  ],
  actividad: [
    { nombre: 'Programada', ...PALETA.amarillo },
    { nombre: 'En proceso', ...PALETA.azul },
    { nombre: 'Completada', ...PALETA.verde },
    { nombre: 'Cancelada', ...PALETA.rojo }
  ],
  orden: [
    { nombre: 'Pendiente', ...PALETA.amarillo },
    { nombre: 'Programada', ...PALETA.azul },
    { nombre: 'En ejecución', ...PALETA.indigo },
    { nombre: 'Finalizada', ...PALETA.verde },
    { nombre: 'Cancelada', ...PALETA.rojo }
  ],
  panel: [
    { nombre: 'Completado', ...PALETA.verde },
    { nombre: 'Pendiente', ...PALETA.amarillo },
    { nombre: 'Finalizado', ...PALETA.rojo }
  ]
};

export const estadoSiguiente = (lista, actual) => {
  const indice = lista.findIndex(
    (item) => item.nombre === actual
  );

  const base = indice === -1 ? 0 : indice;

  return lista[(base + 1) % lista.length].nombre;
};

export function EstadoToggle({
  estado,
  estados,
  onClick,
  width = 125
}) {
  const indice = Math.max(
    0,
    estados.findIndex((item) => item.nombre === estado)
  );

  const config = estados[indice];
  const total = estados.length;

  const izquierda =
    total === 1
      ? (width - 24) / 2
      : 4 + (indice * (width - 32)) / (total - 1);

  const padding =
    indice === 0
      ? '0 10px 0 28px'
      : indice === total - 1
        ? '0 28px 0 10px'
        : '0 24px';

  return (
    <button
      type="button"
      onClick={onClick}
      title={
        onClick
          ? 'Haz clic para cambiar el estado'
          : undefined
      }
      style={{
        width: `${width}px`,
        height: '32px',
        borderRadius: '16px',
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding,
        boxSizing: 'border-box',
        transition:
          'background-color 0.2s ease, border-color 0.2s ease'
      }}
    >
      <span
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          position: 'absolute',
          top: '3px',
          left: `${izquierda}px`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          transition:
            'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />

      <span
        style={{
          fontSize: '12px',
          fontWeight: 'bold',
          color: config.textColor,
          zIndex: 1,
          whiteSpace: 'nowrap'
        }}
      >
        {config.nombre}
      </span>
    </button>
  );
}
