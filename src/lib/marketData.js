const axios = require('axios');

async function getQuote(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
    const res = await axios.get(url);

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
    console.error('Yahoo quote error:', err);
    return null;
  }
}

async function getOptionChain(symbol) {
  try {
    const url = `https://query2.finance.yahoo.com/v7/finance/options/${symbol}`;
    const res = await axios.get(url);

    const chain = res.data?.optionChain?.result?.[0];
    if (!chain) return null;

    return chain;
  } catch (err) {
    console.error('Yahoo chain error:', err);
    return null;
  }
}

function findContract(chain, strike, type) {
  const options = chain.options?.[0];
  if (!options) return null;

  const list = type === 'call' ? options.calls : options.puts;

  return list.find(c => Number(c.strike) === Number(strike));
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
