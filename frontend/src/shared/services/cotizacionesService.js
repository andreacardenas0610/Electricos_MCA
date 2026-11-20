import { fechaISO, numero, redondear, sumarDias, uid } from './base.js';
import { precioEnCOP, TRM_USD } from './catalogos.js';

export const ESTADOS_COTIZACION = ['Aprobado', 'Pendiente', 'Rechazado'];
export const MONEDA_COTIZACION = 'COP';
export const ABONO_MINIMO_PORCENTAJE = 30;

export function crearItemServicio(servicio, cantidad = 1) {
  return {
    id: uid('item'),
    tipo: 'servicio',
    refId: servicio.id,
    descripcion: servicio.nombre,
    cantidad: numero(cantidad, 1) || 1,
    precioUnit: redondear(precioEnCOP(servicio.precioNumerico, servicio.moneda)),
    unidad: servicio.unidad || 'Servicio',
    monedaServicio: servicio.moneda,
  };
}

export function crearItemMaterial(material, cantidad = 1) {
  return {
    id: uid('item'),
    tipo: 'material',
    refId: material.id,
    descripcion: material.nombre,
    cantidad: numero(cantidad, 1) || 1,
    precioUnit: redondear(material.precioUnitario),
    unidad: material.unidad || 'Unidad',
  };
}

export function normalizarItem(item, indice = 0) {
  return {
    id: item.id ?? uid('item'),
    tipo: item.tipo || (item.materialId ? 'material' : 'item'),
    refId: item.refId ?? item.materialId ?? null,
    descripcion: item.descripcion || item.nombre || 'Ítem sin descripción',
    cantidad: Math.max(1, numero(item.cantidad, 1)),
    precioUnit: Math.max(0, numero(item.precioUnit ?? item.precioUnitario)),
    unidad: item.unidad || 'Unidad',
    monedaServicio: item.monedaServicio || null,
    orden: indice,
  };
}

export function calcularTotales(cotizacion) {
  const items = (cotizacion.items || []).map(normalizarItem);
  const subtotal = redondear(items.reduce(
    (total, item) => total + item.cantidad * item.precioUnit,
    0,
  ));
  const descuento = Math.min(100, Math.max(0, numero(cotizacion.descuento)));
  const iva = Math.min(100, Math.max(0, numero(cotizacion.ivaPorcentaje ?? 16)));
  const montoDescuento = redondear((subtotal * descuento) / 100);
  const base = redondear(subtotal - montoDescuento);
  const montoImpuesto = redondear((base * iva) / 100);

  return {
    subtotal,
    montoDescuento,
    montoImpuesto,
    total: redondear(base + montoImpuesto),
  };
}

export function normalizarCotizacion(cotizacion) {
  const items = Array.isArray(cotizacion.items) ? cotizacion.items.map(normalizarItem) : [];
  const base = {
    ...cotizacion,
    id: String(cotizacion.id),
    clienteId: cotizacion.clienteId ?? cotizacion.cliente_id ?? '',
    cliente: cotizacion.cliente || cotizacion.clienteNombre || 'Cliente sin nombre',
    documento: cotizacion.documento || '',
    contacto: cotizacion.contacto || '',
    telefono: cotizacion.telefono || '',
    correo: cotizacion.correo || '',
    direccion: cotizacion.direccion || '',
    proyecto: cotizacion.proyecto || 'Proyecto sin título',
    fecha: String(cotizacion.fecha || cotizacion.fechaEmision || fechaISO()).slice(0, 10),
    fechaEmision: String(cotizacion.fechaEmision || cotizacion.fecha || fechaISO()).slice(0, 10),
    diasVigencia: Math.max(1, numero(cotizacion.diasVigencia, 30)),
    ivaPorcentaje: Math.min(100, Math.max(0, numero(cotizacion.ivaPorcentaje, 16))),
    descuento: Math.min(100, Math.max(0, numero(cotizacion.descuento))),
    estadoCotizacion: ESTADOS_COTIZACION.includes(cotizacion.estadoCotizacion)
      ? cotizacion.estadoCotizacion
      : 'Pendiente',
    notas: cotizacion.notas || '',
    terminos: cotizacion.terminos || '',
    garantias: cotizacion.garantias || '',
    fechaLlegada: cotizacion.fechaLlegada || cotizacion.creadoEn || cotizacion.fechaEmision,
    aprobadoEn: cotizacion.aprobadoEn ?? null,
    stockDescontado: cotizacion.stockDescontado === true,
    abonado: numero(cotizacion.abonado),
    moneda: MONEDA_COTIZACION,
    items,
  };
  const totales = calcularTotales(base);

  return {
    ...base,
    ...totales,
    subtotalMateriales: totales.subtotal,
    subtotalBruto: totales.subtotal,
    totalNeto: totales.total,
  };
}

export function buscarCotizaciones(texto, cotizaciones = []) {
  const termino = String(texto || '').trim().toLowerCase();
  if (!termino) return cotizaciones;

  return cotizaciones.filter((cotizacion) => {
    const items = (cotizacion.items || []).map((item) => item.descripcion).join(' ');
    return `${cotizacion.id} ${cotizacion.cliente} ${cotizacion.proyecto} ${cotizacion.documento} ${items}`
      .toLowerCase()
      .includes(termino);
  });
}

export function fechaVencimiento(cotizacion) {
  const base = String(cotizacion.fechaEmision || '').slice(0, 10);
  return sumarDias(cotizacion.diasVigencia, new Date(`${base}T12:00:00`));
}

export function cotizacionVencida(cotizacion) {
  return fechaVencimiento(cotizacion) < fechaISO();
}

export function minimoAbono(cotizacion) {
  return redondear(Math.max(0, numero(cotizacion?.total)) * (ABONO_MINIMO_PORCENTAJE / 100));
}

const ORDEN_ESTADO = { Pendiente: 0, Aprobado: 1, Rechazado: 2 };

export function ordenarPorLlegada(cotizaciones) {
  return [...cotizaciones].sort((a, b) => {
    const porEstado = (ORDEN_ESTADO[a.estadoCotizacion] ?? 3)
      - (ORDEN_ESTADO[b.estadoCotizacion] ?? 3);
    if (porEstado !== 0) return porEstado;
    return String(b.fechaLlegada || b.fechaEmision || '').localeCompare(
      String(a.fechaLlegada || a.fechaEmision || ''),
    ) || String(b.id).localeCompare(String(a.id));
  });
}

export function resumenCotizaciones(cotizaciones) {
  return cotizaciones.reduce(
    (resumen, cotizacion) => {
      resumen.total += numero(cotizacion.total);
      resumen.cantidad += 1;
      if (cotizacion.estadoCotizacion === 'Aprobado') resumen.aprobadas += 1;
      if (cotizacion.estadoCotizacion === 'Pendiente') resumen.pendientes += 1;
      if (cotizacion.estadoCotizacion === 'Rechazado') resumen.rechazadas += 1;
      return resumen;
    },
    { total: 0, cantidad: 0, aprobadas: 0, pendientes: 0, rechazadas: 0 },
  );
}

export { TRM_USD };
