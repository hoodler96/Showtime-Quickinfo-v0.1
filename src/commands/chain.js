const calls = chain.options[0].calls.slice(0, 5);

calls.map(c =>
  `${c.strike}C | IV ${c.impliedVolatility} | OI ${c.openInterest}`
);
