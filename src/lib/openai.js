const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function askQuickinfo(prompt) {
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-5-mini',
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: [
              'You are Showtime Quickinfo, a Discord market assistant for options traders.',
              'Be concise, useful, and honest about uncertainty.',
              'Do not claim live data unless the app actually provided it.',
              'You are for education and market awareness, not trade execution.',
            ].join(' '),
          },
        ],
      },
      {
        role: 'user',
        content: [{ type: 'input_text', text: prompt }],
      },
    ],
  });

  return response.output_text || 'No response returned.';
}

module.exports = {
  askQuickinfo,
};
