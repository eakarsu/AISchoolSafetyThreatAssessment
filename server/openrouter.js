const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-3-5-sonnet-20241022';

// 3-strategy JSON parser
function parseAIJson(text) {
  if (!text) return null;

  // Strategy 1: direct parse
  try {
    return JSON.parse(text);
  } catch (_) {}

  // Strategy 2: extract from markdown code block
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) {
    try {
      return JSON.parse(codeBlock[1].trim());
    } catch (_) {}
  }

  // Strategy 3: extract first {...} or [...] block
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (_) {}
  }

  return null;
}

async function askAI(systemPrompt, userPrompt, expectJson = false) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || MODEL;

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return expectJson ? null : 'AI analysis unavailable: OpenRouter API key not configured.';
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000',
        'X-Title': 'School Safety Threat Assessment',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', response.status, errorData);
      return expectJson ? null : `AI analysis failed: ${response.status} - ${response.statusText}`;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No analysis generated.';

    if (expectJson) {
      return parseAIJson(content);
    }
    return content;
  } catch (error) {
    console.error('OpenRouter request error:', error.message);
    return expectJson ? null : `AI analysis error: ${error.message}`;
  }
}

module.exports = { askAI, parseAIJson };
