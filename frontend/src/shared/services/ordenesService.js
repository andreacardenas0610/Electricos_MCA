export const PRIORIDADES_ORDEN = [
  { id: 1, nombre: 'Baja' },
  { id: 2, nombre: 'Media' },
  { id: 3, nombre: 'Alta' },
];

export function generarCodigoOrden(ordenes = []) {
  const anio = new Date().getFullYear();
  const patron = new RegExp(`^OS-${anio}-(\\d+)$`, 'i');
  const ultimo = ordenes.reduce((mayor, orden) => {
    const coincidencia = String(orden.codigo || '').match(patron);
    return coincidencia ? Math.max(mayor, Number(coincidencia[1])) : mayor;
  }, 0);

  return `OS-${anio}-${String(ultimo + 1).padStart(4, '0')}`;
}

export function buscarOrdenes(texto, ordenes = []) {
  const termino = String(texto || '').trim().toLowerCase();
  if (!termino) return ordenes;

  return ordenes.filter((orden) => (
    `${orden.codigo || ''} ${orden.cliente || orden.cliente_nombre || ''} `
    + `${orden.servicio || orden.servicio_nombre || ''} `
    + `${orden.responsable || orden.tecnico || orden.tecnico_nombre || ''} `
    + `${orden.descripcion || ''}`
  ).toLowerCase().includes(termino));
}

export function resumenOrdenes(ordenes) {
  return ordenes.reduce(
    (resumen, orden) => {
      resumen.total += 1;
      if (orden.estado === 'Pendiente') resumen.pendientes += 1;
      if (orden.estado === 'Programada') resumen.programadas += 1;
      if (['En ejecución', 'En Ejecución'].includes(orden.estado)) resumen.ejecucion += 1;
      if (orden.estado === 'Finalizada') resumen.finalizadas += 1;
      if (orden.estado === 'Cancelada') resumen.canceladas += 1;
      return resumen;
    },
    { total: 0, pendientes: 0, programadas: 0, ejecucion: 0, finalizadas: 0, canceladas: 0 },
  );
}
