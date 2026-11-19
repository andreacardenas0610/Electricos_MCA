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
    rejectUnauthorized: true
  },
  max: 12,
  connectionTimeoutMillis: 20000,
  idleTimeoutMillis: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  statement_timeout: 15000,
  query_timeout: 15000
});

// Una conexión que se cae en reposo debe desconectarse, no tumbar el servidor.
pool.on('error', (error) => {
  console.error('[db] Error inesperado en una conexión en reposo:', error.message);
});

// Mensaje claro cuando PostgreSQL corta una consulta por tardar demasiado.
pool.on('notice', (notice) => {
  console.warn('[db] Aviso de PostgreSQL:', notice.message);
});