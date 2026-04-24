const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function askAI(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return 'AI analysis unavailable: OpenRouter API key not configured. Please set OPENROUTER_API_KEY in your .env file.';
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'School Safety Threat Assessment',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', response.status, errorData);
      return `AI analysis failed: ${response.status} - ${response.statusText}`;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No analysis generated.';
  } catch (error) {
    console.error('OpenRouter request error:', error.message);
    return `AI analysis error: ${error.message}`;
  }
}

module.exports = { askAI };
