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
  const correo = await preguntar('Correo electrónico del técnico: ');
  const password = await preguntarContrasena();

  if (!textoValido(documento) || !textoValido(usuario) || usuario.length > 50) {
    throw new Error('Documento o nombre de usuario no válido.');
  }
  if (!correoValido(correo)) throw new Error('El correo electrónico no es válido.');
  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: perfiles } = await client.query(
      'SELECT id, nombre_completo FROM terceros WHERE documento = $1 FOR UPDATE',
      [documento],
    );
    if (!perfiles[0]) throw new Error('No se encontró un técnico con ese documento en la tabla terceros.');

    const { rows: roles } = await client.query(
      `SELECT id FROM roles
       WHERE lower(nombre) = lower('Técnico') AND estado = 'Activo'
       LIMIT 1`,
    );
    if (!roles[0]) throw new Error('No existe un rol Técnico activo.');

    const { rows: existentes } = await client.query(
      'SELECT id FROM usuarios WHERE tercero_id = $1 FOR UPDATE',
      [perfiles[0].id],
    );
    if (existentes[0]) {
      await client.query(
        `UPDATE usuarios
         SET nombre_completo = $1, usuario = $2, correo_electronico = lower($3),
             password_hash = $4, estado = 'Activo', verificado = TRUE,
             rol_id = $5, actualizado_en = now()
         WHERE id = $6`,
        [perfiles[0].nombre_completo, usuario, correo, passwordHash, roles[0].id, existentes[0].id],
      );
    } else {
      await client.query(
        `INSERT INTO usuarios
           (nombre_completo, usuario, correo_electronico, password_hash,
            estado, verificado, rol_id, tercero_id)
         VALUES ($1, $2, lower($3), $4, 'Activo', TRUE, $5, $6)`,
        [perfiles[0].nombre_completo, usuario, correo, passwordHash, roles[0].id, perfiles[0].id],
      );
    }
    await client.query(
      'UPDATE terceros SET correo_electronico = lower($1) WHERE id = $2',
      [correo, perfiles[0].id],
    );
    await client.query('COMMIT');
    console.log(`Cuenta móvil actualizada para "${usuario}".`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

try {
  await configurarTecnico();
} catch (error) {
  console.error(`No se pudo configurar el técnico: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
