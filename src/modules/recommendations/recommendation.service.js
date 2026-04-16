// src/modules/recommendations/recommendation.service.js
const logger = require('../../utils/logger');

/**
 * Recommendation Layer - V1.0 (PRO)
 * Analyzes predictions to find the High Conviction and Moonshot hero picks.
 */
function getTargetedRecommendations(predictions) {
    if (!predictions || predictions.length === 0) {
        return { highConviction: null, moonshot: null };
    }

    // 1. High Conviction Pick (Elite Signal)
    const highConviction = predictions
        .filter(p => 
            p.confidence >= 0.72 && 
            p.expertScore >= 8.5 && 
            p.odds >= 1.25 && 
            p.odds <= 2.20
        )
        .sort((a, b) => {
            if (b.expertScore !== a.expertScore) return b.expertScore - a.expertScore;
            return b.confidence - a.confidence;
        })[0] || null;

    // 2. Moonshot Opportunity (High Yield Speculative)
    const moonshot = predictions
        .filter(p => 
            (!highConviction || p.matchId !== highConviction.matchId) &&
            p.confidence >= 0.25 && 
            p.expertScore >= 7.0 && 
            p.odds >= 3.5
        )
        .sort((a, b) => {
            // Priority: Yield Edge (Edge * Odds)
            const edgeValA = (a.valueEdge || 0) * a.odds;
            const edgeValB = (b.valueEdge || 0) * b.odds;
            return edgeValB - edgeValA;
        })[0] || null;

    return { 
        highConviction, 
        moonshot, 
        summary: {
            matchesAnalyzed: predictions.length,
            qualifiedHigh: highConviction ? 1 : 0,
            qualifiedMoon: moonshot ? 1 : 0
        }
    };
}

module.exports = { getTargetedRecommendations };
