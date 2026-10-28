import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error('Falta configurar DATABASE_URL en el archivo .env');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // La base de datos es remota: sin estos límites el pool abre conexiones lentas y
  // las peticiones simultáneas de cada pantalla se quedan esperando.
  max: Number(process.env.DB_POOL_MAX || 12),
  connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS || 20000),
  idleTimeoutMillis: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT_MS || 15000),
  query_timeout: Number(process.env.DB_QUERY_TIMEOUT_MS || 15000)
});

// Una conexión que se cae en reposo debe desconectarse, no tumbar el servidor.
pool.on('error', (error) => {
  console.error('[db] Error inesperado en una conexión en reposo:', error.message);
});

// Mensaje claro cuando PostgreSQL corta una consulta por tardar demasiado.
pool.on('notice', (notice) => {
  console.warn('[db] Aviso de PostgreSQL:', notice.message);
});