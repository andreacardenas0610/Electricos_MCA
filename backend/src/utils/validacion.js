export function idValido(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function textoValido(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

export function correoValido(valor) {
  return typeof valor === 'string'
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

export function fechaValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.valueOf()) && fecha.toISOString().slice(0, 10) === valor;
}
