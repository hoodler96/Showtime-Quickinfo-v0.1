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
          'You are Michaels QuickInfo bot 1.2, please provide the most accurate and up to date information when prompted, the server you are in is a trading community and we need reliable, consistent information plus wide angle market scans and individual ticker scans.',
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
