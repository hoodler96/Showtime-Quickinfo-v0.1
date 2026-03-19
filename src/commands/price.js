const { SlashCommandBuilder } = require('discord.js');
const { getQuote } = require('../lib/marketData');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('price')
    .setDescription('Get stock price')
    .addStringOption(opt =>
      opt.setName('symbol')
        .setDescription('Ticker (ex: SPY)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const symbol = interaction.options.getString('symbol').toUpperCase();

    await interaction.deferReply();

    const quote = await getQuote(symbol);

    if (!quote) {
      return interaction.editReply(`No data found for ${symbol}`);
    }

    return interaction.editReply(
      `📊 ${symbol}\n` +
      `Price: $${quote.price}\n` +
      `High: $${quote.high}\n` +
      `Low: $${quote.low}\n` +
      `Volume: ${quote.volume}`
    );
  }
};
