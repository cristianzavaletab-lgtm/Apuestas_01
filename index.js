// index.js - Professional Entry Point
require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// Centralized Utilities & Config
const logger = require('./src/utils/logger');
const dbConfig = require('./src/config/db');

// Middleware
const apiLimiter = require('./src/middleware/rateLimiter');
const errorHandler = require('./src/middleware/errorHandler');
const authMiddleware = require('./src/middleware/authMiddleware');
const { requireAdmin } = require('./src/middleware/roleMiddleware');

// Routes
const matchRoutes = require('./src/modules/matches/match.routes');
const predictionRoutes = require('./src/modules/predictions/prediction.routes');
const comboRoutes = require('./src/modules/combos/combo.routes');
const generateRoutes = require('./src/modules/predictions/generator.routes');
const authRoutes = require('./src/modules/auth/auth.routes');
const paymentRoutes = require('./src/modules/payments/payments.routes');
const adminRoutes = require('./src/modules/admin/admin.routes');

// Services
const ingestionScheduler = require('./src/modules/ingestion/ingestion.scheduler');
const liveSimulator = require('./src/modules/matches/live.simulator');

/**
 * Main Application Class
 */
class App {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, { 
      cors: { origin: '*' },
      pingTimeout: 60000 
    });
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSockets();
    this.setupGracefulShutdown();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(compression());
    this.app.use(express.json());
    
    // Security Fix: CSP to allow Tailwind, Google Fonts and Google Identity Services
    this.app.use((req, res, next) => {
      res.setHeader("Content-Security-Policy", "default-src 'self' https://accounts.google.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://cdn.tailwindcss.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://accounts.google.com ws: wss:; frame-src 'self' https://accounts.google.com;");
      next();
    });

    this.app.get('/admin', authMiddleware, requireAdmin, (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'admin.html'));
    });
    this.app.use(express.static('public'));
    this.app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    this.app.use('/img', express.static(path.join(__dirname, 'public', 'img')));
    this.app.set('io', this.io);

    // Ensure uploads directory exists
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
  }

  setupRoutes() {
    this.app.get('/health', (req, res) => res.status(200).send('OK'));
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/matches', matchRoutes);
    this.app.use('/api/predictions', predictionRoutes);
    this.app.use('/api/combos', comboRoutes);
    this.app.use('/api/generate-picks', generateRoutes);
    this.app.use('/api/payments', paymentRoutes);
    this.app.use('/api/admin', adminRoutes);
    
    // Global Error Handler
    this.app.use(errorHandler);
  }

  setupWebSockets() {
    this.io.on('connection', (socket) => {
      logger.info(`New client connected: ${socket.id}`);
      
      // Send initial snapshot (deferred require to avoid cycles)
      setTimeout(async () => {
        try {
          const { getActivePredictions } = require('./src/modules/predictions/prediction.service');
          const { getActiveCombos } = require('./src/modules/combos/combo.service');
          
          let liveMatches = [];
          if(dbConfig.isMemoryMode()) {
            liveMatches = Array.from(dbConfig.getMemStore().matches.values()).filter(m => m.status === 'live');
          }
          
          socket.emit('dashboardSnapshot', {
            matches: liveMatches,
            predictions: await getActivePredictions(),
            combos: await getActiveCombos()
          });
        } catch (err) {
          logger.error('Error sending socket snapshot:', err.message);
        }
      }, 500);

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  setupGracefulShutdown() {
    const shutdown = async () => {
      logger.info('Shutting down server gracefully...');
      this.server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }

  async start() {
    const PORT = process.env.PORT || 3000;

    try {
      logger.info('🚀 Iniciando Sistema de Predicción Deportiva...');
      
      // 1. Database Connection
      await dbConfig.connectDB();
      
      // 2. Start Background Services
      ingestionScheduler.start(this.io);
      liveSimulator.start(this.io);
      
      // 3. Listen on Port
      this.server.listen(PORT, () => {
        logger.info(`✅ Servidor PROFESIONAL escuchando en http://localhost:${PORT}`);
      }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          logger.error(`❌ El puerto ${PORT} ya está en uso por otro proceso.`);
          logger.error('Por favor, cierra otras instancias de Node o cambia el puerto en .env');
          process.exit(1);
        } else {
          logger.error(`❌ Error al iniciar servidor: ${err.message}`);
        }
      });

    } catch (err) {
      logger.error(`❌ Error crítico en el inicio: ${err.message}`);
      process.exit(1);
    }
  }
}

// Global execution
new App().start();