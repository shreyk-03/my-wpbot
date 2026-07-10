const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Routes Import
const uploadRoutes = require('./routes/uploadRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');

// Initialize Express App
const app = express();

// Configure CORS
// Configure CORS supporting multiple allowed origins dynamically
const allowedOrigins = [
  'http://localhost:5173',
  'https://my-wpbot.vercel.app'
];

if (process.env.FRONTEND_URL) {
  const envOrigins = process.env.FRONTEND_URL.split(',').map(o => o.trim());
  envOrigins.forEach(o => {
    if (o && !allowedOrigins.includes(o)) {
      allowedOrigins.push(o);
    }
  });
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like Postman, REST clients, or Node environments)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Standard Parse Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Wire Route Endpoints
app.use('/api/upload', uploadRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Temporary Health/Connection check endpoint
app.get('/api/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    success: true,
    message: 'Express server is healthy and running',
    dbConnected: dbConnected,
    timestamp: new Date()
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('WhatsApp Collections Agent API is active.');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error stack:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
