// src/modules/ingestion/ingestion.adapter.js

function normalizeMatch(apiData) {
  // Manejamos tanto el evento simplificado de la lista como el detallado
  const match = {
    externalId: apiData.id.toString(),
    homeTeam: apiData.home_team.name,
    awayTeam: apiData.away_team.name,
    league: apiData.league.name,
    commenceTime: new Date(apiData.commence_time),
    status: apiData.status, // 'scheduled', 'live', 'completed'
    score: {
      home: apiData.result?.home_score || 0,
      away: apiData.result?.away_score || 0,
      total: apiData.result?.total_score || 0
    },
    odds: {},
    lastUpdated: new Date()
  };

  // Si vienen las cuotas (lines), las extraemos
  if (apiData.lines && apiData.lines.length > 0) {
    const line = apiData.lines[0]; // Tomamos el primer corredor de apuestas disponible
    if (line.moneyline) {
      match.odds.homeMoneyline = parseFloat(line.moneyline.home);
      match.odds.awayMoneyline = parseFloat(line.moneyline.away);
    }
    if (line.spread) {
      match.odds.homeSpread = parseFloat(line.spread.home?.point);
      match.odds.homeSpreadPrice = parseFloat(line.spread.home?.price);
      match.odds.awaySpread = parseFloat(line.spread.away?.point);
      match.odds.awaySpreadPrice = parseFloat(line.spread.away?.price);
    }
    if (line.total) {
      match.odds.overUnder = parseFloat(line.total.number);
      match.odds.overPrice = parseFloat(line.total.over);
      match.odds.underPrice = parseFloat(line.total.under);
    }
  }

  return match;
}

module.exports = { normalizeMatch };
