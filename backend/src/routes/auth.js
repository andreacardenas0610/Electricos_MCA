import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { textoValido } from '../utils/validacion.js';

const router = Router();

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

export default router;
