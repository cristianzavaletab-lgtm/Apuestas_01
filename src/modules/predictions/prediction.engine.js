// src/modules/predictions/prediction.engine.js
const constants = require('../../config/constants');
const { analyzeMatch } = require('./ai.service');
const { blend } = require('../../core/probability.blender');

/**
 * Motor de Predicción Híbrido - V2.0 (HIGH CONVICTION EDITION)
 * Implementa Value Edge y Score Compuesto Avanzado.
 */
async function calculateProbabilities(match) {
  // 1. Probabilidad desde el Mercado (Probabilidad Implícita)
  const marketProbs = calculateFromOdds(match.odds);
  
  if (!marketProbs) {
    return { pick: 'NO_BET', confidence: 0, reasoning: "Insufficient market depth" };
  }

  // 2. Investigación Táctica IA
  const aiResult = await analyzeMatch({
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    league: match.league,
    date: match.commenceTime
  });

  // 3. Mezcla de Probabilidades (Model Final Prediction)
  const blendedProbs = blend(aiResult.probabilities, marketProbs);

  // 4. Selección del Pick
  let pick = 'NO_BET';
  let modelProb = 0;
  let marketProb = 0;

  const drawProb = Math.max(0, 1 - blendedProbs.home - blendedProbs.away);
  const marketDraw = Math.max(0, 1 - marketProbs.home - marketProbs.away);

  // Determinar la opción principal (HOME, AWAY, DRAW)
  let bestPick = 'HOME';
  let bestProb = blendedProbs.home;
  if (blendedProbs.away > bestProb) { bestPick = 'AWAY'; bestProb = blendedProbs.away; }
  if (drawProb > bestProb) { bestPick = 'DRAW'; bestProb = drawProb; }

  pick = bestPick;
  modelProb = bestProb;

  if (pick === 'HOME') marketProb = marketProbs.home;
  else if (pick === 'AWAY') marketProb = marketProbs.away;
  else marketProb = marketDraw;

  // Filter out completely absurd low confidence picks
  if (modelProb < 0.35) return { pick: 'NO_BET', confidence: 0, reasoning: 'Signal is entirely random' };

  // 5. CÁLCULO DE VALUE EDGE (Modelo vs Mercado)
  const valueEdge = parseFloat((modelProb - marketProb).toFixed(4));

  // 6. CÁLCULO DEL EXPERT SCORE V2.0
  const expertScore = calculateExpertScoreV2({
    confidence: modelProb,
    marketProb,
    pick,
    aiResult,
    match,
    valueEdge
  });

  // 7. Señales Estructuradas
  const signals = {
    marketSignal: valueEdge >= 0.05 ? "Value Edge Detected" : "Market Equilibrium",
    modelSignal: expertScore >= 8.5 ? "High Conviction Pattern" : (expertScore >= 7.0 ? "Solid Technical Signal" : "Moderate Setup"),
    riskNotes: modelProb >= 0.75 ? "Standard Defensive Coverage" : "High Volatility Environment"
  };

  return {
    probabilities: { ...blendedProbs, draw: 1 - blendedProbs.home - blendedProbs.away },
    pick,
    confidence: modelProb,
    marketProb,
    valueEdge,
    odds: pick === 'HOME' ? match.odds.homeMoneyline : (pick === 'AWAY' ? match.odds.awayMoneyline : (match.odds.drawMoneyline || 3.0)),
    quality: getQualityLabel(expertScore),
    expertScore,
    signals,
    tacticalInsight: aiResult.tactical_insight,
    offensiveInsight: aiResult.offensive_insight,
    offensivePotential: aiResult.offensive_potential,
    reasoning: aiResult.reasoning,
    key_factors: aiResult.key_factors,
    projectedGoals: aiResult.projected_goals || 2.5,
    projectedCorners: aiResult.projected_corners || 8.5,
    goalsPick: (aiResult.projected_goals || 2.5) >= 2.5 ? 'OVER 2.5' : 'UNDER 2.5',
    cornersPick: (aiResult.projected_corners || 8.5) > 9.5 ? 'OVER 9.5' : ((aiResult.projected_corners || 8.5) < 8.5 ? 'UNDER 8.5' : 'BETWEEN 8-10')
  };
}

/**
 * Fórmula de Score Experto V2.0
 * (conf*3.2) + (marketAlign*2.0) + (statStrength*1.8) + (edge*1.3) + (dataQuality*1.2) - (volatility*1.5)
 */
function calculateExpertScoreV2({ confidence, marketProb, pick, aiResult, match, valueEdge }) {
  const marketAlignment = 1 - Math.abs(confidence - marketProb); // 0 to 1
  const statisticalStrength = aiResult.key_factors?.length > 0 ? 0.9 : 0.4;
  const dataQuality = aiResult.tactical_insight !== 'N/A' ? 0.9 : 0.2;
  const volatility = (Math.abs(1.8 - (match.odds?.homeMoneyline || 1.8)) > 1.5) ? 0.8 : 0.2;

  let score = (confidence * 3.2) + 
              (marketAlignment * 2.0) + 
              (statisticalStrength * 1.8) + 
              (valueEdge * 1.3 * 10) + // Scale edge for formula
              (dataQuality * 1.2) - 
              (volatility * 1.5);

  return Math.min(10, Math.max(0, score)).toFixed(1);
}

function getQualityLabel(score) {
  if (score >= 8.5) return "ELITE";
  if (score >= 7.5) return "STRONG";
  if (score >= 6.0) return "MODERATE";
  return "WEAK";
}

function calculateFromOdds(odds) {
  if (!odds || !odds.homeMoneyline || !odds.awayMoneyline) return null;
  const h = 1 / odds.homeMoneyline;
  const a = 1 / odds.awayMoneyline;
  const total = h + a;
  return { home: h / total, away: a / total };
}

module.exports = { calculateProbabilities };
