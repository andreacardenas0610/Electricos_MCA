import { readFileSync } from 'node:fs';
import { pool } from '../src/db.js';

const archivo = new URL(`../database/${process.argv[2]}`, import.meta.url);
const sql = readFileSync(archivo, 'utf8');
await pool.query(sql);

const { rows } = await pool.query(
  `SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'agenda_actividades'
     AND column_name IN ('orden_servicio_id', 'origen')`,
);
console.table(rows);

const { rows: idx } = await pool.query(
  `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'agenda_actividades'`,
);
console.log(idx.map((r) => r.indexname).join(' | '));

await pool.end();
