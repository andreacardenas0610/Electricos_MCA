import React from 'react';
import { Lock } from 'lucide-react';

const PALETA = {
  verde: { bg: '#e8f8ed', border: '#c2ebd0', textColor: '#1e5e3a' },
  amarillo: { bg: '#fef6d8', border: '#fbe2a0', textColor: '#7a4b08' },
  rojo: { bg: '#fce8e6', border: '#f7c5c0', textColor: '#8c1d18' },
  azul: { bg: '#e3ecfb', border: '#c3d7f7', textColor: '#1e40af' },
  indigo: { bg: '#e9e8fd', border: '#cfcdf8', textColor: '#3f3aa8' },
};

const TONO = {
  verde: 'success',
  amarillo: 'warning',
  rojo: 'danger',
  azul: 'info',
  indigo: 'indigo',
};

export const ESTADOS = {
  cotizacion: [
    { nombre: 'Aprobado', ...PALETA.verde },
    { nombre: 'Pendiente', ...PALETA.amarillo },
    { nombre: 'Rechazado', ...PALETA.rojo },
  ],
  inventario: [
    { nombre: 'Óptimo', ...PALETA.verde },
    { nombre: 'Medio', ...PALETA.amarillo },
    { nombre: 'Bajo Stock', ...PALETA.amarillo },
    { nombre: 'Crítico', ...PALETA.rojo },
  ],
  servicio: [
    { nombre: 'Activo', ...PALETA.verde },
    { nombre: 'Pausado', ...PALETA.amarillo },
    { nombre: 'Inactivo', ...PALETA.rojo },
  ],
  usuario: [
    { nombre: 'Activo', ...PALETA.verde },
    { nombre: 'Inactivo', ...PALETA.rojo },
  ],
  pago: [
    { nombre: 'PENDIENTE', ...PALETA.rojo },
    { nombre: 'ABONO PARCIAL', ...PALETA.amarillo },
    { nombre: 'LIQUIDADO', ...PALETA.verde },
  ],
  actividad: [
    { nombre: 'Programada', ...PALETA.amarillo },
    { nombre: 'En proceso', ...PALETA.azul },
    { nombre: 'Completada', ...PALETA.verde },
    { nombre: 'Cancelada', ...PALETA.rojo },
  ],
  orden: [
    { nombre: 'Pendiente', ...PALETA.amarillo },
    { nombre: 'Programada', ...PALETA.azul },
    { nombre: 'En ejecución', ...PALETA.indigo },
    { nombre: 'Finalizada', ...PALETA.verde },
    { nombre: 'Cancelada', ...PALETA.rojo },
  ],
  panel: [
    { nombre: 'Completado', ...PALETA.verde },
    { nombre: 'Pendiente', ...PALETA.amarillo },
    { nombre: 'Finalizado', ...PALETA.rojo },
  ],
};

export const estadoSiguiente = (lista, actual) => {
  const indice = lista.findIndex((item) => item.nombre === actual);
  const base = indice === -1 ? 0 : indice;
  return lista[(base + 1) % lista.length].nombre;
};

export const tonoEstado = (estado, estados = []) => {
  const config = estados.find((item) => item.nombre === estado);
  if (!config?.bg) return 'neutral';
  const clave = Object.keys(PALETA).find((color) => PALETA[color].bg === config.bg);
  return TONO[clave] || 'neutral';
};

export function EstadoToggle({ estado, estados = ESTADOS.usuario, onClick, width = 125, bloqueado, motivo }) {
  const indice = Math.max(0, estados.findIndex((item) => item.nombre === estado));
  const config = estados[indice] || estados[0];
  if (!config) return null;

  const ancho = Math.max(width, 58 + config.nombre.length * 6.3);

  const clave = Object.keys(PALETA).find(
    (color) => PALETA[color].bg === config.bg && PALETA[color].border === config.border,
  );

  // El estado se muestra como pastilla de color, sin el indicador deslizante.
  // Con «bloqueado» la pastilla se ve quemada: nadie la mueve a mano, solo la lógica del módulo.
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick || bloqueado}
      title={motivo || (onClick && !bloqueado ? 'Haz clic para cambiar el estado' : undefined)}
      className={`mca-estado mca-estado--${TONO[clave] || 'info'}${bloqueado ? ' mca-estado--bloqueado' : ''}`}
      style={{
        width: ancho,
        cursor: onClick && !bloqueado ? 'pointer' : 'default',
      }}
    >
      {bloqueado && <Lock size={11} strokeWidth={2.4} className="mca-estado__candado" />}
      {config.nombre}
    </button>
  );
}
