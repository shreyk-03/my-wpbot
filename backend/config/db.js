const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/whatsapp-collections';
    
    // Connect to MongoDB
    const conn = await mongoose.connect(connStr);
    
    console.log(`📡 MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Do not crash the process immediately in development so health check works
    return false;
  }
};

module.exports = connectDB;
