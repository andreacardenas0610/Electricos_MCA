import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();
// Respaldo: si alguna variable (por ejemplo el correo) quedó en el .env de la
// raíz del repositorio en lugar de backend/.env, también se tiene en cuenta.
// Las variables de backend/.env conservan prioridad porque dotenv no sobreescribe.
dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') });

import app from './app.js';
import { pool } from './db.js';

const port = Number(process.env.PORT) || 3000;

const server = app.listen(port, () => {
  console.log(`Backend MCA escuchando en http://localhost:${port}`);
});

async function cerrarServidor() {
  server.close();
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', cerrarServidor);
process.on('SIGTERM', cerrarServidor);