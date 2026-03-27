import express from 'express';
import authRoutes from './routes/auth.routes.js';
import clientRoutes from './routes/client.routes.js';

const app = express();

app.use(express.json());
app.use('/auth', authRoutes);
app.use('/client', clientRoutes);

export default app;