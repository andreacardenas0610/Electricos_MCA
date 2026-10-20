import 'dotenv/config';
import readline from 'node:readline';
import { stdin, stdout } from 'node:process';
import bcrypt from 'bcryptjs';
import { pool } from '../src/db.js';
import { textoValido } from '../src/utils/validacion.js';

function preguntar(mensaje) {
  const interfaz = readline.createInterface({ input: stdin, output: stdout });
  return new Promise((resolve) => interfaz.question(mensaje, (respuesta) => {
    interfaz.close();
    resolve(respuesta.trim());
  }));
}

function preguntarContrasena() {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('Ejecuta este comando desde una terminal interactiva.');
  }

  readline.emitKeypressEvents(stdin);
  stdin.setRawMode(true);
  stdin.resume();
  stdout.write('Contraseña del técnico (no se mostrará): ');

  return new Promise((resolve, reject) => {
    let contrasena = '';
    const alPresionar = (caracter, tecla) => {
      if (tecla?.ctrl && tecla.name === 'c') {
        stdin.setRawMode(false);
        stdin.off('keypress', alPresionar);
        stdout.write('\n');
        reject(new Error('Operación cancelada.'));
      } else if (tecla?.name === 'return' || tecla?.name === 'enter') {
        stdin.setRawMode(false);
        stdin.off('keypress', alPresionar);
        stdout.write('\n');
        resolve(contrasena);
      } else if (tecla?.name === 'backspace') {
        contrasena = contrasena.slice(0, -1);
      } else if (!tecla?.ctrl && !tecla?.meta) {
        contrasena += caracter;
      }
    };
    stdin.on('keypress', alPresionar);
  });
}

async function configurarTecnico() {
  const documento = await preguntar('Documento del técnico registrado en terceros: ');
  const usuario = await preguntar('Nombre de usuario para la app móvil: ');
  const password = await preguntarContrasena();

  if (!textoValido(documento) || !textoValido(usuario) || usuario.length > 50) {
    throw new Error('Documento o nombre de usuario no válido.');
  }
  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const usuarioAdmin = await pool.query(
    'SELECT id FROM usuarios WHERE lower(usuario) = lower($1) LIMIT 1',
    [usuario],
  );
  if (usuarioAdmin.rowCount) {
    throw new Error('Ese nombre de usuario ya pertenece a una cuenta de administrador.');
  }

  const resultado = await pool.query(
    `UPDATE terceros
     SET usuario = $1, password_hash = $2
     WHERE documento = $3
     RETURNING id`,
    [usuario, passwordHash, documento],
  );

  if (!resultado.rowCount) {
    throw new Error('No se encontró un técnico con ese documento en la tabla terceros.');
  }
  console.log(`Credenciales móviles actualizadas para "${usuario}".`);
}

try {
  await configurarTecnico();
} catch (error) {
  console.error(`No se pudo configurar el técnico: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
