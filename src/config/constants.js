// src/config/constants.js
// Configuración central del sistema

module.exports = {
  // Configuración de APIs
  ODDS_API_KEY: process.env.SPORTS_API_KEY || process.env.ODDS_API_KEY,
  ODDS_API_BASE_URL: "https://api.the-odds-api.com/v4",
  
  BETSTACK_API_KEY: process.env.BETSTACK_API_KEY,
  BETSTACK_BASE_URL: process.env.BETSTACK_BASE_URL || 'https://api.betstack.dev/api/v1',

  // Scheduler
  INGESTION_INTERVAL_MS: 30 * 1000,
  MAX_RETRIES: 3,
  RETRY_BACKOFF_MS: 2000,

  // Umbrales de picks
  PICK_THRESHOLD: 0.65,          // Umbral para HOME/AWAY según especificación
  CONFIDENCE_MIN_COMBO: 0.60,    // Mínimo para incluír en combinadas

  // Clasificación de riesgo en combinadas
  RISK: {
    LOW:    0.6,
    MEDIUM: 0.4
  },

  // Ligas Mapeadas (The Odds API -> Nombre Legible)
  // ¡Ahora con TODAS las ligas disponibles!
  LEAGUE_MAP: {
    "soccer_uefa_champs_league": "UEFA Champions League",
    "soccer_uefa_europa_league": "UEFA Europa League",
    "soccer_uefa_europa_conference_league": "UEFA Conference League",
    "soccer_spain_la_liga": "La Liga",
    "soccer_spain_segunda_division": "La Liga 2",
    "soccer_english_premier_league": "Premier League",
    "soccer_epl": "Premier League",
    "soccer_efl_champ": "Championship",
    "soccer_england_league1": "League 1",
    "soccer_england_league2": "League 2",
    "soccer_italy_serie_a": "Serie A",
    "soccer_italy_serie_b": "Serie B",
    "soccer_germany_bundesliga": "Bundesliga",
    "soccer_germany_bundesliga2": "Bundesliga 2",
    "soccer_france_ligue_one": "Ligue 1",
    "soccer_france_ligue_two": "Ligue 2",
    "soccer_conmebol_libertadores": "Copa Libertadores",
    "soccer_conmebol_copa_sudamericana": "Copa Sudamericana",
    "soccer_mexico_ligamx": "Liga MX",
    "soccer_usa_mls": "MLS",
    "soccer_saudi_arabia_pro_league": "Saudi Pro League",
    "soccer_portugal_primeira_liga": "Primeira Liga",
    "soccer_netherlands_eredivisie": "Eredivisie",
    "soccer_belgium_first_division": "First Division A",
    "soccer_brazil_campeonato_seria_a": "Brasileirão",
    "soccer_argentina_primera_division": "Primera División Arg",
    "soccer_australia_aleague": "A-League",
    "soccer_japan_j_league": "J League",
    "soccer_korea_kleague1": "K League 1",
    "soccer_norway_eliteserien": "Eliteserien",
    "soccer_sweden_allsvenskan": "Allsvenskan",
    "soccer_denmark_superliga": "Superliga",
    "soccer_turkey_super_league": "Süper Lig",
    "soccer_greece_super_league": "Super League Greece",
    "soccer_fifa_world_cup": "FIFA World Cup"
  },

  // Estados
  ACTIVE_STATUSES: ['live', 'scheduled'],

  // Pesos del Blending
  BLENDER_WEIGHTS: {
    model: 0.6,
    market: 0.4
  }
};
