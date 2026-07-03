// Load Environment Variables at entry point
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start Server Wrapper
const startServer = async () => {
  console.log('🚀 Initializing WhatsApp Collections Agent Backend...');
  
  // Establish Database Connection
  await connectDB();
  
  // Bind Listener
  app.listen(PORT, () => {
    console.log(`🌐 Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
  });
};

startServer();
