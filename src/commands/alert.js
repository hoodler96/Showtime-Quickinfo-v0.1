const { SlashCommandBuilder } = require('discord.js');
const Alert = require('../models/Alert');

function formatPrice(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return number.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function cleanSymbol(symbol) {
  return String(symbol || '')
    .trim()
    .toUpperCase()
    .replace(/^\$/, '');
}

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
        .setDescription('Ticker symbol, e.g. SPY, QQQ, TSLA')
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
    )
    .addStringOption(option =>
      option
        .setName('note')
        .setDescription('Optional note, e.g. Watch 680 breakout')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const action = interaction.options.getString('action', true);
      const symbol = cleanSymbol(interaction.options.getString('symbol'));
      const condition = interaction.options.getString('condition');
      const target = interaction.options.getNumber('target');
      const note = interaction.options.getString('note')?.trim() || null;

      if (action === 'list') {
        const alerts = await Alert.find({
          userId: interaction.user.id,
          isActive: true,
        }).sort({ createdAt: -1 });

        if (!alerts.length) {
          return interaction.reply({
            content: `No active alerts for <@${interaction.user.id}>.`,
            allowedMentions: {
              users: [interaction.user.id],
            },
          });
        }

        const lines = alerts.map((alert, index) => {
          const base = `${index + 1}. **${alert.symbol}** ${alert.condition} **${formatPrice(alert.target)}**`;
          return alert.note ? `${base} — ${alert.note}` : base;
        });

        return interaction.reply({
          content: [
            `**Active alerts for <@${interaction.user.id}>**`,
            ...lines,
          ].join('\n'),
          allowedMentions: {
            users: [interaction.user.id],
          },
        });
      }

      if (!symbol) {
        return interaction.reply({
          content: 'You need to provide a ticker symbol.',
          ephemeral: true,
        });
      }

      if (action === 'create') {
        if (!condition || target == null) {
          return interaction.reply({
            content: 'For create, you need a symbol, condition, and target price.',
            ephemeral: true,
          });
        }

        if (!Number.isFinite(target) || target <= 0) {
          return interaction.reply({
            content: 'Target price must be a number greater than 0.',
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
            content: `You already have an active alert for **${symbol}** ${condition} **${formatPrice(target)}**.`,
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
          note,
          isActive: true,
        });

        return interaction.reply({
          content: [
            `✅ <@${interaction.user.id}> alert created.`,
            `**${symbol}** ${condition} **${formatPrice(target)}**`,
            note ? `Note: ${note}` : null,
          ].filter(Boolean).join('\n'),
          allowedMentions: {
            users: [interaction.user.id],
          },
        });
      }

      if (action === 'delete') {
        const result = await Alert.updateMany(
          {
            userId: interaction.user.id,
            symbol,
            isActive: true,
          },
          {
            $set: {
              isActive: false,
            },
          }
        );

        if (!result.modifiedCount) {
          return interaction.reply({
            content: `❌ <@${interaction.user.id}> no active alerts found for **${symbol}**.`,
            allowedMentions: {
              users: [interaction.user.id],
            },
          });
        }

        return interaction.reply({
          content: `🗑️ <@${interaction.user.id}> cancelled ${result.modifiedCount} active alert(s) for **${symbol}**.`,
          allowedMentions: {
            users: [interaction.user.id],
          },
        });
      }

      return interaction.reply({
        content: 'Invalid alert action.',
        ephemeral: true,
      });
    } catch (err) {
      console.error('alert command error:', err);

      if (interaction.deferred || interaction.replied) {
        return interaction.editReply('Something went wrong creating that alert.');
      }

      return interaction.reply({
        content: 'Something went wrong creating that alert.',
        ephemeral: true,
      });
    }
  },
};
