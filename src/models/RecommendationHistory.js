const mongoose = require('mongoose');

const recommendationHistorySchema = new mongoose.Schema({
  date: { type: String, required: true },
  matchId: { type: String, required: true },
  homeTeam: String,
  awayTeam: String,
  type: { type: String, enum: ['high_conviction', 'moonshot'], required: true },
  market: String,
  odds: Number,
  confidence: Number,
  expertScore: Number,
  valueEdge: Number,
  outcome: { type: String, enum: ['pending', 'win', 'loss', 'void'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RecommendationHistory', recommendationHistorySchema);
