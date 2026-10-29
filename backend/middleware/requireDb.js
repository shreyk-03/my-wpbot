const { ensureDbConnected, getDbState } = require('../config/db');

/**
 * Guards database-backed routes. Returns a fast, descriptive 503 instead of
 * letting Mongoose buffer the query for 10 seconds and surface an opaque 500.
 */
const requireDb = async (req, res, next) => {
  const connected = await ensureDbConnected();
  if (connected) return next();

  const state = getDbState();
  const message = state.usingEnvUri
    ? 'Database unavailable. The API is running but cannot reach MongoDB. Verify MONGODB_URI on Render and the Atlas network access list.'
    : 'Database unavailable. MONGODB_URI is not set, so the backend is falling back to localhost:27017.';

  return res.status(503).json({
    success: false,
    message,
    dbConnected: false,
    dbState: state.state,
    lastDbError: state.lastError
  });
};

module.exports = requireDb;
