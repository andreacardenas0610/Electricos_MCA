export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function numero(valor, defecto = 0) {
  const n = typeof valor === 'number' ? valor : parseFloat(String(valor ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : defecto;
}

export function redondear(valor) {
  return Math.round((numero(valor) + Number.EPSILON) * 100) / 100;
}

export function fechaISO(date = new Date()) {
  const copia = new Date(date);
  copia.setMinutes(copia.getMinutes() - copia.getTimezoneOffset());
  return copia.toISOString().slice(0, 10);
}

export function horaActual(date = new Date()) {
  const copia = new Date(date);
  copia.setMinutes(copia.getMinutes() - copia.getTimezoneOffset());
  return copia.toISOString().slice(11, 16);
}

export function sumarDias(dias, base = new Date()) {
  const fecha = new Date(base);
  fecha.setDate(fecha.getDate() + Number(dias || 0));
  return fechaISO(fecha);
}

export function formatearFecha(fecha) {
  if (!fecha) return '—';
  const partes = String(fecha).slice(0, 10).split('-');
  if (partes.length !== 3) return fecha;
  const date = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatearMoneda(valor, moneda = 'COP', decimales = 0) {
  const n = numero(valor);
  const esCOP = String(moneda).toUpperCase().startsWith('COP') || String(moneda).toUpperCase() === 'PESO';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: esCOP ? 'COP' : 'USD',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(n);
}
