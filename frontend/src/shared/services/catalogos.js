export const UNIDADES_MEDIDA = [
  'Unidad',
  'Pieza',
  'Metro',
  'Caja',
  'Rollo',
  'Paquete',
  'Kilogramo',
  'Litro',
  'Galón',
  'Par',
];

export const CATEGORIAS_MATERIALES_INICIALES = [
  { id: 'cat-conductores', nombre: 'Conductores', unidad: 'Metro', prefijo: 'EL-BUS' },
  { id: 'cat-aparamenta', nombre: 'Aparamenta', unidad: 'Unidad', prefijo: 'EL-APA' },
  { id: 'cat-cables', nombre: 'Cables', unidad: 'Metro', prefijo: 'EL-CAB' },
  { id: 'cat-canalizacion', nombre: 'Canalización', unidad: 'Metro', prefijo: 'EL-CAN' },
  { id: 'cat-transformadores', nombre: 'Transformadores', unidad: 'Unidad', prefijo: 'EL-TRF' },
  { id: 'cat-accesorios', nombre: 'Accesorios', unidad: 'Pieza', prefijo: 'EL-ACC' },
  { id: 'cat-iluminacion', nombre: 'Iluminación', unidad: 'Unidad', prefijo: 'EL-ILU' },
  { id: 'cat-herramientas', nombre: 'Herramientas', unidad: 'Unidad', prefijo: 'EL-HER' },
];

const UNIDAD_POR_CATEGORIA = {
  conductores: 'Metro',
  aparamenta: 'Unidad',
  cables: 'Metro',
  canalizacion: 'Metro',
  transformadores: 'Unidad',
  accesorios: 'Pieza',
  iluminacion: 'Unidad',
  herramientas: 'Unidad',
};

const PREFIJO_POR_CATEGORIA = {
  conductores: 'EL-BUS',
  aparamenta: 'EL-APA',
  cables: 'EL-CAB',
  canalizacion: 'EL-CAN',
  transformadores: 'EL-TRF',
  accesorios: 'EL-ACC',
  iluminacion: 'EL-ILU',
  herramientas: 'EL-HER',
};

const normalizarNombre = (nombre) => String(nombre || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

export function unidadSugeridaPorCategoria(nombreCategoria) {
  return UNIDAD_POR_CATEGORIA[normalizarNombre(nombreCategoria)] || 'Unidad';
}

export function prefijoPorCategoria(nombreCategoria) {
  const clave = normalizarNombre(nombreCategoria);
  if (PREFIJO_POR_CATEGORIA[clave]) return PREFIJO_POR_CATEGORIA[clave];
  const letras = clave.replace(/[^a-z]/g, '').slice(0, 3).toUpperCase() || 'MAT';
  return `EL-${letras}`;
}

export const CATEGORIAS_SERVICIO = ['Instalación', 'Mantenimiento', 'Protocolos', 'Emergencias'];

export const UNIDADES_SERVICIO = ['Proyecto', 'Hora', 'Punto', 'Servicio', 'Día', 'Unidad'];

export const MONEDAS_SERVICIO = ['USD', 'COP', 'USD / H', 'COP / H'];

export const REGLA_TIEMPO_MONEDA = {
  USD: { texto: '1 Día', horas: 8 },
  'USD / H': { texto: '4 Horas', horas: 4 },
  COP: { texto: '1 Día', horas: 8 },
  'COP / H': { texto: '8 Horas', horas: 8 },
};

export function reglaTiempoMoneda(moneda) {
  return REGLA_TIEMPO_MONEDA[moneda] || REGLA_TIEMPO_MONEDA.COP;
}

export function tiempoSugerido(moneda) {
  return reglaTiempoMoneda(moneda).texto;
}

export function horasServicio(servicio) {
  if (servicio?.horas) return Number(servicio.horas);
  return reglaTiempoMoneda(servicio?.moneda).horas;
}

export const TRM_USD = 4000;

export function precioEnCOP(precio, moneda = 'COP') {
  const valor = Number(precio) || 0;
  return String(moneda).toUpperCase().startsWith('USD') ? valor * TRM_USD : valor;
}

export const HORARIO_ATENCION = {
  0: null,
  1: { apertura: '07:00', cierre: '18:00' },
  2: { apertura: '07:00', cierre: '18:00' },
  3: { apertura: '07:00', cierre: '18:00' },
  4: { apertura: '07:00', cierre: '18:00' },
  5: { apertura: '07:00', cierre: '18:00' },
  6: { apertura: '08:00', cierre: '13:00' },
};

export const NOMBRES_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const MARGEN_MINIMO_AGENDA_MINUTOS = 60;
export const BUFFER_ENTRE_SERVICIOS_MINUTOS = 30;
export const DIAS_MAXIMOS_AGENDA = 60;

export function horaAMinutos(hora) {
  const [h, m] = String(hora || '00:00').split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

export function minutosAHora(minutos) {
  const total = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutos)));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function sumarMinutosAHora(hora, minutos) {
  return minutosAHora(horaAMinutos(hora) + Number(minutos || 0));
}

export function formatearHora12(hora) {
  const [h, m] = String(hora || '00:00').split(':').map(Number);
  const sufijo = h >= 12 ? 'p. m.' : 'a. m.';
  const hora12 = h % 12 === 0 ? 12 : h % 12;
  return `${hora12}:${String(m || 0).padStart(2, '0')} ${sufijo}`;
}

export function horarioDelDia(fecha) {
  if (!fecha) return null;
  const [anio, mes, dia] = String(fecha).slice(0, 10).split('-').map(Number);
  const date = new Date(anio, mes - 1, dia);
  return HORARIO_ATENCION[date.getDay()];
}

export function nombreDia(fecha) {
  if (!fecha) return '';
  const [anio, mes, dia] = String(fecha).slice(0, 10).split('-').map(Number);
  return NOMBRES_DIA[new Date(anio, mes - 1, dia).getDay()];
}

export function fechaConHora(fecha, hora = '00:00') {
  const [anio, mes, dia] = String(fecha).slice(0, 10).split('-').map(Number);
  const [h, m] = String(hora).split(':').map(Number);
  return new Date(anio, mes - 1, dia, h || 0, m || 0);
}
