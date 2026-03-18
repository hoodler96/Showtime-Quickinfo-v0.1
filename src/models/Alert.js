const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: String,
  guildId: String,
  channelId: String,
  type: { type: String, enum: ['price', 'option_greek'], required: true },
  symbol: { type: String, required: true },
  option: {
    expiry: String,
    strike: Number,
    side: { type: String, enum: ['call', 'put'] },
  },
  field: { type: String, required: true },
  condition: { type: String, enum: ['above', 'below'], required: true },
  target: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  lastTriggeredAt: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Alert', alertSchema);
