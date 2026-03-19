const cron = require('node-cron');
const Alert = require('../models/Alert');
const { getQuote } = require('../lib/marketData');

function startAlertPoller(client) {
  const seconds = Number(process.env.ALERT_POLL_SECONDS || 30);
  const pattern = `*/${seconds} * * * * *`;

  cron.schedule(pattern, async () => {
    try {
      const alerts = await Alert.find({
        isActive: true,
        type: 'price',
      }).lean();

      for (const alert of alerts) {
        const quote = await getQuote(alert.symbol);
        if (!quote || quote.price == null) continue;

        const value = Number(quote.price);
        const hit =
          alert.condition === 'above'
            ? value >= alert.target
            : value <= alert.target;

        if (!hit) continue;

        const channel = alert.channelId
          ? await client.channels.fetch(alert.channelId).catch(() => null)
          : null;

        const message = `🚨 <@${alert.userId}> your **${alert.symbol}** alert hit: current price **${value}** (${alert.condition} ${alert.target}).`;

        if (channel && channel.isTextBased()) {
          await channel.send(message).catch(() => null);
        } else {
          const user = await client.users.fetch(alert.userId).catch(() => null);
          if (user) {
            await user.send(message).catch(() => null);
          }
        }

        await Alert.updateOne(
          { _id: alert._id },
          {
            $set: {
              isActive: false,
              lastTriggeredAt: new Date(),
            },
          }
        );
      }
    } catch (err) {
      console.error('Alert poller error:', err);
    }
  });
}

module.exports = {
  startAlertPoller,
};
