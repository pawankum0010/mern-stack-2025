require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

let isConnected = false;

module.exports = async (req, res) => {
  try {
    if (!isConnected) {
      await connectDB();
      isConnected = true;
    }
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    });
  }
};
