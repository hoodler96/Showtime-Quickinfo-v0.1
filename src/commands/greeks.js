const { SlashCommandBuilder } = require('discord.js');
const { getOptionSnapshot } = require('../lib/marketData');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('greeks')
    .setDescription('Get option data for a strike')
    .addStringOption(option =>
      option
        .setName('symbol')
        .setDescription('Underlying ticker, e.g. SPY')
        .setRequired(true)
    )
    .addNumberOption(option =>
      option
        .setName('strike')
        .setDescription('Strike price, e.g. 580')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('call or put')
        .setRequired(true)
        .addChoices(
          { name: 'call', value: 'call' },
          { name: 'put', value: 'put' }
        )
    ),

  async execute(interaction) {
    const symbol = interaction.options.getString('symbol').toUpperCase();
    const strike = interaction.options.getNumber('strike');
    const type = interaction.options.getString('type');

    await interaction.deferReply();

    try {
      const contract = await getOptionSnapshot(symbol, strike, type);

      if (!contract) {
        return interaction.editReply(
          `No ${type} contract found for **${symbol}** at strike **${strike}**.`
        );
      }

      return interaction.editReply([
        `**${symbol} ${strike} ${type.toUpperCase()}**`,
        `IV: ${contract.impliedVolatility ?? 'n/a'}`,
        `Last Price: ${contract.lastPrice ?? 'n/a'}`,
        `Bid: ${contract.bid ?? 'n/a'}`,
        `Ask: ${contract.ask ?? 'n/a'}`,
        `Volume: ${contract.volume ?? 'n/a'}`,
        `Open Interest: ${contract.openInterest ?? 'n/a'}`,
      ].join('\n'));
    } catch (err) {
      console.error('greeks command error:', err);
      return interaction.editReply('Failed to fetch option data.');
    }
  },
};
