import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { soloAdministradores, verificarToken } from './middleware/auth.js';
import { manejarErrores } from './middleware/errores.js';
import authRoutes from './routes/auth.js';
import clientesRoutes from './routes/clientes.js';
import tercerosRoutes from './routes/terceros.js';
import ordenesRoutes from './routes/ordenes.js';
import materialesRoutes from './routes/materiales.js';
import serviciosRoutes from './routes/servicios.js';
import cotizacionesRoutes from './routes/cotizaciones.js';
import pagosRoutes from './routes/pagos.js';
import agendaRoutes from './routes/agenda.js';
import usuariosRoutes from './routes/usuarios.js';
import rolesRoutes from './routes/roles.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET debe tener al menos 32 caracteres.');
}

const app = express();

app.use(cors({
  origin(origin, callback) {
    const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ estado: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/clientes', verificarToken, soloAdministradores, clientesRoutes);
app.use('/api/terceros', verificarToken, soloAdministradores, tercerosRoutes);
app.use('/api/ordenes-servicio', verificarToken, ordenesRoutes);
app.use('/api/materiales', verificarToken, soloAdministradores, materialesRoutes);
app.use('/api/servicios', verificarToken, soloAdministradores, serviciosRoutes);
app.use('/api/cotizaciones', verificarToken, soloAdministradores, cotizacionesRoutes);
app.use('/api/pagos', verificarToken, soloAdministradores, pagosRoutes);
app.use('/api/agenda', verificarToken, soloAdministradores, agendaRoutes);
app.use('/api/usuarios', verificarToken, soloAdministradores, usuariosRoutes);
app.use('/api/roles', verificarToken, soloAdministradores, rolesRoutes);
app.use((req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada.' }));
app.use(manejarErrores);

export default app;
