const Alert = require('../models/Alert');

let marketData = null;

try {
  marketData = require('../lib/marketData');
} catch (err) {
  console.warn('[AlertPoller] marketData.js could not be loaded. Using fallback price fetch.');
}

let intervalHandle = null;
let isPolling = false;

const POLL_INTERVAL_MS = Number(process.env.ALERT_POLL_INTERVAL_MS || 60000);

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

function extractPrice(data) {
  if (typeof data === 'number') return data;

  if (!data || typeof data !== 'object') return null;

  const possibleFields = [
    data.price,
    data.last,
    data.lastPrice,
    data.currentPrice,
    data.regularMarketPrice,
    data.mark,
    data.close,
    data.c,
  ];

  for (const value of possibleFields) {
    const number = Number(value);

    if (Number.isFinite(number) && number > 0) {
      return number;
    }
  }

  if (data.quote && typeof data.quote === 'object') {
    return extractPrice(data.quote);
  }

  if (data.data && typeof data.data === 'object') {
    return extractPrice(data.data);
  }

  return null;
}

async function fetchYahooPrice(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'ShowtimeQuickinfoBot/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo fallback failed for ${symbol}: ${response.status}`);
  }

  const json = await response.json();
  const result = json?.chart?.result?.[0];

  const metaPrice = Number(result?.meta?.regularMarketPrice);

  if (Number.isFinite(metaPrice) && metaPrice > 0) {
    return metaPrice;
  }

  const closes = result?.indicators?.quote?.[0]?.close || [];

  for (let i = closes.length - 1; i >= 0; i -= 1) {
    const close = Number(closes[i]);

    if (Number.isFinite(close) && close > 0) {
      return close;
    }
  }

  return null;
}

async function getCurrentPrice(symbol) {
  if (marketData) {
    const candidates = [
      'getCurrentPrice',
      'getPrice',
      'getStockPrice',
      'getQuote',
      'quote',
      'fetchQuote',
      'fetchPrice',
    ];

    for (const functionName of candidates) {
      if (typeof marketData[functionName] === 'function') {
        try {
          const result = await marketData[functionName](symbol);
          const price = extractPrice(result);

          if (Number.isFinite(price) && price > 0) {
            return price;
          }
        } catch (err) {
          console.error(`[AlertPoller] marketData.${functionName} failed for ${symbol}:`, err.message);
        }
      }
    }
  }

  try {
    const fallbackPrice = await fetchYahooPrice(symbol);

    if (Number.isFinite(fallbackPrice) && fallbackPrice > 0) {
      return fallbackPrice;
    }
  } catch (err) {
    console.error(`[AlertPoller] fallback price failed for ${symbol}:`, err.message);
  }

  return null;
}

function hasTriggered(alert, currentPrice) {
  if (!alert || !Number.isFinite(currentPrice)) return false;

  if (alert.condition === 'above') {
    return currentPrice >= alert.target;
  }

  if (alert.condition === 'below') {
    return currentPrice <= alert.target;
  }

  return false;
}

async function sendTriggeredAlert(client, alert, currentPrice) {
  const channel = await client.channels.fetch(alert.channelId).catch(() => null);

  if (!channel || !channel.isTextBased()) {
    console.warn(`[AlertPoller] Could not find text channel ${alert.channelId} for alert ${alert._id}`);
    return false;
  }

  const directionText = alert.condition === 'above'
    ? 'at or above'
    : 'at or below';

  const content = [
    `🚨 <@${alert.userId}> **${alert.symbol}** price alert triggered.`,
    `Current price: **${formatPrice(currentPrice)}**`,
    `Target: **${formatPrice(alert.target)}**`,
    `Condition: **${directionText}**`,
    alert.note ? `Note: ${alert.note}` : null,
  ].filter(Boolean).join('\n');

  await channel.send({
    content,
    allowedMentions: {
      users: [alert.userId],
    },
  });

  return true;
}

async function checkAlertsOnce(client) {
  if (isPolling) return;

  isPolling = true;

  try {
    const alerts = await Alert.find({
      isActive: true,
      type: 'price',
    }).limit(250);

    if (!alerts.length) return;

    const symbols = [...new Set(alerts.map(alert => alert.symbol))];
    const priceMap = new Map();

    for (const symbol of symbols) {
      const price = await getCurrentPrice(symbol);

      if (Number.isFinite(price) && price > 0) {
        priceMap.set(symbol, price);
      } else {
        console.warn(`[AlertPoller] No valid price for ${symbol}`);
      }
    }

    for (const alert of alerts) {
      const currentPrice = priceMap.get(alert.symbol);

      if (!Number.isFinite(currentPrice)) continue;
      if (!hasTriggered(alert, currentPrice)) continue;

      const claimedAlert = await Alert.findOneAndUpdate(
        {
          _id: alert._id,
          isActive: true,
        },
        {
          $set: {
            isActive: false,
            triggeredAt: new Date(),
            triggeredPrice: currentPrice,
          },
        },
        {
          new: true,
        }
      );

      if (!claimedAlert) continue;

      try {
        await sendTriggeredAlert(client, claimedAlert, currentPrice);

        console.log(
          `[AlertPoller] Triggered ${claimedAlert.symbol} ${claimedAlert.condition} ${claimedAlert.target} for user ${claimedAlert.userId}`
        );
      } catch (err) {
        console.error(`[AlertPoller] Failed sending alert ${claimedAlert._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[AlertPoller] checkAlertsOnce error:', err);
  } finally {
    isPolling = false;
  }
}

function startAlertPoller(client) {
  if (!client) {
    console.warn('[AlertPoller] No Discord client provided. Poller not started.');
    return null;
  }

  if (intervalHandle) {
    console.log('[AlertPoller] Already running.');
    return intervalHandle;
  }

  console.log(`[AlertPoller] Starting. Interval: ${POLL_INTERVAL_MS}ms`);

  setTimeout(() => {
    checkAlertsOnce(client).catch(err => {
      console.error('[AlertPoller] Initial check failed:', err.message);
    });
  }, 10000);

  intervalHandle = setInterval(() => {
    checkAlertsOnce(client).catch(err => {
      console.error('[AlertPoller] Scheduled check failed:', err.message);
    });
  }, POLL_INTERVAL_MS);

  return intervalHandle;
}

function stopAlertPoller() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('[AlertPoller] Stopped.');
  }
}

module.exports = startAlertPoller;
module.exports.startAlertPoller = startAlertPoller;
module.exports.stopAlertPoller = stopAlertPoller;
module.exports.checkAlertsOnce = checkAlertsOnce;
