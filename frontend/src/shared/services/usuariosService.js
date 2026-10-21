import { readStore, writeStore } from './base.js';

export const USUARIOS_KEY = 'mca_usuarios';

export const ZONAS_USUARIO = ['General', 'Norte', 'Centro', 'Sur', 'Occidente'];

const USUARIOS_SEMILLA = [
  {
    id: 1,
    nombre: 'Administrador General',
    usuario: 'admin',
    correo: 'admin@electricosmca.com',
    password: '1033490682',
    rol: 'Administrador',
    zona: 'General',
    telefono: '310 555 0001',
    estado: 'Activo',
    ultimoAcceso: 'Hoy, 08:00 a. m.',
  },
  {
    id: 2,
    nombre: 'Angela Pareja',
    usuario: 'apartea',
    correo: 'admonmca16@gmail.com',
    password: '1033490682',
    rol: 'Administrador',
    zona: 'General',
    telefono: '310 555 0002',
    estado: 'Activo',
    ultimoAcceso: 'Hoy, 07:45 a. m.',
  },
  {
    id: 3,
    nombre: 'Carlos Mendoza',
    usuario: 'cmendoza',
    correo: 'carlos@electricosmca.com',
    password: '1033490682',
    rol: 'Técnico',
    zona: 'Norte',
    telefono: '310 555 0003',
    estado: 'Activo',
    ultimoAcceso: 'Ayer, 05:42 p. m.',
  },
  {
    id: 4,
    nombre: 'Laura Medina',
    usuario: 'lmedina',
    correo: 'laura@electricosmca.com',
    password: '1033490682',
    rol: 'Ventas',
    zona: 'Centro',
    telefono: '310 555 0004',
    estado: 'Activo',
    ultimoAcceso: 'Ayer, 03:18 p. m.',
  },
  {
    id: 5,
    nombre: 'Miguel Torres',
    usuario: 'mtorres',
    correo: 'miguel@electricosmca.com',
    password: '1033490682',
    rol: 'Técnico',
    zona: 'Sur',
    telefono: '310 555 0005',
    estado: 'Inactivo',
    ultimoAcceso: '20 sep 2026',
  },
];

function normalizarUsuario(usuario, indice) {
  const login = String(usuario.usuario || usuario.email?.split('@')[0] || `usuario${indice + 1}`).trim();
  return {
    id: usuario.id || indice + 1,
    nombre: String(usuario.nombre || login).trim(),
    usuario: login,
    correo: String(usuario.correo || usuario.email || '').trim(),
    password: usuario.password || '',
    rol: usuario.rol || (login === 'admin' ? 'Administrador' : 'Operario'),
    zona: usuario.zona || 'General',
    telefono: usuario.telefono || '',
    estado: usuario.estado === 'Inactivo' ? 'Inactivo' : 'Activo',
    ultimoAcceso: usuario.ultimoAcceso || 'Sin registro',
  };
}

function leerCrudos() {
  const guardados = readStore(USUARIOS_KEY, null);
  return Array.isArray(guardados) ? guardados : USUARIOS_SEMILLA;
}

function siguienteId(usuarios) {
  return usuarios.reduce((mayor, usuario) => Math.max(mayor, Number(usuario.id) || 0), 0) + 1;
}

export function obtenerUsuarios() {
  return leerCrudos().map(normalizarUsuario);
}

export function obtenerUsuario(id) {
  return obtenerUsuarios().find((usuario) => String(usuario.id) === String(id)) || null;
}

export function asegurarUsuarios() {
  const guardados = readStore(USUARIOS_KEY, null);
  if (!Array.isArray(guardados) || guardados.length === 0) {
    writeStore(USUARIOS_KEY, USUARIOS_SEMILLA);
  }
}

export function buscarUsuarios(texto) {
  const termino = String(texto || '').trim().toLowerCase();
  const usuarios = obtenerUsuarios();
  if (!termino) return usuarios;
  return usuarios.filter((usuario) => (
    `${usuario.nombre} ${usuario.usuario} ${usuario.correo} ${usuario.rol} ${usuario.zona}`
      .toLowerCase()
      .includes(termino)
  ));
}

export function resumenUsuarios() {
  const usuarios = obtenerUsuarios();
  return {
    total: usuarios.length,
    activos: usuarios.filter((usuario) => usuario.estado === 'Activo').length,
    administradores: usuarios.filter((usuario) => usuario.rol === 'Administrador').length,
    tecnicos: usuarios.filter((usuario) => usuario.rol === 'Técnico').length,
  };
}

export function guardarUsuario(datos, idOriginal = null) {
  const usuarios = leerCrudos();
  const indice = idOriginal === null
    ? -1
    : usuarios.findIndex((usuario) => String(usuario.id) === String(idOriginal));
  const actual = indice >= 0 ? normalizarUsuario(usuarios[indice], indice) : null;

  const nombre = String(datos.nombre || '').trim();
  const login = String(datos.usuario || '').trim();
  const correo = String(datos.correo || '').trim().toLowerCase();
  const telefono = String(datos.telefono || '').trim();
  const password = String(datos.password || '');
  const rol = datos.rol || 'Operario';
  const zona = datos.zona || 'General';

  if (!nombre) throw new Error('El nombre completo es obligatorio.');
  if (!login) throw new Error('El nombre de usuario es obligatorio.');
  if (!correo) throw new Error('El correo electrónico es obligatorio.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new Error('El correo electrónico no es válido.');
  if (!actual && password.length < 6) throw new Error('La contraseña debe tener mínimo 6 caracteres.');
  if (password && password.length < 6) throw new Error('La contraseña debe tener mínimo 6 caracteres.');

  const duplicadoUsuario = usuarios.some((usuario) => (
    String(usuario.usuario || '').toLowerCase() === login.toLowerCase()
    && String(usuario.id) !== String(idOriginal)
  ));
  if (duplicadoUsuario) throw new Error('Ya existe un usuario con ese nombre de acceso.');

  const duplicadoCorreo = usuarios.some((usuario) => (
    String(usuario.correo || usuario.email || '').toLowerCase() === correo
    && String(usuario.id) !== String(idOriginal)
  ));
  if (duplicadoCorreo) throw new Error('Ya existe un usuario con ese correo electrónico.');

  const registro = {
    id: actual?.id || siguienteId(usuarios),
    nombre,
    usuario: login,
    correo,
    password: password || actual?.password || '',
    rol,
    zona,
    telefono,
    estado: actual?.estado || 'Activo',
    ultimoAcceso: actual?.ultimoAcceso || 'Sin registro',
  };

  if (indice >= 0) {
    usuarios[indice] = registro;
  } else {
    usuarios.push(registro);
  }

  writeStore(USUARIOS_KEY, usuarios);
  return normalizarUsuario(registro, 0);
}

export function cambiarEstadoUsuario(id) {
  const usuarios = leerCrudos();
  const indice = usuarios.findIndex((usuario) => String(usuario.id) === String(id));
  if (indice < 0) throw new Error('No se encontró el usuario solicitado.');

  const actual = normalizarUsuario(usuarios[indice], indice);
  const nuevoEstado = actual.estado === 'Activo' ? 'Inactivo' : 'Activo';

  if (actual.usuario === 'admin' && nuevoEstado === 'Inactivo') {
    throw new Error('La cuenta administradora principal debe permanecer activa.');
  }

  usuarios[indice] = { ...usuarios[indice], estado: nuevoEstado };
  writeStore(USUARIOS_KEY, usuarios);
  return normalizarUsuario(usuarios[indice], indice);
}

export function eliminarUsuario(id) {
  const usuarios = leerCrudos();
  const usuario = usuarios.find((item) => String(item.id) === String(id));
  if (!usuario) throw new Error('No se encontró el usuario solicitado.');

  const normalizado = normalizarUsuario(usuario, 0);
  if (normalizado.usuario === 'admin') {
    throw new Error('No es posible eliminar la cuenta administradora principal.');
  }

  writeStore(USUARIOS_KEY, usuarios.filter((item) => String(item.id) !== String(id)));
  return true;
}
