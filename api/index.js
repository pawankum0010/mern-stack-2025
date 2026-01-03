// Vercel Serverless Function wrapper for Express backend
const path = require('path');

// Load environment variables (for local testing)
// In production, Vercel automatically injects environment variables
try {
  require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
} catch (error) {
  // Ignore if .env file doesn't exist (production uses Vercel env vars)
}

const app = require('../backend/src/app');
const { connectDB } = require('../backend/src/config/db');

// Database connection state (Vercel serverless functions reuse connections between warm starts)
let isConnected = false;

async function ensureDBConnection() {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }
}

// Vercel serverless function handler
module.exports = async (req, res) => {
  try {
    // Ensure database connection before handling request
    await ensureDBConnection();
    
    // Handle the request with Express app
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

