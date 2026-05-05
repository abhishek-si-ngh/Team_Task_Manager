require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cluster = require('cluster');
const os = require('os');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');

const numCPUs = os.cpus().length;

// Disable clustering in production/Railway to save memory
if ((cluster.isPrimary || cluster.isMaster) && process.env.NODE_ENV !== 'production') {
  console.log(`Primary process ${process.pid} is running`);

  // Fork workers for each CPU
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // If a worker dies, restart it
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  // If in production, just run the app normally without clustering to save RAM
  if (cluster.isPrimary || cluster.isMaster) {
     console.log('Running in production mode: Skipping clustering to save memory.');
  }
  // Connect to MongoDB
  connectDB();

  const app = express();

  // ─── Middleware ─────────────────────────────────────────────────────────────
  
  // Security headers
  app.use(helmet());

  // Compress responses
  app.use(compression());

  // Rate limiting to prevent brute force/DDoS
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window`
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
  });
  
  app.use('/api/', apiLimiter);

  app.use(
    cors({
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ─── Routes ─────────────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);

  // ─── Health Check ────────────────────────────────────────────────────────────
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Team Task Manager API is running 🚀',
      timestamp: new Date().toISOString(),
    });
  });

  // ─── 404 Handler ────────────────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
  });

  // ─── Global Error Handler ────────────────────────────────────────────────────
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error.',
    });
  });

  // ─── Start Server ────────────────────────────────────────────────────────────
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Worker ${process.pid} running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}
