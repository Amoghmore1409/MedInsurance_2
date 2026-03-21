import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import voiceRouter from './routes/voice.js';
import gatherRouter from './routes/gather.js';
import callRouter from './routes/call.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../dist')));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MedInsure AI Backend',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/voice', voiceRouter);
app.use('/voice/gather', gatherRouter);
app.use('/call', callRouter);

// 404 handler - serve index.html for SPA routing
app.use((req, res) => {
  // If it's an API route, return 404
  if (req.path.startsWith('/api') || req.path.startsWith('/voice') || req.path.startsWith('/call')) {
    res.status(404).json({
      error: 'Route not found',
      path: req.path
    });
  } else {
    // Otherwise serve index.html for client-side routing
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MedInsure AI Backend running on port ${PORT}`);
  console.log(`📞 Twilio webhook endpoint: http://localhost:${PORT}/voice`);
  console.log(`🔧 Health check: http://localhost:${PORT}/health`);

  // Check for required environment variables
  const requiredEnvVars = ['GROQ_API_KEY'];
  const optionalEnvVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];

  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`⚠️  Warning: Missing required environment variables: ${missing.join(', ')}`);
  }

  const missingOptional = optionalEnvVars.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn(`ℹ️  Info: Twilio features disabled. Missing: ${missingOptional.join(', ')}`);
  }
});

export default app;
