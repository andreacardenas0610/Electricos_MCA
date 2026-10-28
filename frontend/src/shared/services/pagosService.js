import { hasStore, numero, redondear, readStore, writeStore, fechaISO, horaActual } from './base.js';
import { obtenerCotizaciones, obtenerCotizacion } from './cotizacionesService.js';

export const PAGOS_KEY = 'mca_abonos_pagos';

export const METODOS_PAGO = [
  'Efectivo',
  'Transferencia',
  'Tarjeta Débito',
  'Tarjeta Crédito',
  'Nequi',
  'Daviplata',
  'PSE',
];

export function estadoPago(total, abonado) {
  const montoTotal = numero(total);
  const pagado = numero(abonado);
  if (montoTotal <= 0 || pagado <= 0) return 'PENDIENTE';
  if (pagado >= montoTotal) return 'LIQUIDADO';
  return 'ABONO PARCIAL';
}

// El primer abono debe cubrir como mínimo el 30% del total de la cotización.
export const ABONO_MINIMO_PORCENTAJE = 30;

export function minimoAbonoInicial(cuenta) {
  return redondear(Math.max(0, numero(cuenta?.montoTotal)) * (ABONO_MINIMO_PORCENTAJE / 100));
}

// El abono se registra el día en que se recibe el dinero: nunca con fecha futura.
export function fechaPagoFutura(fecha) {
  return Boolean(fecha) && String(fecha).slice(0, 10) > fechaISO();
}

export function normalizarPago(pago) {
  const snapshot = pago.cotizacion || pago.snapshot || {};
  return {
    ...pago,
    id: String(pago.id),
    cotizacionId: String(pago.cotizacionId || pago.codigo || ''),
    monto: Math.max(0, numero(pago.monto ?? pago.abono)),
    fecha: String(pago.fecha || fechaISO()).slice(0, 10),
    hora: pago.hora || horaActual(),
    metodo: pago.metodo || pago.metodoPago || 'Efectivo',
    referencia: pago.referencia || '',
    nota: pago.nota || '',
    cotizacion: {
      id: String(snapshot.id || pago.cotizacionId || ''),
      cliente: snapshot.cliente || pago.cliente || 'Cliente',
      proyecto: snapshot.proyecto || pago.proyecto || '',
      documento: snapshot.documento || pago.documento || '',
      montoTotal: numero(snapshot.montoTotal ?? pago.montoTotal),
    },
  };
}

export function obtenerPagos() {
  const guardados = readStore(PAGOS_KEY, null);
  const base = Array.isArray(guardados) ? guardados : [];
  return base
    .map(normalizarPago)
    .sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`));
}

export function generarIdPago() {
  const anio = new Date().getFullYear();
  const patron = new RegExp(`^PAG-${anio}-(\\d+)$`, 'i');
  const ultimo = obtenerPagos().reduce((mayor, pago) => {
    const coincidencia = String(pago.id).match(patron);
    return coincidencia ? Math.max(mayor, Number(coincidencia[1])) : mayor;
  }, 0);

  return `PAG-${anio}-${String(ultimo + 1).padStart(4, '0')}`;
}

export function obtenerCuentas() {
  const cotizaciones = obtenerCotizaciones();
  const pagos = obtenerPagos();
  const idsCotizaciones = new Set(cotizaciones.map((cotizacion) => String(cotizacion.id)));
  const cuentas = [];

  cotizaciones.forEach((cotizacion) => {
    const movimientos = pagos.filter((pago) => pago.cotizacionId === String(cotizacion.id));
    if (cotizacion.estadoCotizacion !== 'Aprobado' && movimientos.length === 0) return;

    const abonado = redondear(movimientos.reduce((total, pago) => total + pago.monto, 0));
    const montoTotal = redondear(cotizacion.total);

    cuentas.push({
      clave: `COT:${cotizacion.id}`,
      cotizacionId: cotizacion.id,
      idPago: movimientos[0]?.id || '',
      cliente: cotizacion.cliente,
      clienteId: cotizacion.clienteId,
      documento: cotizacion.documento,
      proyecto: cotizacion.proyecto,
      fecha: cotizacion.fechaEmision,
      montoTotal,
      abonado,
      saldo: Math.max(0, redondear(montoTotal - abonado)),
      estado: estadoPago(montoTotal, abonado),
      pagos: movimientos,
      ultimoPago: movimientos[0] || null,
      eliminada: false,
      esHistorica: false,
      cotizacionEstado: cotizacion.estadoCotizacion,
    });
  });

  const idsHistoricos = new Set(
    pagos
      .filter((pago) => !idsCotizaciones.has(pago.cotizacionId))
      .map((pago) => pago.cotizacionId),
  );

  idsHistoricos.forEach((cotizacionId) => {
    const movimientos = pagos.filter((pago) => pago.cotizacionId === cotizacionId);
    if (movimientos.length === 0) return;

    const referencia = movimientos[0].cotizacion;
    const montoTotal = redondear(referencia.montoTotal);
    const abonado = redondear(movimientos.reduce((total, pago) => total + pago.monto, 0));

    cuentas.push({
      clave: `HIS:${cotizacionId}`,
      cotizacionId,
      idPago: movimientos[0].id,
      cliente: referencia.cliente,
      clienteId: '',
      documento: referencia.documento,
      proyecto: referencia.proyecto,
      fecha: movimientos[0].fecha,
      montoTotal,
      abonado,
      saldo: Math.max(0, redondear(montoTotal - abonado)),
      estado: estadoPago(montoTotal, abonado),
      pagos: movimientos,
      ultimoPago: movimientos[0],
      eliminada: true,
      esHistorica: true,
      cotizacionEstado: 'Eliminada',
    });
  });

  return cuentas.sort((a, b) => {
    const fechaA = `${a.ultimoPago?.fecha || a.fecha} ${a.ultimoPago?.hora || ''}`;
    const fechaB = `${b.ultimoPago?.fecha || b.fecha} ${b.ultimoPago?.hora || ''}`;
    return fechaB.localeCompare(fechaA);
  });
}

export function obtenerCuenta(cotizacionId) {
  return obtenerCuentas().find((cuenta) => cuenta.cotizacionId === String(cotizacionId));
}

export function buscarCuentas(texto, cuentas = obtenerCuentas()) {
  const termino = String(texto || '').trim().toLowerCase();
  if (!termino) return cuentas;

  return cuentas.filter((cuenta) => {
    const idsPagos = cuenta.pagos.map((pago) => `${pago.id} ${pago.referencia}`).join(' ');
    return `${cuenta.cotizacionId} ${cuenta.idPago} ${cuenta.cliente} ${cuenta.proyecto} ${cuenta.documento} ${idsPagos}`
      .toLowerCase()
      .includes(termino);
  });
}

export function registrarAbono({ cotizacionId, monto, metodo, fecha, hora, referencia, nota }) {
  const valor = redondear(monto);
  if (!cotizacionId) throw new Error('Selecciona la cotización a abonar.');
  if (valor <= 0) throw new Error('El monto del abono debe ser mayor que cero.');

  const cuenta = obtenerCuenta(cotizacionId);
  if (!cuenta) throw new Error('No se encontró una cuenta asociada a esa cotización.');
  if (valor > cuenta.saldo) {
    throw new Error(`El abono supera el saldo pendiente (${cuenta.saldo.toLocaleString('es-CO')}).`);
  }

  const cotizacion = obtenerCotizacion(cotizacionId);
  const pago = normalizarPago({
    id: generarIdPago(),
    cotizacionId: cuenta.cotizacionId,
    monto: valor,
    metodo: metodo || 'Efectivo',
    fecha: fecha || fechaISO(),
    hora: hora || horaActual(),
    referencia: referencia || '',
    nota: nota || '',
    cotizacion: cotizacion
      ? {
        id: cotizacion.id,
        cliente: cotizacion.cliente,
        proyecto: cotizacion.proyecto,
        documento: cotizacion.documento,
        montoTotal: cotizacion.total,
      }
      : cuenta.pagos[0]?.cotizacion,
  });

  writeStore(PAGOS_KEY, [pago, ...obtenerPagos()]);
  return pago;
}

export function actualizarPago(id, datos) {
  const pagos = obtenerPagos();
  const pago = pagos.find((item) => String(item.id) === String(id));
  if (!pago) throw new Error('No se encontró el abono.');

  const monto = redondear(datos.monto ?? pago.monto);
  if (monto <= 0) throw new Error('El monto del abono debe ser mayor que cero.');

  const otros = pagos
    .filter((item) => item.cotizacionId === pago.cotizacionId && item.id !== pago.id)
    .reduce((total, item) => total + item.monto, 0);
  const limite = pago.cotizacion.montoTotal;

  if (limite > 0 && monto + otros > limite) {
    throw new Error('La suma de abonos supera el monto total de la cotización.');
  }

  const actualizado = normalizarPago({
    ...pago,
    ...datos,
    id: pago.id,
    cotizacionId: pago.cotizacionId,
    monto,
    cotizacion: pago.cotizacion,
  });

  writeStore(
    PAGOS_KEY,
    pagos.map((item) => (String(item.id) === String(id) ? actualizado : item)),
  );
  return actualizado;
}

export function eliminarPago(id) {
  const pagos = obtenerPagos();
  if (!pagos.some((pago) => String(pago.id) === String(id))) {
    throw new Error('No se encontró el abono.');
  }
  writeStore(PAGOS_KEY, pagos.filter((pago) => String(pago.id) !== String(id)));
}

export function resumenPagos(cuentas) {
  return cuentas.reduce(
    (resumen, cuenta) => {
      resumen.facturado += cuenta.montoTotal;
      resumen.abonado += cuenta.abonado;
      resumen.saldo += cuenta.saldo;
      if (!cuenta.esHistorica) {
        if (cuenta.estado === 'LIQUIDADO') resumen.liquidadas += 1;
        else if (cuenta.estado === 'ABONO PARCIAL') resumen.parciales += 1;
        else resumen.pendientes += 1;
      }
      return resumen;
    },
    { facturado: 0, abonado: 0, saldo: 0, liquidadas: 0, parciales: 0, pendientes: 0 },
  );
}

export function asegurarPagos() {
  if (hasStore(PAGOS_KEY)) return;

  const aprobadas = obtenerCotizaciones()
    .filter((cotizacion) => cotizacion.estadoCotizacion === 'Aprobado')
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  const pagos = [];
  const anio = new Date().getFullYear();
  let secuencia = 1;

  const crearPagoSemilla = (cotizacion, porcentaje, diasAtras, metodo, hora) => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - diasAtras);
    const monto = redondear(cotizacion.total * porcentaje);
    if (monto <= 0) return;

    pagos.push(normalizarPago({
      id: `PAG-${anio}-${String(secuencia).padStart(4, '0')}`,
      cotizacionId: cotizacion.id,
      monto,
      metodo,
      fecha: fechaISO(fecha),
      hora,
      referencia: `Abono ${porcentaje === 1 ? 'total' : `${Math.round(porcentaje * 100)}%`}`,
      nota: 'Registro inicial de prueba',
      cotizacion: {
        id: cotizacion.id,
        cliente: cotizacion.cliente,
        proyecto: cotizacion.proyecto,
        documento: cotizacion.documento,
        montoTotal: cotizacion.total,
      },
    }));
    secuencia += 1;
  };

  if (aprobadas[0]) {
    crearPagoSemilla(aprobadas[0], 0.4, 6, 'Transferencia', '10:20');
    crearPagoSemilla(aprobadas[0], 0.25, 2, 'Nequi', '15:45');
  }
  if (aprobadas[1]) {
    crearPagoSemilla(aprobadas[1], 1, 4, 'PSE', '11:05');
  }

  writeStore(PAGOS_KEY, pagos.reverse());
}
