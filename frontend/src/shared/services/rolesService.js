export const MODULOS_PERMISO = [
  { id: 'panel', nombre: 'Panel de control' },
  { id: 'clientes', nombre: 'Clientes' },
  { id: 'terceros', nombre: 'Terceros' },
  { id: 'materiales', nombre: 'Materiales' },
  { id: 'servicios', nombre: 'Servicios' },
  { id: 'cotizaciones', nombre: 'Cotizaciones' },
  { id: 'abonos', nombre: 'Abonos y ventas' },
  { id: 'agenda', nombre: 'Agenda' },
  { id: 'ordenes', nombre: 'Órdenes de servicio' },
  { id: 'usuarios', nombre: 'Gestión de usuarios' },
  { id: 'roles', nombre: 'Roles y permisos' },
];

export const ACCIONES_PERMISO = [
  { id: 'ver', nombre: 'Ver' },
  { id: 'crear', nombre: 'Crear' },
  { id: 'editar', nombre: 'Editar' },
  { id: 'eliminar', nombre: 'Eliminar' },
];

export function generarCodigoRol(nombre) {
  const base = String(nombre || 'ROL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase()
    .slice(0, 14);
  return `ROL-${base || 'NUEVO'}`;
}

export function permisosOtorgados(rol) {
  return Object.values(rol?.permisos || {}).reduce(
    (total, acciones) => total + (Array.isArray(acciones) ? acciones.length : 0),
    0,
  );
}
