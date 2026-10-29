const express = require('express');
const cors = require('cors');

const { ensureDbConnected, getDbState } = require('./config/db');
const requireDb = require('./middleware/requireDb');

// Routes Import
const uploadRoutes = require('./routes/uploadRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');

// Initialize Express App
const app = express();

// Trust Render's reverse proxy so req.protocol / client IPs are accurate.
app.set('trust proxy', 1);

// Allow local development plus the deployed frontend(s).
const normalizeOrigin = (value) => String(value || '').trim().replace(/\/+$/, '');

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://my-wpbot.vercel.app'
];

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean)
    .forEach((origin) => {
      if (!allowedOrigins.includes(origin)) allowedOrigins.push(origin);
    });
}

const isAllowedOrigin = (origin) => {
  // Allow requests with no origin (Postman, REST clients, server-to-server).
  if (!origin) return true;

  const normalized = normalizeOrigin(origin);
  if (allowedOrigins.includes(normalized)) return true;

  // Allow Vercel preview deployments for this project.
  try {
    const { protocol, hostname } = new URL(normalized);
    if (protocol === 'https:' && hostname.startsWith('my-wpbot') && hostname.endsWith('.vercel.app')) {
      return true;
    }
  } catch (error) {
    // Ignore malformed origins; they are rejected below.
  }

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Standard Parse Middlewares
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Wire Route Endpoints (all of these require a live MongoDB connection)
app.use('/api/upload', requireDb, uploadRoutes);
app.use('/api/invoices', requireDb, invoiceRoutes);
app.use('/api/reports', requireDb, reportRoutes);
app.use('/api/whatsapp', requireDb, whatsappRoutes);

// Health / connection diagnostics
app.get('/api/health', async (req, res) => {
  // Optional ?check=1 triggers a single background reconnect attempt.
  if (req.query.check === '1') {
    await ensureDbConnected();
  }

  const state = getDbState();

  return res.status(state.connected ? 200 : 503).json({
    success: true,
    message: state.connected
      ? 'Express server is healthy and connected to MongoDB'
      : 'Express server is running but MongoDB is unavailable',
    dbConnected: state.connected,
    dbState: state.state,
    dbHost: state.host,
    dbName: state.name,
    lastDbError: state.lastError,
    usingEnvUri: state.usingEnvUri,
    timestamp: new Date()
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('WhatsApp Collections Agent API is active.');
});

// Unknown route handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (message.startsWith('CORS blocked origin:')) {
    status = 403;
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors || {})
      .map((validationError) => validationError.message)
      .join(', ') || message;
  } else if (err.code === 11000) {
    status = 409;
    const fields = Object.keys(err.keyPattern || {}).join(', ') || 'field';
    message = `Duplicate value for unique ${fields}.`;
  } else if (
    err.name === 'MongooseServerSelectionError' ||
    /buffering timed out|before initial connection|Client must be connected/i.test(message)
  ) {
    status = 503;
    message = 'Database unavailable. Please try again once the backend reconnects to MongoDB.';
  }

  if (status >= 500) {
    console.error('Error stack:', err.stack);
  }

  res.status(status).json({
    success: false,
    message
  });
});

module.exports = app;
