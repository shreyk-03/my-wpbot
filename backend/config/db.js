const mongoose = require('mongoose');

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/whatsapp-collections';

// Fail fast instead of buffering queries for 10s while the database is down.
mongoose.set('bufferCommands', false);

const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  bufferCommands: false,
  bufferTimeoutMS: 5000
};

const RETRY_COOLDOWN_MS = 10000;
const DB_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

let lastError = null;
let lastAttemptAt = 0;
let connectPromise = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Removes credentials from a MongoDB connection string before it is logged
 * or returned to clients.
 */
const maskUri = (value) => {
  if (!value) return '';
  return String(value).replace(/(mongodb(?:\+srv)?:\/\/)([^@/]+)@/, '$1***:***@');
};

const sanitizeError = (message) => maskUri(message || '');

const performConnect = async () => {
  const connStr = process.env.MONGODB_URI || DEFAULT_URI;
  await mongoose.connect(connStr, CONNECT_OPTIONS);
  lastError = null;
};

/**
 * Connects to MongoDB with exponential backoff.
 * Never throws: returns true when connected, false when every attempt failed.
 */
const connectDB = async ({ attempts = 5, initialDelayMs = 2000, maxDelayMs = 60000 } = {}) => {
  if (mongoose.connection.readyState === 1) return true;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    let delay = initialDelayMs;

    console.log(
      process.env.MONGODB_URI
        ? '🔌 MongoDB target: MONGODB_URI from environment'
        : '🔌 MongoDB target: localhost fallback (MONGODB_URI is not set)'
    );

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      lastAttemptAt = Date.now();

      try {
        await performConnect();
        return true;
      } catch (error) {
        lastError = sanitizeError(error.message);
        console.error(`❌ MongoDB connection attempt ${attempt}/${attempts} failed: ${lastError}`);

        if (attempt < attempts) {
          console.log(`⏳ Retrying MongoDB connection in ${Math.round(delay / 1000)}s...`);
          await sleep(delay);
          delay = Math.min(delay * 2, maxDelayMs);
        }
      }
    }

    console.error('❌ MongoDB is unreachable. The API will keep serving and retry on demand.');
    console.error('   Verify Render → Environment → MONGODB_URI and Atlas → Network Access.');
    return false;
  })();

  try {
    return await connectPromise;
  } finally {
    connectPromise = null;
  }
};

/**
 * Used by request middleware. Returns true only when a query can run.
 * When the database is down this returns quickly (never blocks an API call
 * for the full 10s server-selection timeout) and schedules a background retry.
 */
const ensureDbConnected = async () => {
  const { readyState } = mongoose.connection;

  if (readyState === 1) return true;

  if (readyState === 2) {
    // An initial connection attempt is already in flight. Give it a short
    // grace period so cold starts do not return a false 503.
    await Promise.race([
      mongoose.connection.asPromise().catch(() => {}),
      sleep(1500)
    ]);
    return mongoose.connection.readyState === 1;
  }

  // Avoid hammering Atlas with one connection attempt per request.
  if (Date.now() - lastAttemptAt < RETRY_COOLDOWN_MS) return false;

  // Trigger a single attempt in the background; do not block the request.
  connectDB({ attempts: 1, initialDelayMs: 0 }).catch(() => {});
  return false;
};

const getDbState = () => ({
  connected: mongoose.connection.readyState === 1,
  state: DB_STATES[mongoose.connection.readyState] || 'unknown',
  host: mongoose.connection.host || null,
  name: mongoose.connection.name || null,
  lastError: lastError || null,
  usingEnvUri: Boolean(process.env.MONGODB_URI)
});

mongoose.connection.on('connected', () => {
  lastError = null;
  console.log(`✅ MongoDB connection established: ${mongoose.connection.host}/${mongoose.connection.name}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. DB routes will return 503 until the connection is restored.');
});

mongoose.connection.on('error', (error) => {
  lastError = sanitizeError(error.message);
  console.error(`❌ MongoDB connection error: ${lastError}`);
});

module.exports = {
  connectDB,
  ensureDbConnected,
  getDbState,
  maskUri,
  CONNECT_OPTIONS
};
