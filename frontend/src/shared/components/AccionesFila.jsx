import React from 'react';

const EyeIcon = ({ color = '#475569' }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EditIcon = ({ color = '#475569' }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#ef4444"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export function AccionesFila({
  onVer,
  onEditar,
  onEliminar,
  color = '#475569',
  alineacion = 'center'
}) {
  const btnIcon = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '3px',
    display: 'flex',
    alignItems: 'center'
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        justifyContent: alineacion,
        alignItems: 'center'
      }}
    >
      {onVer && (
        <button
          type="button"
          onClick={onVer}
          title="Ver detalle"
          style={btnIcon}
        >
          <EyeIcon color={color} />
        </button>
      )}

      {onEditar && (
        <button
          type="button"
          onClick={onEditar}
          title="Editar"
          style={btnIcon}
        >
          <EditIcon color={color} />
        </button>
      )}

      {onEliminar && (
        <button
          type="button"
          onClick={onEliminar}
          title="Eliminar"
          style={btnIcon}
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
}
