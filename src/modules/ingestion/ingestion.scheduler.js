// src/modules/ingestion/ingestion.scheduler.js
const constants = require('../../config/constants');
const logger = require('../../utils/logger');
const { processIngestionCycle } = require('./ingestion.service');
const { processPredictions } = require('../predictions/prediction.service');
const { generateCombos } = require('../combos/combo.service');

let ioRef;

async function runCycle() {
  try {
    // 1. Ingestar y normalizar partidos
    const normalizedMatches = await processIngestionCycle();

    if (normalizedMatches.length > 0 && ioRef) {
      // 2. Transmitir actualización de partidos en vivo a clientes
      // Esto solo informa goles o cambios de estado, NO gasta créditos de IA
      ioRef.emit('matchesUpdate', normalizedMatches);
    }
  } catch (error) {
    logger.error('Error during ingestion cycle: ' + error.message);
  }
}

function start(io) {
  ioRef = io;
  logger.info(`Starting Scheduler: Next cycle in ${constants.INGESTION_INTERVAL_MS / 1000}s`);
  
  // Ejecuta la primera vez inmediatamente
  runCycle();
  
  // Schedulamos los siguientes ciclos
  setInterval(runCycle, constants.INGESTION_INTERVAL_MS);
}

module.exports = { start };
