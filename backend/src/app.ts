import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.routes.js';
import cashRoutes from './routes/cash.routes.js';
import clientRoutes from './routes/client.routes.js';
import loanRoutes from './routes/loan.routes.js';

const app = express();

const configuredOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultOrigins = ['http://localhost:3000'];

const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins]);

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void
  ) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.has(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.use(express.json());

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

app.use('/auth', authRoutes);
app.use('/client', clientRoutes);
app.use('/loan', loanRoutes);
app.use('/cash', cashRoutes);

export default app;