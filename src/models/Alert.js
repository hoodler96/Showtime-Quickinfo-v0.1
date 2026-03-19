const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: String,
  channelId: String,

  type: { type: String, enum: ['price', 'option_greek'], default: 'price', required: true },

  symbol: { type: String, required: true },

  option: {
    expiry: String,
    strike: Number,
    side: { type: String, enum: ['call', 'put'] },
  },

  field: { type: String, default: 'price', required: true },
  condition: { type: String, enum: ['above', 'below'], required: true },
  target: { type: Number, required: true },

  isActive: { type: Boolean, default: true },
  lastTriggeredAt: Date,
  createdAt: { type: Date, default: Date.now },
});

alertSchema.index({ userId: 1, symbol: 1, isActive: 1 });

module.exports = mongoose.model('Alert', alertSchema);
