import express from 'express';
import cors from 'cors';
import 'dotenv/config.js';
import connectDB from './config/db.js';
import userRouter from './routes/userRoutes.js';
import incomeRouter from './routes/incomeRoute.js';
import expenseRouter from './routes/expenseRoute.js';
import dashboardRouter from './routes/dashboardRoutes.js';

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Non-browser clients may omit Origin; CORS only controls browser access.
    callback(null, !origin || allowedOrigins.includes(origin));
  },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/', (_req, res) => res.send('SpendWise API is running.'));

app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api/user', userRouter);
app.use('/api/income', incomeRouter);
app.use('/api/expense', expenseRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((error, _req, res, _next) => {
  console.error('SpendWise request failed:', error.message);
  res.status(503).json({ message: 'The service is temporarily unavailable.' });
});

export default app;

// Vercel wraps the exported Express app as a function. Local development still
// starts a normal HTTP server.
if (!process.env.VERCEL) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`SpendWise API listening on port ${port}`);
  });
}
