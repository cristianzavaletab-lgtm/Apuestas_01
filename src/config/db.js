// src/config/db.js
// Conexión MongoDB con retry automático y fallback a modo memoria

const mongoose = require('mongoose');
const logger = require('../utils/logger');

// ─── In-Memory Store (fallback cuando no hay MongoDB) ───────────────────────
class MemoryStore {
  constructor() {
    this.matches     = new Map();
    this.predictions = new Map();
    this.users       = new Map();
    this.payments    = new Map();
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
      
      // Auto-Seed Admin
      await ensureAdminUser();
      
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

// Auto-creación de administrador maestro
async function ensureAdminUser() {
  try {
    const User = require('../modules/auth/user.model');
    const adminExists = await User.findOne({ username: 'cristian' });
    
    if (!adminExists) {
      logger.info('🔧 Configurando Administrador Maestro en Atlas...');
      await User.create({
        username: 'cristian',
        password: '$2b$10$xms8Lwne6HzC/GtUoVmQJeBz4BSw8SG7cGC4.VUYFHnCKAfprL2my', // 60253405Cz
        nombre: 'cristian',
        apellido: 'Zavaleta',
        dni: '60253405',
        role: 'admin',
        tokens: 50
      });
      logger.info('✅ Administrador [cristian] creado con éxito.');
    }
  } catch (err) {
    logger.error('Error asegurando Admin User:', err.message);
  }
}

const fs = require('fs');
const path = require('path');
const MEM_DB_PATH = path.join(__dirname, 'mem_db.json');

function isMemoryMode() { return usingMemory; }
function isConnected()  { return connected; }
function getMemStore()  { 
  // Defensive check for stale memory objects (Elite Robustness)
  if (!memStore.users) memStore.users = new Map();
  if (!memStore.payments) memStore.payments = new Map();
  if (!memStore.matches) memStore.matches = new Map();
  if (!memStore.predictions) memStore.predictions = new Map();
  if (!memStore.combos) memStore.combos = [];
  return memStore; 
}

function saveMemDb() {
    if (!usingMemory) return;
    try {
        const data = {
            users: Array.from(memStore.users.entries()),
            payments: Array.from(memStore.payments.entries()),
            matches: Array.from(memStore.matches.entries()),
            predictions: Array.from(memStore.predictions.entries()),
            combos: memStore.combos,
            usage: memStore.usage
        };
        fs.writeFileSync(MEM_DB_PATH, JSON.stringify(data, null, 2));
        // logger.debug('💾 MemDB persistida');
    } catch (e) {
        logger.error('Error guardando MemDB:', e.message);
    }
}

function loadMemDb() {
    if (!fs.existsSync(MEM_DB_PATH)) return;
    try {
        const data = JSON.parse(fs.readFileSync(MEM_DB_PATH, 'utf8'));
        if (data.users) memStore.users = new Map(data.users);
        if (data.payments) memStore.payments = new Map(data.payments);
        if (data.matches) memStore.matches = new Map(data.matches);
        if (data.predictions) memStore.predictions = new Map(data.predictions);
        if (data.combos) memStore.combos = data.combos;
        if (data.usage) memStore.usage = data.usage;
        logger.info('📂 MemDB restaurada desde disco');
    } catch (e) {
        logger.error('Error cargando MemDB:', e.message);
    }
}

// Cargar al iniciar
loadMemDb();

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = { connectDB, isMemoryMode, isConnected, getMemStore, saveMemDb };
