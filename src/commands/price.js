const { SlashCommandBuilder } = require('discord.js');
const { getQuote } = require('../lib/marketData');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('price')
    .setDescription('Get the latest price for a ticker')
    .addStringOption(option =>
      option
        .setName('symbol')
        .setDescription('Ticker symbol, e.g. SPY')
        .setRequired(true)
    ),

  async execute(interaction) {
    const symbol = interaction.options.getString('symbol').toUpperCase();
    await interaction.deferReply();

    try {
      const quote = await getQuote(symbol);

      if (!quote) {
        return interaction.editReply(`No quote found for **${symbol}**.`);
      }

      return interaction.editReply([
        `**${quote.symbol}**`,
        `Price: ${quote.price ?? 'n/a'}`,
        `Change: ${quote.change ?? 'n/a'} (${quote.percent ?? 'n/a'}%)`,
        `As of: ${quote.timestamp ?? 'n/a'}`,
      ].join('\n'));
    } catch (err) {
      console.error('price command error:', err);
      return interaction.editReply('Failed to fetch price data.');
    }
  },
};
