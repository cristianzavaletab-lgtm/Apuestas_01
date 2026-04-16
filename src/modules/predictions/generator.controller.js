const { fetchMatchesByDate } = require('../ingestion/ingestion.service');
const { calculateProbabilities } = require('./prediction.engine');
const { generateCombos } = require('../combos/combo.service');
const { getTargetedRecommendations } = require('../recommendations/recommendation.service');
const dbConfig = require('../../config/db');
const Usage = require('../../models/Usage');
const User = require('../auth/user.model');
const logger = require('../../utils/logger');

async function generatePicks(req, res) {
  try {
    const { date, leagues, timeRange = 'full_day', selectedMatchIds = [] } = req.body;
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 1. Check Usage / Quota
    const usage = await getOrCreateUsage(todayStr);
    if (usage.aiCallsCount >= usage.dailyLimit) {
        return res.status(429).json({ 
            error: 'Capacity limit reached for today', 
            usage 
        });
    }

    // 1.5 Token Economy Check
    let userDb;
    if (req.user.role !== 'admin') {
      if (dbConfig.isMemoryMode()) {
        const memStore = dbConfig.getMemStore();
        userDb = memStore.users.get(req.user._id || req.user.id);
        if (!userDb) return res.status(401).json({ error: 'Usuario no encontrado en memoria' });
        
        if (userDb.tokens < 5) {
           return res.status(402).json({ error: 'Insuficientes tokens (💎). Necesitas 5 por análisis.' });
        }
        userDb.tokens -= 5;
        memStore.users.set(userDb._id, userDb);
        dbConfig.saveMemDb(); // Persist token deduction
      } else {
        userDb = await User.findById(req.user._id || req.user.id);
        if (!userDb) return res.status(401).json({ error: 'Usuario no encontrado' });
        if (userDb.tokens < 5) {
           return res.status(402).json({ error: 'Insuficientes tokens. Cuesta 5 tokens por análisis.' });
        }
        userDb.tokens -= 5;
        await userDb.save();
      }
    } else {
      userDb = { role: 'admin', tokens: 999999 };
    }

    // 2. Fetch Signals
    const serverDate = new Date().toISOString().split('T')[0];
    let matches = await fetchMatchesByDate(serverDate, leagues, timeRange);
    
    let matchesToProcess = matches;
    if (selectedMatchIds && selectedMatchIds.length > 0) {
        matchesToProcess = matches.filter(m => selectedMatchIds.includes(m.externalId));
    } else {
        const limit = 5;
        matchesToProcess = matches.slice(0, limit);
    }

    const predictions = [];
    for (const match of matchesToProcess) {
       const result = await calculateProbabilities(match);
       await incrementUsage(todayStr);

       if (result.pick !== 'NO_BET') {
         predictions.push({
           matchId: match.externalId,
           homeTeam: match.homeTeam,
           awayTeam: match.awayTeam,
           probabilities: result.probabilities,
           pick: result.pick,
           confidence: result.confidence,
           marketProb: result.marketProb,
           valueEdge: result.valueEdge,
           odds: result.odds,
           quality: result.quality,
           expertScore: result.expertScore,
           signals: result.signals,
           tacticalInsight: result.tacticalInsight,
           offensiveInsight: result.offensiveInsight,
           offensivePotential: result.offensivePotential,
           reasoning: result.reasoning,
           key_factors: result.key_factors,
           projectedGoals: result.projectedGoals,
           projectedCorners: result.projectedCorners,
           goalsPick: result.goalsPick,
           cornersPick: result.cornersPick
         });
       }
    }

    let recommendations = getTargetedRecommendations(predictions);
    let combos = generateCombos(predictions);

    res.json({ 
        date, 
        matches, 
        picks: predictions, 
        recommendations, 
        combos, 
        user: {
            role: userDb.role,
            tokens: (userDb.role === 'admin') ? '∞' : userDb.tokens
        }
    });

  } catch(e) {
    logger.error(`Error generating picks: ${e.message}`);
    res.status(500).json({ error: 'Fallo en el motor de generación' });
  }
}

async function getUsageStats(req, res) {
    const todayStr = new Date().toISOString().split('T')[0];
    const usage = await getOrCreateUsage(todayStr);
    res.json(usage);
}

// Support Helpers
async function getOrCreateUsage(dateKey) {
    if (dbConfig.isMemoryMode()) {
        const store = dbConfig.getMemStore();
        // Defensive: Parse back to Date if it was loaded as String from JSON
        if (!(store.usage.lastResetAt instanceof Date)) {
            store.usage.lastResetAt = new Date(store.usage.lastResetAt);
        }

        if (store.usage.lastResetAt.toISOString().split('T')[0] !== dateKey) {
            store.usage.aiCallsCount = 0;
            store.usage.lastResetAt = new Date();
            dbConfig.saveMemDb();
        }
        return store.usage;
    }

    let usage = await Usage.findOne({ dateKey });
    if (!usage) {
        usage = await Usage.create({ dateKey, dailyLimit: 35 });
    }
    return usage;
}

async function incrementUsage(dateKey) {
    if (dbConfig.isMemoryMode()) {
        const store = dbConfig.getMemStore();
        store.usage.aiCallsCount++;
        // We don't save every increment to avoid excessive I/O, but it's safe
        return;
    }
    await Usage.updateOne({ dateKey }, { $inc: { aiCallsCount: 1 } });
}

module.exports = { generatePicks, getUsageStats };
