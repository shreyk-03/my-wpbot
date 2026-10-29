// Load Environment Variables at entry point
require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start the HTTP listener first so Render can bind the port quickly, then
// connect to MongoDB in the background (with retries). Requests that need the
// database receive a fast 503 until the connection is ready.
const startServer = () => {
  console.log('🚀 Initializing WhatsApp Collections Agent Backend...');

  const server = app.listen(PORT, () => {
    console.log(`🌐 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  connectDB().catch((error) => {
    console.error(`❌ Unexpected database initialization failure: ${error.message}`);
  });

  const shutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);

    server.close(async () => {
      try {
        await mongoose.connection.close();
      } catch (error) {
        console.error(`⚠️ Error while closing MongoDB connection: ${error.message}`);
      }
      process.exit(0);
    });

    // Do not hang forever if open connections keep the server alive.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();
