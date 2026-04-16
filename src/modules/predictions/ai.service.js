const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../../utils/logger');

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

/**
 * AI Expert System Service - PRECISION EDITION
 * Focuses on offensive metrics like Shots on Goal and Corners.
 */
async function analyzeMatch(matchData) {
  const { homeTeam, awayTeam, league, date } = matchData;
  
  logger.info(`🔍 Precision Expert Analysis: ${homeTeam} vs ${awayTeam}`);

  let researchContext = "";
  
  // 1. Phase: Deep Tactical & Stat Research (Gemini)
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      const prompt = `Actúa como un trader estadístico de fútbol. Investiga ${homeTeam} vs ${awayTeam} (${league}) el ${date}.
        DATOS CRÍTICOS REQUERIDOS:
        1. Promedio reciente de remates al arco (Shots on Goal) de ambos equipos.
        2. Tendencia de Córners (Over/Under) basada en el volumen ofensivo.
        3. Estilo de ataque (frecuencia de centros vs pases filtrados).
        4. Historial H2H reciente e impacto de lesiones.`;
      const result = await model.generateContent(prompt);
      researchContext = result.response.text();
    } catch (err) {
      logger.warn(`Gemini research failed: ${err.message}`);
    }
  }

  // 2. Phase: Expert Reasoning (Analytical JSON)
  const systemPrompt = "Eres un analista de precisión de mercado (Big Data Sports). Tu análisis debe incluir proyecciones ofensivas. Responde SOLO en JSON.";
  const userPrompt = `Analiza el encuentro: ${homeTeam} vs ${awayTeam}.
    Investigación: ${researchContext}
    
    Genera predicción experta incluyendo métricas de ataque:
    {
      "probabilities": { "home": 0.XX, "away": 0.XX, "draw": 0.XX },
      "pick": "HOME" | "AWAY" | "DRAW" | "NO_BET",
      "confidence": 0.XX,
      "reasoning": "Breve resumen ejecutivo",
      "offensive_insight": "Máximo detalle sobre remates y volumen de ataque esperado",
      "tactical_insight": "Factor táctico clave",
      "key_factors": ["factor 1", "factor 2"],
      "expert_score": 0.XX,
      "offensive_potential": 0.XX,
      "projected_goals": 0.0,
      "projected_corners": 0.0
    }`;

  // Priority: OpenAI GPT-4o
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      });
      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      logger.warn(`OpenAI failed: ${error.message}. Routing to Gemini Pro fallback.`);
    }
  }

  // Fallback: Gemini Flash
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash-latest",
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent(systemPrompt + "\n" + userPrompt);
      return JSON.parse(result.response.text());
    } catch (err) {
      logger.error(`AI Critical failure: ${err.message}`);
    }
  }

  return {
    probabilities: { home: 0.33, away: 0.33, draw: 0.34 },
    pick: 'NO_BET',
    confidence: 0,
    reasoning: "Análisis no disponible.",
    offensive_insight: "N/A",
    tactical_insight: "N/A",
    key_factors: [],
    expert_score: 0,
    offensive_potential: 0,
    projected_goals: 2.0,
    projected_corners: 7.0
  };
}

module.exports = { analyzeMatch };
