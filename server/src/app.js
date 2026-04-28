// ── Load env FIRST so process.env.CLIENT_URL is available immediately ──
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import needsRoutes from './routes/needsRoutes.js';
import volunteersRoutes from './routes/volunteersRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import assignmentsRoutes from './routes/assignmentsRoutes.js';
import usersRoutes from './routes/usersRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationsRoutes from './routes/notificationsRoutes.js';

const app = express();

// ── CORS ────────────────────────────────────────────────────────────────────
// Allows: production Vercel URL, ALL Vercel preview deployments, localhost
const VERCEL_PATTERN = /^https:\/\/smart-resource-allocation[a-z0-9-]*\.vercel\.app$/;
const LOCAL_ORIGINS  = ['http://localhost:5173', 'http://localhost:8080'];

app.use(cors({
  origin: (origin, callback) => {
    // No origin = curl / Render health checks / server-to-server → allow
    if (!origin) return callback(null, true);
    // Explicit production URL from env var
    if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return callback(null, true);
    // Any Vercel preview deployment for this project
    if (VERCEL_PATTERN.test(origin)) return callback(null, true);
    // Local dev
    if (LOCAL_ORIGINS.includes(origin)) return callback(null, true);
    // Block everything else
    return callback(null, false);
  },
  credentials: true,
}));

app.use(express.json());

// ── Root route (Render uptime check hits GET /) ──────────────────────────────
app.get('/', (_req, res) => {
  res.status(200).json({ status: 'OK', service: 'ReliefOps API' });
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'Smart Resource Allocation API is running' });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/needs', needsRoutes);
app.use('/api/volunteers', volunteersRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
