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
