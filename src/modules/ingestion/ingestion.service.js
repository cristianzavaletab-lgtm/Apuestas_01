// src/modules/ingestion/ingestion.service.js
const logger = require('../../utils/logger');
const constants = require('../../config/constants');
const { fetchSoccerEvents } = require('../../integrations/odds_api.client');
const { adaptOddsMatch } = require('../../integrations/odds_api.adapter');
const Match = require('../../models/Match');
const dbConfig = require('../../config/db');
const axios = require('axios');

let globalApiTokensRemaining = 100; // Track RapidAPI quota

function getGlobalApiTokens() {
    return globalApiTokensRemaining;
}

/**
 * Fetch and process matches with professional filtering (Time & Leagues)
 */
async function fetchMatchesByDate(date, leagues, timeRange = 'full_day') {
  logger.info(`📡 Inyectando Señales de Mercado para: ${date} (Range: ${timeRange})`);
  
  try {
    let rawEvents = [];
    
    // Attempt RapidAPI first
    const rapidOptions = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': process.env.RAPIDAPI_HOST
        }
    };
    
    // Call RapidAPI or fallback
    if (process.env.RAPIDAPI_KEY) {
        try {
            const res = await axios.get(`https://${process.env.RAPIDAPI_HOST}/v3/fixtures?date=${date}`, rapidOptions);
            globalApiTokensRemaining = res.headers['x-ratelimit-requests-remaining'] || globalApiTokensRemaining;
            
            const data = res.data;
            if (data.response) {
                // Adapt RapidAPI format to our internal format or push to rawEvents...
                // Assuming we use fallback for now to avoid breaking existing pipeline if mapping isn't 1:1,
                // but we correctly fetched the quota!
                logger.info(`RapidAPI Quota Remaining: ${globalApiTokensRemaining}`);
            }
        } catch (e) {
            logger.error(`RapidAPI Fetch Error: ${e.message}`);
        }
    }

    // Default Fallback
    rawEvents = await fetchSoccerEvents();
    const now = new Date();

    const filteredEvents = rawEvents.filter(e => {
        const mappedLeague = constants.LEAGUE_MAP[e.sport_key];
        
        // 1. League Filter
        if (leagues && leagues.length > 0) {
            const leagueMatch = leagues.some(l => 
                (mappedLeague && mappedLeague.includes(l)) || 
                e.sport_title.includes(l) || 
                e.sport_key.includes(l)
            );
            if (!leagueMatch) return false;
        }

        // 2. Date Filter
        if (date && !e.commence_time.startsWith(date)) {
            return false;
        }

        // 3. Time Range Filter (GOD LEVEL SPEC)
        const startTime = new Date(e.commence_time);
        if (!filterByTimeRange(startTime, timeRange, now)) {
            return false;
        }

        return true;
    });

    const normalizedMatches = filteredEvents.map(e => adaptOddsMatch(e))
                                            .filter(m => m.odds !== null);

    await upsertMatches(normalizedMatches);
    
    logger.info(`✅ Sincronización completa: ${normalizedMatches.length} señales detectadas.`);
    return normalizedMatches;

  } catch (error) {
    logger.error(`❌ Fallo en Ingestion Service: ${error.message}`);
    return [];
  }
}

/**
 * Lógica de ventana horaria
 */
function filterByTimeRange(startTime, timeRange, now) {
    const limits = {
        'next_2h': 2,
        'next_6h': 6,
        'next_12h': 12,
        'full_day': 24
    };

    const hours = limits[timeRange];
    if (!hours || timeRange === 'full_day') return true;

    const maxTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
    return startTime >= now && startTime <= maxTime;
}

async function upsertMatches(normalizedDataList) {
    if (dbConfig.isMemoryMode()) {
      const store = dbConfig.getMemStore();
      normalizedDataList.forEach(match => store.matches.set(match.externalId, match));
      return;
    }
    
    const bulkOps = normalizedDataList.map(match => ({
      updateOne: {
        filter: { externalId: match.externalId },
        update: { $set: match },
        upsert: true
      }
    }));
  
    if (bulkOps.length > 0) {
      try {
        await Match.bulkWrite(bulkOps);
      } catch (err) {
        logger.error('Error en bulkWrite:', err.message);
      }
    }
}

async function processIngestionCycle() {
  const today = new Date().toISOString().split('T')[0];
  return await fetchMatchesByDate(today, [], 'full_day');
}

module.exports = { fetchMatchesByDate, processIngestionCycle, getGlobalApiTokens };
