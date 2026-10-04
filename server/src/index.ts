import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import apiRouter from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';
import { seedDatabaseIfEmpty } from './seed/seedRunner.js';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

const app = express();
const PORT = process.env.PORT || 5001;

// Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5001', '*'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// API Routes
app.use('/api', apiRouter);

// Serve static client assets from client/dist
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    const indexHtml = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexHtml)) {
      return res.sendFile(indexHtml);
    }
    next();
  });
}

// Error Handling Middleware
app.use(errorHandler);

// Database connection & Server initialization
async function startServer() {
  try {
    await connectDB();
    try {
      await seedDatabaseIfEmpty();
    } catch (seedErr) {
      console.warn('[Seed] Warning during database seed check:', seedErr);
    }

    app.listen(PORT, () => {
      console.log(`================================================================`);
      console.log(` MediSaarthi Clinical Server running on port ${PORT}`);
      console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Web URL (Full-Stack): http://localhost:${PORT}`);
      console.log(` Vite Dev URL: http://localhost:5173`);
      console.log(` AI Provider: ${process.env.AI_API_KEY ? 'Live LLM (' + process.env.AI_MODEL + ')' : 'High-Fidelity Demo Mode'}`);
      console.log(`================================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
