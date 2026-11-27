import React from 'react';
import { CircleDollarSign, Eye, FileText, Mail, Pencil, Trash2, Wrench } from 'lucide-react';

export function AccionesFila({
  onVer,
  onEditar,
  onPdf,
  onCorreo,
  onAbono,
  onOrdenes,
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
        <button type="button" className="mca-icon-btn" onClick={onVer} data-mca-tooltip="Ver detalle" aria-label="Ver detalle">
          <Eye {...iconProps} />
        </button>
      )}

      {onEditar && (
        <button type="button" className="mca-icon-btn" onClick={onEditar} data-mca-tooltip="Editar" aria-label="Editar">
          <Pencil {...iconProps} />
        </button>
      )}

      {onPdf && (
        <button type="button" className="mca-icon-btn" onClick={onPdf} data-mca-tooltip="Generar PDF" aria-label="Generar PDF">
          <FileText {...iconProps} />
        </button>
      )}

      {onCorreo && (
        <button type="button" className="mca-icon-btn" onClick={onCorreo} data-mca-tooltip="Enviar cotización al correo" aria-label="Enviar cotización al correo">
          <Mail {...iconProps} />
        </button>
      )}

      {onAbono && (
        <button type="button" className="mca-icon-btn" onClick={onAbono} data-mca-tooltip="Registrar abono" aria-label="Registrar abono">
          <CircleDollarSign {...iconProps} />
        </button>
      )}

      {onOrdenes && (
        <button
          type="button"
          className="mca-icon-btn"
          onClick={onOrdenes}
          title="Generar órdenes de servicio desde los servicios de la cotización"
        >
          <Wrench {...iconProps} />
        </button>
      )}

      {onEliminar && (
        <button
          type="button"
          className="mca-icon-btn mca-icon-btn--danger"
          onClick={onEliminar}
          data-mca-tooltip="Eliminar"
          aria-label="Eliminar"
        >
          <Trash2 size={15} strokeWidth={1.9} />
        </button>
      )}
    </div>
  );
}
