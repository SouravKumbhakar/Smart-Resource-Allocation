import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import needsRoutes from './routes/needsRoutes.js';
import volunteersRoutes from './routes/volunteersRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import assignmentsRoutes from './routes/assignmentsRoutes.js';
import usersRoutes from './routes/usersRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationsRoutes from './routes/notificationsRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());

// Base Health Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Smart Resource Allocation API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/needs', needsRoutes);
app.use('/api/volunteers', volunteersRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
