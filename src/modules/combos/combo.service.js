// src/modules/combos/combo.service.js
const logger = require('../../utils/logger');

/**
 * Professional Portfolio Generator - GOD LEVEL EDITION
 * Generates Safe, Pro, and High-Return investment plans.
 */
function generateCombos(predictions) {
  const validPicks = predictions.filter(p => p.expertScore >= 5.0)
                                .sort((a, b) => b.expertScore - a.expertScore);

  if (validPicks.length < 2) return { safePlan: null, proPlan: null, highReturnPlan: null };

  // 1. SAFE PLAN (Focus: Stability)
  const safePicks = validPicks.slice(0, 2);
  const safePlan = buildPlan("Safe Plan", safePicks, "Estrategia conservadora para preservación de capital.");

  // 2. PRO PLAN
  const proPicks = validPicks.slice(0, Math.min(3, validPicks.length));
  const proPlan = buildPlan("Pro Portfolio", proPicks, "Cartera equilibrada basada en señales técnicas.");

  // 3. HIGH RETURN STRATEGY (GOD MODE) - FORCE > 4.0 ODDS
  let highReturnPicks = [];
  let currentOdds = 1.0;
  for (const pick of validPicks) {
      highReturnPicks.push(pick);
      currentOdds *= (pick.odds || 1.1);
      if (currentOdds >= 4.0) break; // Reached > 4.0 Target
  }

  // If even with all valid picks we didn't reach 4.0, we just provide the max possible taking up to 6 matches.
  if (highReturnPicks.length > 6 && currentOdds < 4.0) {
      highReturnPicks = highReturnPicks.slice(0, 6);
  }

  let highReturnPlan = null;
  if (highReturnPicks.length >= 2) {
      highReturnPlan = buildPlan("Combinada Mayor a Cuota 4", highReturnPicks, "Combinada optimizada dinámicamente para asegurar multiplicador de ganancia > 4.0 con mayor probabilidad posible.");
  }

  return { safePlan, proPlan, highReturnPlan };
}

function buildPlan(title, picks, description) {
  let combinedProb = 1;
  let combinedOdds = 1;

  picks.forEach(p => {
    combinedProb *= (p.confidence || 0.5);
    combinedOdds *= (p.odds || 1.1);
  });

  return {
    title,
    picks,
    combinedProbability: combinedProb,
    combinedOdds: parseFloat(combinedOdds.toFixed(2)),
    risk: combinedProb > 0.5 ? "LOW" : (combinedProb > 0.3 ? "MEDIUM" : "HIGH"),
    description
  };
}

module.exports = { generateCombos };
