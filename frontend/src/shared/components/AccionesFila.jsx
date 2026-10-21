import React from 'react';
import { Eye, FileText, Pencil, Trash2 } from 'lucide-react';

export function AccionesFila({
  onVer,
  onEditar,
  onPdf,
  onEliminar,
  color,
  alineacion = 'center',
}) {
  const iconProps = {
    size: 15,
    strokeWidth: 1.9,
    ...(color ? { color } : {}),
  };

  return (
    <div className="mca-row" style={{ justifyContent: alineacion, flexWrap: 'nowrap', gap: 6 }}>
      {onVer && (
        <button type="button" className="mca-icon-btn" onClick={onVer} title="Ver detalle">
          <Eye {...iconProps} />
        </button>
      )}

      {onEditar && (
        <button type="button" className="mca-icon-btn" onClick={onEditar} title="Editar">
          <Pencil {...iconProps} />
        </button>
      )}

      {onPdf && (
        <button type="button" className="mca-icon-btn" onClick={onPdf} title="Generar PDF">
          <FileText {...iconProps} />
        </button>
      )}

      {onEliminar && (
        <button
          type="button"
          className="mca-icon-btn mca-icon-btn--danger"
          onClick={onEliminar}
          title="Eliminar"
        >
          <Trash2 size={15} strokeWidth={1.9} />
        </button>
      )}
    </div>
  );
}
