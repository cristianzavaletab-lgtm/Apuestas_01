// src/integrations/odds_api.client.js
const axios = require('axios');
const constants = require('../config/constants');
const logger = require('../utils/logger');

// Simple In-Memory Cache
let cache = {
  data: null,
  timestamp: 0
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch soccer events from The Odds API
 */
async function fetchSoccerEvents() {
  const now = Date.now();
  
  // Return cached data if valid
  if (cache.data && (now - cache.timestamp) < CACHE_TTL) {
    logger.info('Returning soccer events from cache');
    return cache.data;
  }

  logger.info('Fetching fresh soccer events from The Odds API');
  
  try {
    const response = await axios.get(`${constants.ODDS_API_BASE_URL}/sports/soccer/odds`, {
      params: {
        regions: "eu,us",
        markets: "h2h",
        oddsFormat: "decimal",
        apiKey: constants.ODDS_API_KEY
      }
    });

    // Update cache
    cache.data = response.data;
    cache.timestamp = now;

    return response.data;
  } catch (error) {
    logger.error(`Error fetching from The Odds API: ${error.message}`);
    if (error.response) {
      logger.error(`API Status: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

module.exports = { fetchSoccerEvents };
