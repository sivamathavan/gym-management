require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/db');
const { connectRedis } = require('./config/redis');
const { startCronJobs } = require('./services/cronService');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Security ──────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
}));

// ── Body parsing ──────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/members',    require('./routes/members'));
app.use('/api/trainers',   require('./routes/trainers'));
app.use('/api/classes',    require('./routes/classes'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/billing',    require('./routes/billing'));
app.use('/api/branches',   require('./routes/branches'));
app.use('/api/dashboard',  require('./routes/dashboard'));
app.use('/api/ai',         require('./routes/ai'));
app.use('/webhooks',       require('./routes/webhooks'));

// ── Health check ──────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Error handler ─────────────────────────────
app.use(errorHandler);

// ── Boot ──────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  await connectRedis();
  startCronJobs();
  app.listen(PORT, () => {
    console.log(`FitCore API running on port ${PORT}`);
  });
}

start().catch(console.error);
