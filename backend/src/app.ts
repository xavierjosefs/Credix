import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.routes.js';
import cashRoutes from './routes/cash.routes.js';
import clientRoutes from './routes/client.routes.js';
import loanRoutes from './routes/loan.routes.js';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/client', clientRoutes);
app.use('/loan', loanRoutes);
app.use('/cash', cashRoutes);

export default app;
