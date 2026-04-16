// src/config/db.js
// Conexión MongoDB con retry automático y fallback a modo memoria

const mongoose = require('mongoose');
const logger = require('../utils/logger');

// ─── In-Memory Store (fallback cuando no hay MongoDB) ───────────────────────
class MemoryStore {
  constructor() {
    this.matches     = new Map();
    this.predictions = new Map();
    this.combos      = [];
    this.usage = {
        aiCallsCount: 0,
        dailyLimit: 35,
        lastResetAt: new Date()
    };
  }
}

const memStore = new MemoryStore();
let usingMemory = false;
let connected   = false;

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    logger.warn('⚠️  MONGO_URI no encontrado → usando almacenamiento en MEMORIA');
    usingMemory = true;
    return;
  }

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 5000
      });
      connected = true;
      logger.info('✅ MongoDB conectado');
      return;
    } catch (err) {
      attempts++;
      logger.warn(`MongoDB intento ${attempts}/${maxAttempts} fallido: ${err.message}`);
      if (attempts < maxAttempts) await sleep(2000 * attempts);
    }
  }

  logger.warn('⚠️  MongoDB no disponible → usando almacenamiento en MEMORIA');
  usingMemory = true;
}

function isMemoryMode() { return usingMemory; }
function isConnected()  { return connected; }
function getMemStore()  { return memStore; }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = { connectDB, isMemoryMode, isConnected, getMemStore };
