import jwt from 'jsonwebtoken';

export function verificarToken(req, res, next) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ mensaje: 'Debes iniciar sesión.' });
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET, {
      audience: ['web', 'movil'],
    });
    return next();
  } catch {
    return res.status(401).json({ mensaje: 'El token no es válido o expiró.' });
  }
}

export function soloAdministradores(req, res, next) {
  if (req.usuario?.tipoCuenta !== 'usuario' || req.usuario?.rol !== 'Administrador') {
    return res.status(403).json({ mensaje: 'No tienes permiso para esta acción.' });
  }
  return next();
}
