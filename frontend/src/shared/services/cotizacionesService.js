import { hasStore, numero, redondear, readStore, uid, writeStore, fechaISO, sumarDias } from './base.js';
import { precioEnCOP, TRM_USD } from './catalogos.js';
import { obtenerCliente } from './clientesService.js';

export const COTIZACIONES_KEY = 'cotizaciones_electricos_mca';
export const ESTADOS_COTIZACION = ['Aprobado', 'Pendiente', 'Rechazado'];
export const MONEDA_COTIZACION = 'COP';

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
  const subtotal = redondear(
    items.reduce((total, item) => total + item.cantidad * item.precioUnit, 0),
  );
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
  const items = Array.isArray(cotizacion.items)
    ? cotizacion.items.map(normalizarItem)
    : [];
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

function snapshotCliente(id, respaldo) {
  const cliente = obtenerCliente(id);
  return {
    clienteId: id,
    cliente: cliente?.nombre || respaldo?.cliente || 'Cliente sin nombre',
    documento: cliente?.documento || respaldo?.documento || '',
    contacto: cliente?.contacto || '',
    telefono: cliente?.telefono || '',
    correo: cliente?.correo || '',
    direccion: cliente?.direccion || respaldo?.direccion || '',
  };
}

function crearSemilla() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const fecha = (dias) => sumarDias(-dias, hoy);

  const semillas = [
    {
      id: `COT-${anio}-0001`,
      ...snapshotCliente(1, {
        cliente: 'Constructora Horizonte S.A.',
        direccion: 'Calle 50 # 12-34, Parque Industrial, Bogotá',
      }),
      proyecto: 'Instalación Eléctrica Edificio Mirador',
      fecha: fecha(12),
      fechaEmision: fecha(12),
      diasVigencia: 30,
      ivaPorcentaje: 16,
      descuento: 0,
      estadoCotizacion: 'Aprobado',
      notas: 'Garantía de 12 meses en mano de obra. Incluye certificación RETIE.',
      items: [
        {
          id: uid('item'),
          tipo: 'servicio',
          refId: 1,
          descripcion: 'Instalación de Tablero Trifásico',
          cantidad: 1,
          precioUnit: 3400000,
          unidad: 'Proyecto',
          monedaServicio: 'USD',
        },
        {
          id: uid('item'),
          tipo: 'material',
          refId: 'EL-BUS-585',
          descripcion: 'Barra de Cobre 50x5mm',
          cantidad: 12,
          precioUnit: 4500,
          unidad: 'Metro',
        },
        {
          id: uid('item'),
          tipo: 'material',
          refId: 'EL-CAB-254',
          descripcion: 'Cable XLPE 4C 25mm²',
          cantidad: 40,
          precioUnit: 28000,
          unidad: 'Metro',
        },
      ],
    },
    {
      id: `COT-${anio}-0002`,
      ...snapshotCliente(2, { cliente: 'Industrias Alfa S.A.', direccion: 'Medellín' }),
      proyecto: 'Mantenimiento de Tableros Industriales',
      fecha: fecha(8),
      fechaEmision: fecha(8),
      diasVigencia: 30,
      ivaPorcentaje: 16,
      descuento: 5,
      estadoCotizacion: 'Pendiente',
      notas: 'Mantenimiento semestral de tableros de distribución.',
      items: [
        {
          id: uid('item'),
          tipo: 'servicio',
          refId: 2,
          descripcion: 'Mantenimiento Preventivo',
          cantidad: 6,
          precioUnit: 260000,
          unidad: 'Hora',
          monedaServicio: 'USD / H',
        },
        {
          id: uid('item'),
          tipo: 'material',
          refId: 'EL-APA-001',
          descripcion: 'Interruptor 3P 100A',
          cantidad: 2,
          precioUnit: 650000,
          unidad: 'Unidad',
        },
      ],
    },
    {
      id: `COT-${anio}-0003`,
      ...snapshotCliente(3, { cliente: 'Comercializadora del Norte', direccion: 'Medellín' }),
      proyecto: 'Acometida Eléctrica Trifásica',
      fecha: fecha(5),
      fechaEmision: fecha(5),
      diasVigencia: 30,
      ivaPorcentaje: 16,
      descuento: 0,
      estadoCotizacion: 'Aprobado',
      notas: 'Incluye trámite de aprobación ante el operador de red.',
      items: [
        {
          id: uid('item'),
          tipo: 'servicio',
          refId: 5,
          descripcion: 'Instalación de Red Eléctrica',
          cantidad: 1,
          precioUnit: 1250000,
          unidad: 'Proyecto',
          monedaServicio: 'COP',
        },
        {
          id: uid('item'),
          tipo: 'material',
          refId: 'EL-CAN-025',
          descripcion: 'Conducto PVC 25mm',
          cantidad: 30,
          precioUnit: 3200,
          unidad: 'Metro',
        },
      ],
    },
    {
      id: `COT-${anio}-0004`,
      ...snapshotCliente(4, { cliente: 'Residencial Los Álamos', direccion: 'Bogotá' }),
      proyecto: 'Iluminación LED Áreas Comunes',
      fecha: fecha(2),
      fechaEmision: fecha(2),
      diasVigencia: 20,
      ivaPorcentaje: 16,
      descuento: 0,
      estadoCotizacion: 'Aprobado',
      notas: 'Suministro e instalación de luminarias LED en zonas comunes.',
      items: [
        {
          id: uid('item'),
          tipo: 'servicio',
          refId: 4,
          descripcion: 'Instalación Luminarias LED',
          cantidad: 8,
          precioUnit: 72000,
          unidad: 'Punto',
          monedaServicio: 'USD / H',
        },
        {
          id: uid('item'),
          tipo: 'material',
          refId: 'EL-ACC-TRM4',
          descripcion: 'Bloques Terminales 4mm²',
          cantidad: 40,
          precioUnit: 12000,
          unidad: 'Pieza',
        },
      ],
    },
    {
      id: `COT-${anio}-0005`,
      ...snapshotCliente(5, { cliente: 'Centro Comercial Bello', direccion: 'Bello' }),
      proyecto: 'Diagnóstico de Fallas Planta Principal',
      fecha: fecha(1),
      fechaEmision: fecha(1),
      diasVigencia: 15,
      ivaPorcentaje: 16,
      descuento: 0,
      estadoCotizacion: 'Rechazado',
      notas: 'El cliente solicitará una nueva evaluación el próximo trimestre.',
      items: [
        {
          id: uid('item'),
          tipo: 'servicio',
          refId: 6,
          descripcion: 'Diagnóstico de Fallas Eléctricas',
          cantidad: 4,
          precioUnit: 95000,
          unidad: 'Servicio',
          monedaServicio: 'COP / H',
        },
        {
          id: uid('item'),
          tipo: 'material',
          refId: 'EL-TRF-002',
          descripcion: 'Transformador Control 2kVA',
          cantidad: 1,
          precioUnit: 825000,
          unidad: 'Unidad',
        },
      ],
    },
  ];

  return semillas.map(normalizarCotizacion);
}

export function obtenerCotizaciones() {
  const guardadas = readStore(COTIZACIONES_KEY, null);
  const base = Array.isArray(guardadas) ? guardadas : crearSemilla();
  return base
    .map(normalizarCotizacion)
    .sort((a, b) => String(b.fechaEmision).localeCompare(String(a.fechaEmision)) || String(b.id).localeCompare(String(a.id)));
}

export function obtenerCotizacion(id) {
  return obtenerCotizaciones().find((cotizacion) => String(cotizacion.id) === String(id));
}

export function generarIdCotizacion() {
  const anio = new Date().getFullYear();
  const patron = new RegExp(`^COT-${anio}-(\\d+)$`, 'i');
  const ultimo = obtenerCotizaciones().reduce((mayor, cotizacion) => {
    const coincidencia = String(cotizacion.id).match(patron);
    return coincidencia ? Math.max(mayor, Number(coincidencia[1])) : mayor;
  }, 0);

  return `COT-${anio}-${String(ultimo + 1).padStart(4, '0')}`;
}

export function guardarCotizacion(datos, idOriginal = null) {
  const cotizaciones = obtenerCotizaciones();
  const cliente = obtenerCliente(datos.clienteId);
  const clienteId = datos.clienteId ?? cliente?.id ?? '';
  const nombreCliente = cliente?.nombre || datos.cliente || '';
  const items = (datos.items || []).map(normalizarItem).filter((item) => item.cantidad > 0);

  if (!nombreCliente.trim()) throw new Error('Selecciona un cliente para la cotización.');
  if (!String(datos.proyecto || '').trim()) throw new Error('Escribe el nombre del proyecto.');
  if (items.length === 0) throw new Error('Agrega al menos un servicio o material a la cotización.');

  const base = {
    ...datos,
    clienteId,
    cliente: nombreCliente,
    documento: datos.documento ?? cliente?.documento ?? '',
    contacto: datos.contacto ?? cliente?.contacto ?? '',
    telefono: datos.telefono ?? cliente?.telefono ?? '',
    correo: datos.correo ?? cliente?.correo ?? '',
    direccion: datos.direccion ?? cliente?.direccion ?? '',
    items,
  };

  if (idOriginal) {
    const existente = cotizaciones.find((cotizacion) => String(cotizacion.id) === String(idOriginal));
    if (!existente) throw new Error('No se encontró la cotización a editar.');

    const actualizada = normalizarCotizacion({
      ...existente,
      ...base,
      id: existente.id,
      actualizadoEn: new Date().toISOString(),
    });

    writeStore(
      COTIZACIONES_KEY,
      cotizaciones.map((cotizacion) => (
        String(cotizacion.id) === String(actualizada.id) ? actualizada : cotizacion
      )),
    );
    return actualizada;
  }

  const nueva = normalizarCotizacion({
    ...base,
    id: generarIdCotizacion(),
    fechaEmision: datos.fechaEmision || fechaISO(),
    fecha: datos.fechaEmision || fechaISO(),
    creadoEn: new Date().toISOString(),
  });

  writeStore(COTIZACIONES_KEY, [nueva, ...cotizaciones]);
  return nueva;
}

export function cambiarEstadoCotizacion(id, estado) {
  if (!ESTADOS_COTIZACION.includes(estado)) {
    throw new Error('Estado de cotización no válido.');
  }
  const cotizaciones = obtenerCotizaciones();
  const cotizacion = cotizaciones.find((item) => String(item.id) === String(id));
  if (!cotizacion) throw new Error('No se encontró la cotización.');

  const actualizada = { ...cotizacion, estadoCotizacion: estado };
  writeStore(
    COTIZACIONES_KEY,
    cotizaciones.map((item) => (String(item.id) === String(id) ? actualizada : item)),
  );
  return actualizada;
}

export function eliminarCotizacion(id) {
  const cotizaciones = obtenerCotizaciones();
  if (!cotizaciones.some((cotizacion) => String(cotizacion.id) === String(id))) {
    throw new Error('No se encontró la cotización.');
  }
  writeStore(
    COTIZACIONES_KEY,
    cotizaciones.filter((cotizacion) => String(cotizacion.id) !== String(id)),
  );
}

export function buscarCotizaciones(texto, cotizaciones = obtenerCotizaciones()) {
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

// El abono mínimo para poder aprobar una cotización pendiente.
export const ABONO_MINIMO_PORCENTAJE = 30;

export function minimoAbono(cotizacion) {
  return redondear(Math.max(0, numero(cotizacion?.total)) * (ABONO_MINIMO_PORCENTAJE / 100));
}

// Orden de llegada: primero lo pendiente, luego aprobado y por último rechazado.
const ORDEN_ESTADO = { Pendiente: 0, Aprobado: 1, Rechazado: 2 };

export function ordenarPorLlegada(cotizaciones) {
  return [...cotizaciones].sort((a, b) => {
    const porEstado = (ORDEN_ESTADO[a.estadoCotizacion] ?? 3) - (ORDEN_ESTADO[b.estadoCotizacion] ?? 3);
    if (porEstado !== 0) return porEstado;
    // Dentro del mismo estado, la más reciente va primero: lo nuevo aparece de primeras.
    return String(b.fechaLlegada || b.fechaEmision || '').localeCompare(
      String(a.fechaLlegada || a.fechaEmision || ''),
    ) || String(b.id).localeCompare(String(a.id));
  });
}

export function resumenCotizaciones(cotizaciones) {
  return cotizaciones.reduce(
    (resumen, cotizacion) => {
      resumen.total += cotizacion.total;
      resumen.cantidad += 1;
      if (cotizacion.estadoCotizacion === 'Aprobado') resumen.aprobadas += 1;
      if (cotizacion.estadoCotizacion === 'Pendiente') resumen.pendientes += 1;
      if (cotizacion.estadoCotizacion === 'Rechazado') resumen.rechazadas += 1;
      return resumen;
    },
    { total: 0, cantidad: 0, aprobadas: 0, pendientes: 0, rechazadas: 0 },
  );
}

export function asegurarCotizaciones() {
  if (!hasStore(COTIZACIONES_KEY)) {
    writeStore(COTIZACIONES_KEY, crearSemilla());
  }
}

export { TRM_USD };
