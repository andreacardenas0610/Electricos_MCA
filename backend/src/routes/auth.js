import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { textoValido } from '../utils/validacion.js';

const router = Router();

const VIGENCIA_RECUPERACION = '30m';
const VENTANA_SOLICITUDES_MS = 15 * 60 * 1000;
const MAX_SOLICITUDES_RECUPERACION = 5;
const solicitudesRecuperacion = new Map();

// Sin SMTP el enlace se imprime en la consola del servidor y nunca se devuelve al navegador:
// el token no queda expuesto a cualquiera que conozca el usuario.
const MENSAJE_RECUPERACION = 'Si la cuenta existe y tiene un correo registrado, enviamos las instrucciones para restablecer la contraseña. Revisa también la bandeja de spam.';

function huellaPassword(hash) {
  return crypto.createHash('sha256').update(String(hash || '')).digest('hex').slice(0, 24);
}

function origenFrontend() {
  const origenes = String(process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return origenes[0] || 'http://localhost:5173';
}

function puedeSolicitarRecuperacion(clave) {
  const ahora = Date.now();
  for (const [registrada, registro] of solicitudesRecuperacion) {
    if (ahora - registro.inicio > VENTANA_SOLICITUDES_MS) solicitudesRecuperacion.delete(registrada);
  }
  const registro = solicitudesRecuperacion.get(clave);
  if (!registro) {
    solicitudesRecuperacion.set(clave, { cantidad: 1, inicio: ahora });
    return true;
  }
  registro.cantidad += 1;
  return registro.cantidad <= MAX_SOLICITUDES_RECUPERACION;
}

function construirCorreoRecuperacion(nombre, enlace) {
  const subject = 'Recuperación de contraseña · Eléctricos MCA';
  const text = [
    `Hola ${nombre || 'usuario'},`,
    '',
    'Recibimos una solicitud para restablecer la contraseña de tu cuenta en Eléctricos MCA.',
    'Abre este enlace (vence en 30 minutos) y define una nueva contraseña:',
    '',
    enlace,
    '',
    'Si no solicitaste el cambio, ignora este mensaje: tu contraseña actual sigue funcionando.',
  ].join('\n');
  return { subject, text };
}

async function enviarCorreoRecuperacion(destinatario, subject, text) {
  const mailModule = await import('nodemailer');
  const mailer = mailModule.default ?? mailModule;
  const transporte = mailer.createTransport(
    process.env.SMTP_SERVICE
      ? { service: process.env.SMTP_SERVICE, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
      : {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || 'false') === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
  );
  await transporte.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: destinatario,
    subject,
    text,
  });
}


router.post('/login', async (req, res, next) => {
  try {
    const { usuario: nombreUsuario, password, plataforma } = req.body || {};

    if (
      !textoValido(nombreUsuario)
      || typeof password !== 'string'
      || !password
      || !['web', 'movil'].includes(plataforma)
    ) {
      return res.status(400).json({ mensaje: 'Ingresa usuario, contraseña y una plataforma válida (web o movil).' });
    }

    const resultado = await pool.query(
      `SELECT u.id, u.usuario, u.nombre_completo, u.correo_electronico, u.password_hash,
              u.estado, u.rol_id, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE lower(u.usuario) = lower($1)
       LIMIT 1`,
      [nombreUsuario.trim()],
    );

    let cuenta = resultado.rows[0]
      ? { ...resultado.rows[0], tipoCuenta: 'usuario' }
      : null;

    if (!cuenta && plataforma === 'movil') {
      const terceroResultado = await pool.query(
        `SELECT id, nombre_completo, usuario, password_hash, estado
         FROM terceros
         WHERE lower(usuario) = lower($1)
         LIMIT 1`,
        [nombreUsuario.trim()],
      );
      if (terceroResultado.rows[0]) {
        cuenta = { ...terceroResultado.rows[0], tipoCuenta: 'tercero' };
      }
    }

    const esAdministrador = cuenta?.tipoCuenta === 'usuario'
      && cuenta.rol === 'Administrador';
    const esTecnicoMovil = cuenta?.tipoCuenta === 'tercero'
      && plataforma === 'movil';

    if (
      !cuenta
      || cuenta.estado !== 'Activo'
      || (!esAdministrador && !esTecnicoMovil)
      || typeof cuenta.password_hash !== 'string'
      || !(await bcrypt.compare(password, cuenta.password_hash))
    ) {
      return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos, o cuenta sin acceso a esta plataforma.' });
    }

    const token = jwt.sign(
      {
        id: cuenta.id,
        tipoCuenta: cuenta.tipoCuenta,
        rolId: cuenta.rol_id || null,
        rol: cuenta.rol || 'Técnico tercero',
        plataforma,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h', audience: plataforma },
    );

    return res.json({
      token,
      usuario: {
        id: cuenta.id,
        usuario: cuenta.usuario,
        nombre: cuenta.nombre_completo,
        correo: cuenta.correo_electronico || null,
        rol: cuenta.rol || 'Técnico tercero',
        tipoCuenta: cuenta.tipoCuenta,
        plataforma,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// Solicitud de recuperación: responde siempre lo mismo para no revelar si la cuenta existe.
router.post('/recuperar', async (req, res, next) => {
  const identificador = String(req.body?.identificador || '').trim();
  if (identificador.length < 2) {
    return res.status(400).json({ mensaje: 'Escribe tu usuario o correo electrónico.' });
  }

  try {
    const clave = `${req.ip}:${identificador.toLowerCase()}`;
    if (!puedeSolicitarRecuperacion(clave)) return res.json({ mensaje: MENSAJE_RECUPERACION });

    const { rows } = await pool.query(
      `SELECT id, nombre_completo, correo_electronico, password_hash, estado
       FROM usuarios
       WHERE lower(usuario) = lower($1)
          OR lower(coalesce(correo_electronico, '')) = lower($1)
       LIMIT 1`,
      [identificador],
    );
    const cuenta = rows[0];

    if (cuenta && cuenta.estado === 'Activo' && cuenta.correo_electronico) {
      const token = jwt.sign(
        { id: cuenta.id, tipo: 'recuperacion', huella: huellaPassword(cuenta.password_hash) },
        process.env.JWT_SECRET,
        { expiresIn: VIGENCIA_RECUPERACION, audience: 'recuperacion' },
      );
      const enlace = `${origenFrontend()}/?recuperar=${encodeURIComponent(token)}`;
      const { subject, text } = construirCorreoRecuperacion(cuenta.nombre_completo, enlace);

      if (process.env.SMTP_HOST || process.env.SMTP_SERVICE) {
        try {
          await enviarCorreoRecuperacion(cuenta.correo_electronico, subject, text);
        } catch (error) {
          const faltaPaquete = error?.code === 'ERR_MODULE_NOT_FOUND'
            || /nodemailer/i.test(String(error?.message));
          console.error(`[recuperación] No se pudo enviar el correo: ${faltaPaquete ? 'falta la librería nodemailer (npm install nodemailer en backend/)' : error.message}`);
          console.log(`[recuperación] Enlace manual para la cuenta ${cuenta.id}: ${enlace}`);
        }
      } else {
        console.log('[recuperación] SMTP no configurado. Enlace para restablecer la contraseña:');
        console.log(enlace);
      }
    }

    return res.json({ mensaje: MENSAJE_RECUPERACION });
  } catch (error) {
    return next(error);
  }
});

router.post('/restablecer', async (req, res, next) => {
  const { token, password } = req.body || {};
  if (typeof token !== 'string' || !token.trim()) {
    return res.status(400).json({ mensaje: 'El enlace de recuperación no es válido.' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 8 caracteres.' });
  }

  const invalido = { mensaje: 'El enlace venció o ya fue usado. Solicita uno nuevo.' };

  try {
    let datos;
    try {
      datos = jwt.verify(token.trim(), process.env.JWT_SECRET, { audience: 'recuperacion' });
    } catch {
      return res.status(400).json(invalido);
    }
    if (datos?.tipo !== 'recuperacion' || !datos?.id) return res.status(400).json(invalido);

    const { rows } = await pool.query(
      'SELECT id, estado, password_hash FROM usuarios WHERE id = $1',
      [datos.id],
    );
    const cuenta = rows[0];
    // La huella del hash actual invalida el enlace en cuanto la contraseña cambia.
    if (
      !cuenta
      || cuenta.estado !== 'Activo'
      || huellaPassword(cuenta.password_hash) !== datos.huella
    ) {
      return res.status(400).json(invalido);
    }

    const hash = await bcrypt.hash(password, 12);
    await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hash, cuenta.id]);

    return res.json({
      mensaje: 'Contraseña actualizada. Ya puedes iniciar sesión con la nueva contraseña.',
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
