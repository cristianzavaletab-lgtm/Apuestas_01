const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema({
  dateKey: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
  aiCallsCount: { type: Number, default: 0 },
  successfulCalls: { type: Number, default: 0 },
  failedCalls: { type: Number, default: 0 },
  dailyLimit: { type: Number, default: 35 },
  lastResetAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Usage', usageSchema);
