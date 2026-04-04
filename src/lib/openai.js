const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
  timeout: 60000,
});

async function askQuickinfo(prompt) {
  const completion = await client.chat.completions.create({
    model: process.env.GROK_MODEL || 'grok-4.20',
    messages: [
      {
        role: 'system',
        content:
          'You are Showtime Quickinfo. Answer clearly, directly, and briefly/helpfully for a trading community Discord.Keep answers practical and concise.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return completion.choices?.[0]?.message?.content?.trim() || null;
}

module.exports = { askQuickinfo };
