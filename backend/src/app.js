import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { soloAdministradores, verificarToken } from './middleware/auth.js';
import { manejarErrores } from './middleware/errores.js';
import authRoutes from './routes/auth.js';
import clientesRoutes from './routes/clientes.js';
import tercerosRoutes from './routes/terceros.js';
import ordenesRoutes from './routes/ordenes.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET debe tener al menos 32 caracteres.');
}

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ estado: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/clientes', verificarToken, soloAdministradores, clientesRoutes);
app.use('/api/terceros', verificarToken, soloAdministradores, tercerosRoutes);
app.use('/api/ordenes-servicio', verificarToken, ordenesRoutes);
app.use((req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada.' }));
app.use(manejarErrores);

export default app;
