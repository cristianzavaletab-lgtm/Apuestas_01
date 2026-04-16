// src/integrations/odds_api.adapter.js
const constants = require('../config/constants');

/**
 * Convert raw Odds API match data to internal Match model
 */
function adaptOddsMatch(match) {
  const leagueName = constants.LEAGUE_MAP[match.sport_key] || match.sport_title || match.sport_key;
  
  return {
    externalId: match.id,
    sport: "soccer",
    league: leagueName,
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    commenceTime: new Date(match.commence_time),
    status: 'scheduled', // The odds API usually returns scheduled matches
    odds: extractOdds(match.bookmakers),
    raw: match,
    lastUpdated: new Date()
  };
}

/**
 * Extract Decimal Odds (H2H) from bookmakers
 */
function extractOdds(bookmakers) {
  if (!bookmakers || !bookmakers.length) return null;

  // We take the first bookmaker (usually the one with best/most data in the response)
  const bookmaker = bookmakers[0];
  const markets = bookmaker.markets;
  
  if (!markets || !markets.length) return null;

  const h2h = markets.find(m => m.key === "h2h");
  if (!h2h || !h2h.outcomes || h2h.outcomes.length < 2) return null;

  // outcomes [0] is usually Home, [1] is Away
  // But let's be safe and check the names
  const homeOutcome = h2h.outcomes.find(o => o.name === h2h.outcomes[0].name); // dummy
  
  // Format for our internal engine
  return {
    homeMoneyline: h2h.outcomes[0].price, // decimal
    awayMoneyline: h2h.outcomes[1].price, // decimal
    drawMoneyline: h2h.outcomes[2] ? h2h.outcomes[2].price : null,
    source: bookmaker.title
  };
}

module.exports = { adaptOddsMatch };
