const mongoose = require('mongoose');

const comboSchema = new mongoose.Schema({
  picks: [{
    matchId: String,
    homeTeam: String,
    awayTeam: String,
    pick: String,
    confidence: Number,
    odds: Number
  }],
  combinedProbability: Number,
  combinedOdds: Number,
  risk: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'won', 'lost'], default: 'pending' }
});

module.exports = mongoose.model('Combo', comboSchema);
