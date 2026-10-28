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

  // La base de datos es remota: estos fallos de red/timeout deben explicarse, no quedar en 500 genérico.
  const erroresDeConexion = ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', '53300', '57P01'];
  if (erroresDeConexion.includes(error.code)) {
    return res.status(503).json({
      mensaje: 'La base de datos no respondió a tiempo. Espera unos segundos e inténtalo de nuevo.',
    });
  }

  if (error.code === '57014') {
    return res.status(504).json({
      mensaje: 'La consulta superó el tiempo permitido. Reduce los datos buscados e inténtalo de nuevo.',
    });
  }

  console.error(error);
  return res.status(500).json({ mensaje: 'Ocurrió un error en el servidor.' });
}
