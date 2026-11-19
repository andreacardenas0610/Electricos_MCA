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
  stdout.write('Contraseña del administrador (no se mostrará): ');

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

async function crearAdministrador() {
  const nombre = await preguntar('Nombre completo: ');
  const usuario = await preguntar('Nombre de usuario: ');
  const correo = await preguntar('Correo electrónico: ');
  const password = await preguntarContrasena();

  if (!textoValido(nombre) || nombre.length > 150) {
    throw new Error('El nombre debe tener entre 1 y 150 caracteres.');
  }
  if (!textoValido(usuario) || usuario.length > 50) {
    throw new Error('El usuario debe tener entre 1 y 50 caracteres.');
  }
  if (!correoValido(correo)) throw new Error('El correo electrónico no es válido.');
  if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');

  const passwordHash = await bcrypt.hash(password, 12);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('electricosmca:bootstrap-admin'))");
    const { rows: existentes } = await client.query(
      `SELECT u.id
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE lower(r.nombre) = lower('Administrador')
       LIMIT 1`,
    );
    if (existentes[0]) {
      throw new Error('Ya existe una cuenta Administrador; no se creó otra.');
    }

    const { rows: roles } = await client.query(
      `SELECT id FROM roles
       WHERE lower(nombre) = lower('Administrador') AND estado = 'Activo'
       LIMIT 1`,
    );
    if (!roles[0]) throw new Error('No existe un rol Administrador activo. Ejecuta primero seed.sql.');

    const { rows } = await client.query(
      `INSERT INTO usuarios
         (nombre_completo, usuario, correo_electronico, password_hash,
          estado, verificado, rol_id)
       VALUES ($1, $2, lower($3), $4, 'Activo', TRUE, $5)
       RETURNING id`,
      [nombre, usuario, correo, passwordHash, roles[0].id],
    );
    await client.query('COMMIT');
    console.log(`Cuenta administradora creada (id ${rows[0].id}).`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

try {
  await crearAdministrador();
} catch (error) {
  console.error(`No se pudo crear el administrador: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
