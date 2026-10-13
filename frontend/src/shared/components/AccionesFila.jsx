import React from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';

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
          <Eye size={15} strokeWidth={1.8} color={color} />
        </button>
      )}

      {onEditar && (
        <button
          type="button"
          onClick={onEditar}
          title="Editar"
          style={btnIcon}
        >
          <Pencil size={15} strokeWidth={1.8} color={color} />
        </button>
      )}

      {onEliminar && (
        <button
          type="button"
          onClick={onEliminar}
          title="Eliminar"
          style={btnIcon}
        >
          <Trash2 size={15} strokeWidth={1.8} color="#ef4444" />
        </button>
      )}
    </div>
  );
}
