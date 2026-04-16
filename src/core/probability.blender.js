// src/core/probability.blender.js
const constants = require('../config/constants');

/**
 * Mezcla la probabilidad del modelo heurístico/IA con la del mercado (odds)
 * @param {Object} model { home: 0.XX, away: 0.XX }
 * @param {Object} market { home: 0.XX, away: 0.XX }
 * @returns {Object} { home: 0.XX, away: 0.XX }
 */
function blend(model, market) {
  const wModel = constants.BLENDER_WEIGHTS.model;
  const wMarket = constants.BLENDER_WEIGHTS.market;

  const blendedHome = (model.home * wModel) + (market.home * wMarket);
  const blendedAway = (model.away * wModel) + (market.away * wMarket);

  // Normalización
  const total = blendedHome + blendedAway;
  
  return {
    home: blendedHome / total,
    away: blendedAway / total
  };
}

module.exports = { blend };
