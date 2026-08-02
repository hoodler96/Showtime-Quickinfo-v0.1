const ALLOWED_COMMAND_ROLE_IDS = String(
  process.env.ALLOWED_COMMAND_ROLE_IDS || ''
)
  .split(',')
  .map(roleId => roleId.trim())
  .filter(Boolean);

function getMemberRoleIds(member) {
  if (!member?.roles) return [];

  // Standard cached Discord.js GuildMember
  if (member.roles.cache) {
    return [...member.roles.cache.keys()];
  }

  // Raw interaction member data
  if (Array.isArray(member.roles)) {
    return member.roles;
  }

  return [];
}

function memberCanUseQuickinfo(interaction) {
  if (!interaction.inGuild() || !interaction.member) {
    return false;
  }

  const memberRoleIds = getMemberRoleIds(interaction.member);

  return ALLOWED_COMMAND_ROLE_IDS.some(roleId =>
    memberRoleIds.includes(roleId)
  );
}

module.exports = {
  name: 'interactionCreate',

  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    /*
     * All Quickinfo slash commands require one of the roles listed in:
     * ALLOWED_COMMAND_ROLE_IDS
     */
    if (!memberCanUseQuickinfo(interaction)) {
      return interaction.reply({
        content:
          '🔒 Michael’s Quickinfo is available to **OG Trader** and **Premium** members only.',
        ephemeral: true,
      });
    }

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(
        `[Command Error] /${interaction.commandName}:`,
        error
      );

      const payload = {
        content: 'Something went wrong while running that command.',
        ephemeral: true,
      };

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload);
        } else {
          await interaction.reply(payload);
        }
      } catch (replyError) {
        console.error(
          `[Interaction Reply Error] /${interaction.commandName}:`,
          replyError
        );
      }
    }
  },
};
