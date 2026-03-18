require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if (!command || !command.data || typeof command.data.toJSON !== 'function') {
    console.error(`Invalid command file: ${file}`);
    continue;
  }

  commands.push(command.data.toJSON());
}

if (!process.env.DISCORD_TOKEN) {
  throw new Error('Missing DISCORD_TOKEN');
}

if (!process.env.DISCORD_CLIENT_ID) {
  throw new Error('Missing DISCORD_CLIENT_ID');
}

if (!process.env.DISCORD_GUILD_ID) {
  throw new Error('Missing DISCORD_GUILD_ID');
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Deploying ${commands.length} commands...`);

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID,
        process.env.DISCORD_GUILD_ID
      ),
      { body: commands }
    );

    console.log('Guild commands deployed successfully.');
  } catch (error) {
    console.error('Command deployment failed:', error);
  }
})();
