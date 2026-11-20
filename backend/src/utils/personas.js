import { idValido, textoValido } from './validacion.js';

export async function resolverPersona(client, datos) {
  const documento = textoValido(datos.documento)
    ? datos.documento.trim()
    : null;
  if (!documento) {
    throw Object.assign(new Error('El documento de la persona es obligatorio.'), { status: 400 });
  }

  const tipoDocumento = textoValido(datos.tipoDocumento)
    ? datos.tipoDocumento.trim()
    : (textoValido(datos.tipo_documento) ? datos.tipo_documento.trim() : 'Cédula');
  const nombre = textoValido(datos.nombre)
    ? datos.nombre.trim()
    : (textoValido(datos.nombre_completo) ? datos.nombre_completo.trim() : null);
  const correo = textoValido(datos.correo)
    ? datos.correo.trim().toLowerCase()
    : (textoValido(datos.correo_electronico) ? datos.correo_electronico.trim().toLowerCase() : null);
  const telefono = textoValido(datos.telefono) ? datos.telefono.trim() : null;

  const personaId = idValido(datos.personaId);
  const encontrada = personaId
    ? await client.query('SELECT id FROM personas WHERE id = $1', [personaId])
    : await client.query(
      `SELECT id FROM personas
       WHERE upper(btrim(documento)) = upper(btrim($1))
       LIMIT 1`,
      [documento],
    );

  if (encontrada.rows[0]) {
    const { rows } = await client.query(
      `UPDATE personas
       SET tipo_documento = COALESCE($1, tipo_documento),
           documento = $2,
           nombre_completo = COALESCE($3, nombre_completo),
           telefono = COALESCE($4, telefono),
           correo_electronico = COALESCE($5, correo_electronico),
           actualizado_en = now()
       WHERE id = $6
       RETURNING id`,
      [tipoDocumento, documento, nombre, telefono, correo, encontrada.rows[0].id],
    );
    return rows[0].id;
  }

  const creada = await client.query(
    `INSERT INTO personas
       (tipo_documento, documento, nombre_completo, telefono, correo_electronico)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [tipoDocumento, documento, nombre, telefono, correo],
  );
  return creada.rows[0].id;
}
