import 'dotenv/config';
import readline from 'node:readline';
import { stdin, stdout } from 'node:process';
import bcrypt from 'bcryptjs';
import { pool } from '../src/db.js';
import { correoValido, textoValido } from '../src/utils/validacion.js';

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
  stdout.write('Contraseña actual (no se mostrará): ');

  return new Promise((resolve, reject) => {
    let contrasena = '';
    const alPresionar = (caracter, tecla) => {
      if (tecla?.ctrl && tecla.name === 'c') {
        stdin.setRawMode(false);
        stdin.off('keypress', alPresionar);
        stdout.write('\n');
        reject(new Error('Operación cancelada.'));
        return;
      }
      if (tecla?.name === 'return' || tecla?.name === 'enter') {
        stdin.setRawMode(false);
        stdin.off('keypress', alPresionar);
        stdout.write('\n');
        resolve(contrasena);
        return;
      }
      if (tecla?.name === 'backspace') {
        contrasena = contrasena.slice(0, -1);
        return;
      }
      if (!tecla?.ctrl && !tecla?.meta) contrasena += caracter;
    };
    stdin.on('keypress', alPresionar);
  });
}

async function configurarUsuario() {
  const username = await preguntar('Nombre de usuario para iniciar sesión: ');
  const correo = await preguntar('Correo actual de esa cuenta en la base de datos: ');
  const password = await preguntarContrasena();

  if (!textoValido(username) || username.length > 50) {
    throw new Error('El usuario debe tener entre 1 y 50 caracteres.');
  }
  if (!correoValido(correo)) {
    throw new Error('El correo no tiene un formato válido.');
  }
  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const usuarioEnTerceros = await pool.query(
    'SELECT id FROM terceros WHERE lower(usuario) = lower($1) LIMIT 1',
    [username],
  );
  if (usuarioEnTerceros.rowCount) {
    throw new Error('Ese nombre de usuario ya pertenece a un técnico tercero.');
  }

  const resultado = await pool.query(
    `UPDATE usuarios
     SET usuario = $1, password_hash = $2
     WHERE lower(correo_electronico) = lower($3)
     RETURNING id`,
    [username, passwordHash, correo],
  );

  if (!resultado.rowCount) {
    throw new Error('No se encontró una cuenta con ese correo en la tabla usuarios.');
  }

  console.log(`Credenciales actualizadas para el usuario "${username}".`);
}

try {
  await configurarUsuario();
} catch (error) {
  console.error(`No se pudo configurar el usuario: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
