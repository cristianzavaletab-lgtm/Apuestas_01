// src/modules/predictions/prediction.service.js
const logger = require('../../utils/logger');
const dbConfig = require('../../config/db');
const { calculateProbabilities } = require('./prediction.engine');
const Prediction = require('../../models/Prediction');

async function processPredictions(matches, io) {
  const newPredictions = [];

  for (const match of matches) {
    // Calculamos probabilidades usando IA (asíncrono)
    const result = await calculateProbabilities(match);
    const { probabilities, pick, confidence, odds, reasoning, key_factors } = result;

    const predictionData = {
      matchId: match.externalId,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      probabilities,
      pick,
      confidence,
      odds: { moneyline: odds },
      reasoning,
      key_factors
    };

    if (pick !== 'NO_BET') {
      newPredictions.push(predictionData);

      // Upsert
      if (dbConfig.isMemoryMode()) {
        dbConfig.getMemStore().predictions.set(match.externalId, predictionData);
      } else {
        await Prediction.updateOne(
          { matchId: match.externalId },
          { $set: predictionData },
          { upsert: true }
        );
      }

      // Emitimos por websocket
      io.emit('newPrediction', predictionData);
    }
  }

  logger.info(`Generated ${newPredictions.length} valid active predictions via AI`);
  return newPredictions;
}

async function getActivePredictions() {
  if (dbConfig.isMemoryMode()) {
    return Array.from(dbConfig.getMemStore().predictions.values());
  }
  return await Prediction.find({ status: 'pending' }).sort({ generatedAt: -1 }).limit(20);
}

module.exports = { processPredictions, getActivePredictions };
