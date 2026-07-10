const startAlertPoller = require('../jobs/alertPoller');
module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    startAlertPoller(client);
    console.log(`Logged in as ${client.user.tag}`);
  },
};
