const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    guildId: {
      type: String,
      required: true,
      index: true,
    },

    channelId: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      default: 'price',
      index: true,
    },

    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    field: {
      type: String,
      default: 'price',
    },

    condition: {
      type: String,
      enum: ['above', 'below'],
      required: true,
    },

    target: {
      type: Number,
      required: true,
    },

    note: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    triggeredAt: {
      type: Date,
      default: null,
    },

    triggeredPrice: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

alertSchema.index({
  userId: 1,
  symbol: 1,
  condition: 1,
  target: 1,
  isActive: 1,
});

module.exports = mongoose.model('Alert', alertSchema);
