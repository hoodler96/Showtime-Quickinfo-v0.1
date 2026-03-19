const axios = require('axios');

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0',
  'Accept': 'application/json',
};

async function getQuote(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
    const res = await axios.get(url, {
      headers: YAHOO_HEADERS,
    });

    const quote = res.data?.quoteResponse?.result?.[0];
    if (!quote) return null;

    return {
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      percent: quote.regularMarketChangePercent,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Yahoo quote error:', err.response?.data || err.message);
    return null;
  }
}

async function getOptionChain(symbol) {
  try {
    const url = `https://query2.finance.yahoo.com/v7/finance/options/${encodeURIComponent(symbol)}`;
    const res = await axios.get(url, {
      headers: YAHOO_HEADERS,
    });

    const chain = res.data?.optionChain?.result?.[0];
    if (!chain) return null;

    return chain;
  } catch (err) {
    console.error('Yahoo chain error:', err.response?.data || err.message);
    return null;
  }
}

function findContract(chain, strike, type) {
  const options = chain.options?.[0];
  if (!options) return null;

  const list = type === 'put' ? options.puts : options.calls;
  if (!Array.isArray(list)) return null;

  return list.find(c => Number(c.strike) === Number(strike)) || null;
}

async function getOptionSnapshot(symbol, strike, type) {
  const chain = await getOptionChain(symbol);
  if (!chain) return null;

  const contract = findContract(chain, strike, type);
  if (!contract) return null;

  return contract;
}

module.exports = {
  getQuote,
  getOptionChain,
  getOptionSnapshot,
};
