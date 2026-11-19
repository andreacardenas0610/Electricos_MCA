import { numero } from './base.js';
import { reglaTiempoMoneda, MONEDAS_SERVICIO } from './catalogos.js';

export function normalizarServicio(servicio) {
  const moneda = MONEDAS_SERVICIO.includes(servicio.moneda) ? servicio.moneda : 'COP';
  const regla = reglaTiempoMoneda(moneda);
  const horas = numero(servicio.horas) > 0 ? numero(servicio.horas) : regla.horas;

  return {
    ...servicio,
    id: Number(servicio.id) || servicio.id,
    codigo: servicio.codigo || `ELEC-${String(servicio.id || 1).padStart(3, '0')}`,
    nombre: String(servicio.nombre || '').trim(),
    desc: servicio.desc ?? servicio.descripcion ?? '',
    unidad: servicio.unidad || 'Servicio',
    precioNumerico: numero(servicio.precioNumerico ?? servicio.precio),
    moneda,
    subPrecio: moneda,
    tiempo: servicio.tiempo || (horas === regla.horas ? regla.texto : `${horas} Horas`),
    horas,
    categoria: servicio.categoria || 'Instalación',
    categoriaId: servicio.categoriaId ?? servicio.categoria_id ?? null,
    estado: ['Activo', 'Pausado', 'Inactivo'].includes(servicio.estado) ? servicio.estado : 'Activo',
    materiales: Array.isArray(servicio.materiales) ? servicio.materiales : [],
  };
}
