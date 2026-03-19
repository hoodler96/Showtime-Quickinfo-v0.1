const axios = require('axios');

const BASE = 'https://api.polygon.io';

// =======================
// STOCK PRICE
// =======================
async function getQuote(symbol) {
  try {
    const url = `${BASE}/v2/aggs/ticker/${symbol}/prev?apiKey=${process.env.POLYGON_API_KEY}`;
    const res = await axios.get(url);

    const data = res.data?.results?.[0];
    if (!data) return null;

    return {
      symbol,
      price: data.c,
      open: data.o,
      high: data.h,
      low: data.l,
      volume: data.v,
    };
  } catch (err) {
    console.error('Polygon quote error:', err.response?.data || err.message);
    return null;
  }
}

// =======================
// OPTIONS CHAIN
// =======================
async function getOptionChain(symbol) {
  try {
    const url = `${BASE}/v3/reference/options/contracts?underlying_ticker=${symbol}&limit=50&apiKey=${process.env.POLYGON_API_KEY}`;
    const res = await axios.get(url);

    return res.data?.results || null;
  } catch (err) {
    console.error('Polygon chain error:', err.response?.data || err.message);
    return null;
  }
}

// =======================
// FIND CONTRACT
// =======================
function findContract(contracts, strike, type) {
  if (!contracts) return null;

  return contracts.find(c =>
    Number(c.strike_price) === Number(strike) &&
    c.contract_type === type
  );
}

// =======================
// OPTION SNAPSHOT (PRICE + GREEKS)
// =======================
async function getOptionSnapshot(symbol, strike, type) {
  try {
    const chain = await getOptionChain(symbol);
    if (!chain) return null;

    const contract = findContract(chain, strike, type);
    if (!contract) return null;

    const ticker = contract.ticker;

    const url = `${BASE}/v3/snapshot/options/${symbol}/${ticker}?apiKey=${process.env.POLYGON_API_KEY}`;
    const res = await axios.get(url);

    return res.data?.results || null;
  } catch (err) {
    console.error('Polygon snapshot error:', err.response?.data || err.message);
    return null;
  }
}

module.exports = {
  getQuote,
  getOptionChain,
  getOptionSnapshot,
};
