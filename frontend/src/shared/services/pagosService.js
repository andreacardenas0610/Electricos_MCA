import { fechaISO, horaActual, numero, redondear } from './base.js';

export const METODOS_PAGO = [
  'Efectivo',
  'Transferencia',
  'Tarjeta Débito',
  'Tarjeta Crédito',
  'Nequi',
  'Daviplata',
  'PSE',
];

export const ABONO_MINIMO_PORCENTAJE = 30;

export function estadoPago(total, abonado) {
  const montoTotal = numero(total);
  const pagado = numero(abonado);
  if (montoTotal <= 0 || pagado <= 0) return 'PENDIENTE';
  if (pagado >= montoTotal) return 'LIQUIDADO';
  return 'ABONO PARCIAL';
}

export function minimoAbonoInicial(cuenta) {
  return redondear(Math.max(0, numero(cuenta?.montoTotal)) * (ABONO_MINIMO_PORCENTAJE / 100));
}

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

export function buscarCuentas(texto, cuentas = []) {
  const termino = String(texto || '').trim().toLowerCase();
  if (!termino) return cuentas;

  return cuentas.filter((cuenta) => {
    const idsPagos = (cuenta.pagos || [])
      .map((pago) => `${pago.id} ${pago.referencia}`)
      .join(' ');
    return `${cuenta.cotizacionId} ${cuenta.idPago} ${cuenta.cliente} ${cuenta.proyecto} ${cuenta.documento} ${idsPagos}`
      .toLowerCase()
      .includes(termino);
  });
}

export function resumenPagos(cuentas) {
  return cuentas.reduce(
    (resumen, cuenta) => {
      resumen.facturado += numero(cuenta.montoTotal);
      resumen.abonado += numero(cuenta.abonado);
      resumen.saldo += numero(cuenta.saldo);
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
