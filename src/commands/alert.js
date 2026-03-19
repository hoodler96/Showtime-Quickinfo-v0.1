const { SlashCommandBuilder } = require('discord.js');
const Alert = require('../models/Alert');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('alert')
    .setDescription('Create, delete, or list price alerts')
    .addStringOption(option =>
      option
        .setName('action')
        .setDescription('What do you want to do?')
        .setRequired(true)
        .addChoices(
          { name: 'create', value: 'create' },
          { name: 'delete', value: 'delete' },
          { name: 'list', value: 'list' }
        )
    )
    .addStringOption(option =>
      option
        .setName('symbol')
        .setDescription('Ticker symbol, e.g. SPY')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('condition')
        .setDescription('Alert condition')
        .setRequired(false)
        .addChoices(
          { name: 'above', value: 'above' },
          { name: 'below', value: 'below' }
        )
    )
    .addNumberOption(option =>
      option
        .setName('target')
        .setDescription('Target price')
        .setRequired(false)
    ),

  async execute(interaction) {
    const action = interaction.options.getString('action');
    const symbol = interaction.options.getString('symbol')?.toUpperCase();
    const condition = interaction.options.getString('condition');
    const target = interaction.options.getNumber('target');

    if (action === 'list') {
      const alerts = await Alert.find({
        userId: interaction.user.id,
        isActive: true,
      }).sort({ createdAt: -1 });

      if (!alerts.length) {
        return interaction.reply('No active alerts.');
      }

      const lines = alerts.map(a =>
        `${a.symbol} ${a.condition} ${a.target}`
      );

      return interaction.reply([
        `**Active alerts for <@${interaction.user.id}>**`,
        ...lines,
      ].join('\n'));
    }

    if (!symbol) {
      return interaction.reply({
        content: 'You need to provide a symbol.',
        ephemeral: true,
      });
    }

    if (action === 'create') {
      if (!condition || target == null) {
        return interaction.reply({
          content: 'For create, you need symbol, condition, and target.',
          ephemeral: true,
        });
      }

      const existing = await Alert.findOne({
        userId: interaction.user.id,
        symbol,
        condition,
        target,
        isActive: true,
      });

      if (existing) {
        return interaction.reply({
          content: `You already have an active alert for ${symbol} ${condition} ${target}.`,
          ephemeral: true,
        });
      }

      await Alert.create({
        userId: interaction.user.id,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        type: 'price',
        symbol,
        field: 'price',
        condition,
        target,
        isActive: true,
      });

      return interaction.reply(
        `✅ <@${interaction.user.id}> alert created for **${symbol}** ${condition} **${target}**.`
      );
    }

    if (action === 'delete') {
      const result = await Alert.updateMany(
        {
          userId: interaction.user.id,
          symbol,
          isActive: true,
        },
        {
          $set: { isActive: false },
        }
      );

      if (!result.modifiedCount) {
        return interaction.reply(
          `❌ <@${interaction.user.id}> no active alerts found for **${symbol}**.`
        );
      }

      return interaction.reply(
        `🗑️ <@${interaction.user.id}> cancelled ${result.modifiedCount} active alert(s) for **${symbol}**.`
      );
    }

    return interaction.reply({
      content: 'Invalid action.',
      ephemeral: true,
    });
  },
};
