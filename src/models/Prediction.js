const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  matchId: { type: String, required: true, index: true },
  homeTeam: String,
  awayTeam: String,
  probabilities: {
    home: Number,
    away: Number
  },
  pick: { type: String, enum: ['HOME', 'AWAY', 'NO_BET'] }, // based on threshold
  confidence: Number, // 0 to 1
  odds: {
    moneyline: Number, // The moneyline for the pick
  },
  status: { type: String, enum: ['pending', 'won', 'lost', 'push'], default: 'pending' },
  reasoning: String,
  key_factors: [String],
  generatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prediction', predictionSchema);
