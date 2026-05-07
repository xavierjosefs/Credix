import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.routes.js';
import cashRoutes from './routes/cash.routes.js';
import clientRoutes from './routes/client.routes.js';
import loanRoutes from './routes/loan.routes.js';

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// ✅ body parser
app.use(express.json());

// ✅ health checks
app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'Credix API running',
    status: 'ok',
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    message: 'Credix API healthy',
    status: 'ok',
  });
});

// ✅ rutas
app.use('/auth', authRoutes);
app.use('/client', clientRoutes);
app.use('/loan', loanRoutes);
app.use('/cash', cashRoutes);

export default app;