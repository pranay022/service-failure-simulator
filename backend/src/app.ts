import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import serviceRoutes from './routes/serviceRoutes';
import dependencyRoutes from './routes/dependencyRoutes';
import simulationRoutes from './routes/simulationRoutes';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// API Routes
app.use('/api/services', serviceRoutes);
app.use('/api/dependencies', dependencyRoutes);
app.use('/api/simulations', simulationRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handling middleware
app.use(errorHandler);

export default app;
