import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { correoValido, textoValido } from '../utils/validacion.js';
import { configuracionCorreo, enviarCorreo } from '../utils/correo.js';

const router = Router();

const VIGENCIA_RECUPERACION_MS = 30 * 60 * 1000;
const VIGENCIA_VERIFICACION_MS = 24 * 60 * 60 * 1000;
const VENTANA_SOLICITUDES_MS = 15 * 60 * 1000;
const MAX_SOLICITUDES_RECUPERACION = 5;
const solicitudesRecuperacion = new Map();

const MENSAJE_RECUPERACION = 'Si la cuenta existe y tiene un correo registrado, enviamos las instrucciones para restablecer la contraseña. Revisa también la bandeja de spam.';
const MENSAJE_VERIFICACION = 'Si la cuenta existe y aún no está verificada, enviaremos un nuevo enlace a su correo.';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function esOrigenPrivado(origin) {
  try {
    const { hostname, protocol } = new URL(origin);
    if (!['http:', 'https:'].includes(protocol)) return false;
    return hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname === '::1'
      || /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)
      || /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
      || /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname);
  } catch {
    return false;
  }
}

// El enlace debe abrir el frontend desde donde se pidió la recuperación (localhost,
// la IP de la red o el dominio de FRONTEND_URL), no siempre localhost.
function origenFrontend(req) {
  const configurados = String(process.env.FRONTEND_URL || '')
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const origenPeticion = req?.headers?.origin || '';
  if (esOrigenPrivado(origenPeticion)) return new URL(origenPeticion).origin;

  return configurados[0] || 'http://localhost:5173';
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

function construirCorreoVerificacion(nombre, enlace) {
  return {
    subject: 'Verifica tu cuenta · Eléctricos MCA',
    text: [
      `Hola ${nombre || 'usuario'},`,
      '',
      'Confirma tu correo para activar el acceso móvil a Eléctricos MCA:',
      enlace,
      '',
      'El enlace vence en 24 horas.',
    ].join('\n'),
  };
}

async function enviarCorreoCuenta(destinatario, subject, text) {
  await enviarCorreo({ destinatario, subject, text });
}

async function crearToken(client, usuarioId, proposito, vigenciaMs) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiraEn = new Date(Date.now() + vigenciaMs);
  await client.query(
    `UPDATE tokens_verificacion SET usado_en = now()
     WHERE usuario_id = $1 AND proposito = $2 AND usado_en IS NULL`,
    [usuarioId, proposito],
  );
  await client.query(
    `INSERT INTO tokens_verificacion (usuario_id, token_hash, proposito, expira_en)
     VALUES ($1, $2, $3, $4)`,
    [usuarioId, hashToken(token), proposito, expiraEn],
  );
  return token;
}

async function enviarEnlaceCuenta(usuario, tipo, token, req) {
  const esVerificacion = tipo === 'verificacion';
  const enlace = `${origenFrontend(req)}/?${esVerificacion ? 'verificar' : 'recuperar'}=${encodeURIComponent(token)}`;
  const mensaje = esVerificacion
    ? construirCorreoVerificacion(usuario.nombre_completo, enlace)
    : construirCorreoRecuperacion(usuario.nombre_completo, enlace);

  // Sin proveedor de correo el servidor no puede enviar nada: en desarrollo se
  // devuelve el enlace para poder probar el resto del flujo; en producción es un error.
  if (!configuracionCorreo().configurado) {
    if (process.env.NODE_ENV === 'production') {
      const error = new Error('El envío de correo no está configurado en el servidor.');
      error.status = 503;
      throw error;
    }
    console.info('[auth] Correo no configurado. Enlace de desarrollo generado.');
    return { enlace, enviado: false };
  }

  await enviarCorreo({
    destinatario: usuario.correo_electronico,
    subject: mensaje.subject,
    text: mensaje.text,
  });
  return { enlace, enviado: true };
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
      `SELECT u.id, u.usuario,
              COALESCE(p.nombre_completo, u.nombre_completo) AS nombre_completo,
              COALESCE(p.correo_electronico, u.correo_electronico) AS correo_electronico,
              u.password_hash,
              u.estado, u.verificado, u.rol_id, u.tercero_id,
              r.nombre AS rol, r.plataformas,
              COALESCE(p.nombre_completo, t.nombre_completo) AS tecnico_nombre
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       LEFT JOIN terceros t ON t.id = u.tercero_id
       LEFT JOIN personas p ON p.id = u.persona_id
       WHERE lower(u.usuario) = lower($1)
       LIMIT 1`,
      [nombreUsuario.trim()],
    );

    const cuenta = resultado.rows[0] || null;
    const esAdministrador = cuenta?.rol === 'Administrador';
    const plataformaRol = plataforma === 'web' ? 'Web' : 'Móvil';
    const tieneAccesoPlataforma = cuenta?.plataformas?.includes(plataformaRol);
    const tieneAcceso = plataforma === 'web'
      ? esAdministrador && tieneAccesoPlataforma
      : Boolean(cuenta?.tercero_id) && tieneAccesoPlataforma;

    if (
      !cuenta
      || cuenta.estado !== 'Activo'
      || cuenta.verificado !== true
      || !tieneAcceso
      || typeof cuenta.password_hash !== 'string'
      || !(await bcrypt.compare(password, cuenta.password_hash))
    ) {
      return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos, o cuenta sin acceso a esta plataforma.' });
    }

    const token = jwt.sign(
      {
        id: cuenta.id,
        tipoCuenta: 'usuario',
        terceroId: cuenta.tercero_id || null,
        rolId: cuenta.rol_id,
        rol: cuenta.rol,
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
        nombre: cuenta.tecnico_nombre || cuenta.nombre_completo,
        correo: cuenta.correo_electronico || null,
        rol: cuenta.rol,
        tipoCuenta: 'usuario',
        terceroId: cuenta.tercero_id || null,
        plataforma,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/registro', async (req, res, next) => {
  const datos = req.body || {};
  if (
    !textoValido(datos.nombre)
    || !textoValido(datos.usuario)
    || !correoValido(datos.correo)
    || !textoValido(datos.documento)
    || typeof datos.password !== 'string'
    || datos.password.length < 8
  ) {
    return res.status(400).json({
      mensaje: 'Nombre, usuario, documento, correo válido y contraseña de al menos 8 caracteres son obligatorios.',
    });
  }

  const client = await pool.connect();
  let cuenta;
  let token;
  try {
    await client.query('BEGIN');
    const rolResultado = await client.query(
      `SELECT id FROM roles
       WHERE lower(nombre) = lower('Técnico') AND estado = 'Activo'
       LIMIT 1`,
    );
    if (!rolResultado.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(503).json({ mensaje: 'El rol Técnico no está configurado.' });
    }

    const hash = await bcrypt.hash(datos.password, 12);
    const tecnicoResultado = await client.query(
      `INSERT INTO terceros
         (nombre_completo, tipo_documento, documento, telefono, correo_electronico,
          direccion, municipio, departamento, estado)
       VALUES ($1, $2, $3, $4, lower($5), $6, $7, $8, 'Activo')
       RETURNING id, nombre_completo`,
      [
        datos.nombre.trim(),
        textoValido(datos.tipoDocumento) ? datos.tipoDocumento.trim() : 'Cédula',
        datos.documento.trim(),
        textoValido(datos.telefono) ? datos.telefono.trim() : null,
        datos.correo.trim(),
        textoValido(datos.direccion) ? datos.direccion.trim() : '',
        textoValido(datos.municipio) ? datos.municipio.trim() : '',
        textoValido(datos.departamento) ? datos.departamento.trim() : '',
      ],
    );
    const usuarioResultado = await client.query(
      `INSERT INTO usuarios
         (nombre_completo, usuario, correo_electronico, password_hash,
          estado, verificado, rol_id, tercero_id)
       VALUES ($1, $2, lower($3), $4, 'Activo', FALSE, $5, $6)
       RETURNING id, nombre_completo, correo_electronico`,
      [
        datos.nombre.trim(),
        datos.usuario.trim(),
        datos.correo.trim(),
        hash,
        rolResultado.rows[0].id,
        tecnicoResultado.rows[0].id,
      ],
    );
    cuenta = usuarioResultado.rows[0];
    token = await crearToken(client, cuenta.id, 'verificacion', VIGENCIA_VERIFICACION_MS);
    await client.query('COMMIT');

    const envio = await enviarEnlaceCuenta(cuenta, 'verificacion', token, req);
    return res.status(202).json({
      mensaje: 'Cuenta creada. Revisa tu correo para verificarla antes de iniciar sesión.',
      ...(envio.enviado ? {} : { enlaceDesarrollo: envio.enlace, correoConfigurado: false }),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.post('/verificar', async (req, res, next) => {
  const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
  if (!token) return res.status(400).json({ mensaje: 'El enlace de verificación no es válido.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT tv.id, tv.usuario_id, u.estado
       FROM tokens_verificacion tv
       JOIN usuarios u ON u.id = tv.usuario_id
       WHERE tv.token_hash = $1
         AND tv.proposito = 'verificacion'
         AND tv.usado_en IS NULL
         AND tv.expira_en > now()
       FOR UPDATE OF tv, u`,
      [hashToken(token)],
    );
    const verificacion = rows[0];
    if (!verificacion || verificacion.estado !== 'Activo') {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'El enlace venció, ya fue usado o la cuenta no está activa.' });
    }

    await client.query(
      'UPDATE usuarios SET verificado = TRUE, actualizado_en = now() WHERE id = $1',
      [verificacion.usuario_id],
    );
    await client.query(
      `UPDATE tokens_verificacion SET usado_en = now()
       WHERE usuario_id = $1 AND proposito = 'verificacion' AND usado_en IS NULL`,
      [verificacion.usuario_id],
    );
    await client.query('COMMIT');
    return res.json({ mensaje: 'Correo verificado. Ya puedes iniciar sesión desde la aplicación móvil.' });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
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
      `SELECT id, nombre_completo, correo_electronico, estado, verificado
       FROM usuarios
       WHERE lower(usuario) = lower($1)
          OR lower(coalesce(correo_electronico, '')) = lower($1)
       LIMIT 1`,
      [identificador],
    );
    const cuenta = rows[0];

    // La verificación del correo no bloquea la recuperación: el enlace va justamente
    // al correo registrado y sirve para confirmar que la persona lo controla.
    let envio = null;
    if (cuenta && cuenta.estado === 'Activo' && cuenta.correo_electronico) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const token = await crearToken(client, cuenta.id, 'recuperacion', VIGENCIA_RECUPERACION_MS);
        await client.query('COMMIT');
        envio = await enviarEnlaceCuenta(cuenta, 'recuperacion', token, req);
      } catch (error) {
        await client.query('ROLLBACK');
        // Un fallo del proveedor de correo debe verse: si no, la persona cree que
        // el enlace salió y se queda esperando un mensaje que nunca llegará.
        if (!error.status) {
          error.status = 502;
          error.message = 'No pudimos enviar el correo de recuperación. Revisa la configuración de correo del servidor.';
        }
        return next(error);
      } finally {
        client.release();
      }
    }

    return res.json({
      mensaje: MENSAJE_RECUPERACION,
      // Solo en desarrollo y sin proveedor de correo: permite continuar el flujo.
      ...(envio && !envio.enviado ? { enlaceDesarrollo: envio.enlace, correoConfigurado: false } : {}),
    });
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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT tv.id AS token_id, u.id, u.estado
       FROM tokens_verificacion tv
       JOIN usuarios u ON u.id = tv.usuario_id
       WHERE tv.token_hash = $1
         AND tv.proposito = 'recuperacion'
         AND tv.usado_en IS NULL
         AND tv.expira_en > now()
       FOR UPDATE OF tv, u`,
      [hashToken(token.trim())],
    );
    const cuenta = rows[0];
    if (!cuenta || cuenta.estado !== 'Activo') {
      await client.query('ROLLBACK');
      return res.status(400).json(invalido);
    }

    const hash = await bcrypt.hash(password, 12);
    await client.query(
      'UPDATE usuarios SET password_hash = $1, actualizado_en = now() WHERE id = $2',
      [hash, cuenta.id],
    );
    await client.query(
      `UPDATE tokens_verificacion SET usado_en = now()
       WHERE usuario_id = $1 AND proposito = 'recuperacion' AND usado_en IS NULL`,
      [cuenta.id],
    );
    await client.query('COMMIT');

    return res.json({
      mensaje: 'Contraseña actualizada. Ya puedes iniciar sesión con la nueva contraseña.',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

export default router;
