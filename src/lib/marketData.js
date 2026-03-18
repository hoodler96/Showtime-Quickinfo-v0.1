const axios = require('axios');

async function getQuote(symbol) {
  const provider = process.env.MARKET_DATA_PROVIDER;

  if (provider === 'tradier') {
    const response = await axios.get(`${process.env.TRADIER_BASE_URL}/markets/quotes`, {
      params: { symbols: symbol, greeks: false },
      headers: {
        Authorization: `Bearer ${process.env.TRADIER_API_TOKEN}`,
        Accept: 'application/json',
      },
    });

    const quote = response.data?.quotes?.quote;
    if (!quote) return null;

    return {
      symbol: quote.symbol,
      last: quote.last,
      change: quote.change,
      timestamp: new Date().toISOString(),
    };
  }

  throw new Error(`Unsupported market data provider: ${provider}`);
}

module.exports = {
  getQuote,
};
