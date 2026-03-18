const { SlashCommandBuilder } = require('discord.js');
const Alert = require('../models/Alert');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('watch-price')
    .setDescription('Create a price alert')
    .addStringOption(option =>
      option.setName('symbol').setDescription('Ticker symbol').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('condition')
        .setDescription('Alert condition')
        .setRequired(true)
        .addChoices(
          { name: 'above', value: 'above' },
          { name: 'below', value: 'below' }
        )
    )
    .addNumberOption(option =>
      option.setName('target').setDescription('Target price').setRequired(true)
    ),

  async execute(interaction) {
    const symbol = interaction.options.getString('symbol').toUpperCase();
    const condition = interaction.options.getString('condition');
    const target = interaction.options.getNumber('target');

    const alert = await Alert.create({
      userId: interaction.user.id,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      type: 'price',
      symbol,
      field: 'price',
      condition,
      target,
      isActive: true,
      createdAt: new Date(),
    });

    await interaction.reply(
      `Watching **${symbol}** and will alert when price goes **${condition} ${target}**.`
    );
  },
};
