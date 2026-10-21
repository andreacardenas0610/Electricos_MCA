import { readStore, writeStore } from './base.js';
import { USUARIOS_KEY, obtenerUsuarios } from './usuariosService.js';

export const ROLES_KEY = 'mca_roles';

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

const TODOS = ACCIONES_PERMISO.map((accion) => accion.id);

function permisosCompletos(modulos = MODULOS_PERMISO.map((modulo) => modulo.id)) {
  return Object.fromEntries(modulos.map((modulo) => [modulo, [...TODOS]]));
}

const ROLES_SEMILLA = [
  {
    id: 'rol-admin',
    nombre: 'Administrador',
    codigo: 'ROL-ADMIN',
    descripcion: 'Control general de la plataforma, la operación y la administración de accesos.',
    plataformas: ['Web', 'Móvil'],
    estado: 'Activo',
    permisos: permisosCompletos(),
  },
  {
    id: 'rol-supervisor',
    nombre: 'Supervisor',
    codigo: 'ROL-SUPER',
    descripcion: 'Seguimiento operativo de clientes, agenda, órdenes y equipos de trabajo.',
    plataformas: ['Web', 'Móvil'],
    estado: 'Activo',
    permisos: {
      ...permisosCompletos(['panel', 'clientes', 'terceros', 'agenda', 'ordenes']),
      materiales: ['ver'],
      servicios: ['ver'],
      cotizaciones: ['ver', 'crear', 'editar'],
      abonos: ['ver'],
      usuarios: ['ver'],
      roles: [],
    },
  },
  {
    id: 'rol-tecnico',
    nombre: 'Técnico',
    codigo: 'ROL-TECNICO',
    descripcion: 'Acceso operativo a la agenda y a las órdenes de servicio asignadas.',
    plataformas: ['Móvil'],
    estado: 'Activo',
    permisos: {
      panel: ['ver'],
      clientes: ['ver'],
      terceros: ['ver'],
      materiales: ['ver'],
      servicios: ['ver'],
      cotizaciones: [],
      abonos: [],
      agenda: ['ver', 'editar'],
      ordenes: ['ver', 'editar'],
      usuarios: [],
      roles: [],
    },
  },
  {
    id: 'rol-ventas',
    nombre: 'Ventas',
    codigo: 'ROL-VENTAS',
    descripcion: 'Gestión comercial de clientes, cotizaciones y recaudo de abonos.',
    plataformas: ['Web'],
    estado: 'Activo',
    permisos: {
      panel: ['ver'],
      clientes: ['ver', 'crear', 'editar'],
      terceros: ['ver'],
      materiales: ['ver'],
      servicios: ['ver'],
      cotizaciones: ['ver', 'crear', 'editar', 'eliminar'],
      abonos: ['ver', 'crear', 'editar'],
      agenda: ['ver'],
      ordenes: ['ver'],
      usuarios: [],
      roles: [],
    },
  },
  {
    id: 'rol-operario',
    nombre: 'Operario',
    codigo: 'ROL-OPER',
    descripcion: 'Consulta de materiales, agenda y órdenes de servicio en campo.',
    plataformas: ['Móvil'],
    estado: 'Activo',
    permisos: {
      panel: ['ver'],
      materiales: ['ver'],
      agenda: ['ver'],
      ordenes: ['ver'],
    },
  },
];

function normalizarPermisos(permisos = {}) {
  return Object.fromEntries(MODULOS_PERMISO.map((modulo) => {
    const acciones = Array.isArray(permisos[modulo.id]) ? permisos[modulo.id] : [];
    return [modulo.id, acciones.filter((accion) => TODOS.includes(accion))];
  }));
}

function normalizarRol(rol, indice) {
  return {
    id: rol.id || `rol-${indice + 1}`,
    nombre: String(rol.nombre || 'Sin nombre').trim(),
    codigo: rol.codigo || generarCodigoRol(rol.nombre || ''),
    descripcion: rol.descripcion || '',
    plataformas: Array.isArray(rol.plataformas) && rol.plataformas.length ? rol.plataformas : ['Web'],
    estado: rol.estado === 'Inactivo' ? 'Inactivo' : 'Activo',
    permisos: normalizarPermisos(rol.permisos),
  };
}

function leerCrudos() {
  const guardados = readStore(ROLES_KEY, null);
  return Array.isArray(guardados) && guardados.length ? guardados : ROLES_SEMILLA;
}

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

export function obtenerRoles() {
  return leerCrudos().map(normalizarRol);
}

export function obtenerRol(id) {
  return obtenerRoles().find((rol) => String(rol.id) === String(id)) || null;
}

export function asegurarRoles() {
  const guardados = readStore(ROLES_KEY, null);
  if (!Array.isArray(guardados) || guardados.length === 0) {
    writeStore(ROLES_KEY, ROLES_SEMILLA);
  }
}

export function usuariosPorRol() {
  return obtenerUsuarios().reduce((mapa, usuario) => {
    mapa[usuario.rol] = (mapa[usuario.rol] || 0) + 1;
    return mapa;
  }, {});
}

export function permisosOtorgados(rol) {
  return Object.values(rol?.permisos || {}).reduce((total, acciones) => total + acciones.length, 0);
}

export function tienePermiso(rol, modulo, accion) {
  return Boolean(rol?.permisos?.[modulo]?.includes(accion));
}

export function resumenRoles() {
  const roles = obtenerRoles();
  const usuarios = obtenerUsuarios();
  return {
    total: roles.length,
    activos: roles.filter((rol) => rol.estado === 'Activo').length,
    permisos: roles.reduce((total, rol) => total + permisosOtorgados(rol), 0),
    usuariosAsignados: usuarios.length,
  };
}

export function guardarRol(datos, idOriginal = null) {
  const roles = leerCrudos();
  const indice = idOriginal === null
    ? -1
    : roles.findIndex((rol) => String(rol.id) === String(idOriginal));
  const actual = indice >= 0 ? normalizarRol(roles[indice], indice) : null;

  const nombre = String(datos.nombre || '').trim();
  if (!nombre) throw new Error('El nombre del rol es obligatorio.');

  const duplicado = roles.some((rol) => (
    String(rol.nombre || '').toLowerCase() === nombre.toLowerCase()
    && String(rol.id) !== String(idOriginal)
  ));
  if (duplicado) throw new Error('Ya existe un rol con ese nombre.');

  const registro = {
    id: actual?.id || `rol-${Date.now().toString(36)}`,
    nombre,
    codigo: actual?.codigo || generarCodigoRol(nombre),
    descripcion: String(datos.descripcion || '').trim(),
    plataformas: Array.isArray(datos.plataformas) && datos.plataformas.length ? datos.plataformas : ['Web'],
    estado: datos.estado === 'Inactivo' ? 'Inactivo' : 'Activo',
    permisos: normalizarPermisos(datos.permisos || actual?.permisos || {}),
  };

  if (indice >= 0) {
    roles[indice] = registro;
  } else {
    roles.push(registro);
  }

  writeStore(ROLES_KEY, roles);

  if (actual && actual.nombre !== nombre) {
    const usuarios = readStore(USUARIOS_KEY, null);
    if (Array.isArray(usuarios)) {
      writeStore(USUARIOS_KEY, usuarios.map((usuario) => (
        usuario.rol === actual.nombre ? { ...usuario, rol: nombre } : usuario
      )));
    }
  }

  return normalizarRol(registro, 0);
}

export function cambiarEstadoRol(id) {
  const roles = leerCrudos();
  const indice = roles.findIndex((rol) => String(rol.id) === String(id));
  if (indice < 0) throw new Error('No se encontró el rol solicitado.');

  const actual = normalizarRol(roles[indice], indice);
  if (actual.nombre === 'Administrador') {
    throw new Error('El rol Administrador debe permanecer activo.');
  }

  const nuevoEstado = actual.estado === 'Activo' ? 'Inactivo' : 'Activo';
  if (nuevoEstado === 'Inactivo' && usuariosPorRol()[actual.nombre]) {
    throw new Error('No puedes inactivar un rol con usuarios asignados.');
  }

  roles[indice] = { ...roles[indice], estado: nuevoEstado };
  writeStore(ROLES_KEY, roles);
  return normalizarRol(roles[indice], indice);
}

export function eliminarRol(id) {
  const roles = leerCrudos();
  const rol = roles.find((item) => String(item.id) === String(id));
  if (!rol) throw new Error('No se encontró el rol solicitado.');

  const normalizado = normalizarRol(rol, 0);
  if (normalizado.nombre === 'Administrador') {
    throw new Error('El rol Administrador no se puede eliminar.');
  }
  if (usuariosPorRol()[normalizado.nombre]) {
    throw new Error('No puedes eliminar un rol con usuarios asignados.');
  }

  writeStore(ROLES_KEY, roles.filter((item) => String(item.id) !== String(id)));
  return true;
}
