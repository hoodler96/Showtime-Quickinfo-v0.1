const { SlashCommandBuilder } = require('discord.js');
const { askQuickinfo } = require('../lib/openai');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask Showtime Quickinfo a market question')
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('Your market question')
        .setRequired(true)
    ),

  async execute(interaction) {
    const prompt = interaction.options.getString('prompt');
    await interaction.deferReply();

    const answer = await askQuickinfo(prompt);
    await interaction.editReply(answer);
  },
};
