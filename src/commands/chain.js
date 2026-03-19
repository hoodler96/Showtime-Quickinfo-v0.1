const { SlashCommandBuilder } = require('discord.js');
const { getOptionChain } = require('../lib/marketData');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chain')
    .setDescription('Get a basic options chain preview')
    .addStringOption(option =>
      option
        .setName('symbol')
        .setDescription('Underlying ticker, e.g. SPY')
        .setRequired(true)
    ),

  async execute(interaction) {
    const symbol = interaction.options.getString('symbol').toUpperCase();
    await interaction.deferReply();

    try {
      const chain = await getOptionChain(symbol);

      if (!chain || !chain.options || !chain.options[0]) {
        return interaction.editReply(`No options chain found for **${symbol}**.`);
      }

      const calls = chain.options[0].calls?.slice(0, 5) || [];

      if (!calls.length) {
        return interaction.editReply(`No call contracts found for **${symbol}**.`);
      }

      const lines = calls.map(c =>
        `${c.strike}C | Last ${c.lastPrice ?? 'n/a'} | IV ${c.impliedVolatility ?? 'n/a'} | OI ${c.openInterest ?? 'n/a'}`
      );

      return interaction.editReply([
        `**${symbol} options chain**`,
        ...lines,
      ].join('\n'));
    } catch (err) {
      console.error('chain command error:', err);
      return interaction.editReply('Failed to fetch options chain.');
    }
  },
};
