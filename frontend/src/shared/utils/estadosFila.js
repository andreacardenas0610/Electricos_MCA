import { ESTADOS, tonoEstado } from '../components/EstadoToggle.jsx';

const FILA_POR_TONO = {
  danger: 'mca-row--critico',
  warning: 'mca-row--bajo',
};

// «Inactivo» no es una alerta: el registro simplemente quedó dado de baja, así que la fila se ve tenue.
const ESTADOS_TENUES = ['inactivo'];

// Toda la barra de información toma color según el estado:
// rojo = crítico/rechazado/anulado, amarillo = pendiente o con alerta, gris = normal.
export function claseFilaEstado(estado, grupo) {
  const lista = ESTADOS[grupo] || [];
  const normalizado = String(estado || '').trim().toLowerCase();
  if (!normalizado) return '';
  if (ESTADOS_TENUES.includes(normalizado)) return 'mca-row--inactivo';
  const coincidencia = lista.find((item) => item.nombre.toLowerCase() === normalizado);
  if (!coincidencia) return '';
  return FILA_POR_TONO[tonoEstado(coincidencia.nombre, lista)] || '';
}
