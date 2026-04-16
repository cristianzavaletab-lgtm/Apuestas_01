const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    sparse: true, // Optional for manual users, required for Google
    trim: true
  },
  password: {
    type: String,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // Token Economy
  tokens: {
    type: Number,
    default: 10 // Give some initial free tokens for trying it out
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
