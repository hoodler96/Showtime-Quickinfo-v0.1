const { SlashCommandBuilder } = require('discord.js');
const { getQuote } = require('../lib/marketData');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('price')
    .setDescription('Get the latest price for a ticker')
    .addStringOption(option =>
      option.setName('symbol')
        .setDescription('Ticker symbol, e.g. SPY')
        .setRequired(true)
    ),

  async execute(interaction) {
    const symbol = interaction.options.getString('symbol').toUpperCase();
    await interaction.deferReply();

    const quote = await getQuote(symbol);

    if (!quote) {
      return interaction.editReply(`No quote found for **${symbol}**.`);
    }

    return interaction.editReply([
      `**${symbol}**`,
      `Last: ${quote.last}`,
      `Change: ${quote.change}`,
      `As of: ${quote.timestamp}`,
    ].join('\n'));
  },
};
