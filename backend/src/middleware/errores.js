export function manejarErrores(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ mensaje: 'El archivo no puede superar los 5 MB.' });
  }

  if (error.status === 400) {
    return res.status(400).json({ mensaje: error.message });
  }

  if (error.code === '23505') {
    return res.status(409).json({ mensaje: 'Ya existe un registro con esos datos.' });
  }

  if (error.code === '23503') {
    return res.status(409).json({ mensaje: 'El registro está relacionado con otros datos y no se puede modificar o eliminar.' });
  }

  if (error.code === '23514' || error.code === '22P02') {
    return res.status(400).json({ mensaje: 'Uno o más datos no tienen un valor permitido.' });
  }

  console.error(error);
  return res.status(500).json({ mensaje: 'Ocurrió un error en el servidor.' });
}
