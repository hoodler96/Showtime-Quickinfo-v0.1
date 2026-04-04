const { SlashCommandBuilder } = require('discord.js');
const { askQuickinfo } = require('../lib/ai');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask Showtime Quickinfo a market question')
    .addStringOption(option =>
      option
        .setName('prompt')
        .setDescription('Your question')
        .setRequired(true)
    ),

  async execute(interaction) {
    const prompt = interaction.options.getString('prompt');

    await interaction.deferReply();

    try {
      const answer = await askQuickinfo(prompt);
      return interaction.editReply(answer || 'No response returned.');
    } catch (err) {
      console.error('ask command error:', err);
      return interaction.editReply('Failed to get AI response.');
    }
  },
};
