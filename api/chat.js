module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENROUTER_API_KEY not set' });

  try {
    const body = req.body || {};

    // Use model fallback list — OpenRouter tries each in order
    const payload = Object.assign({}, body, {
      models: body.models || [
        'meta-llama/llama-3.3-70b-instruct:free',
        'mistralai/mistral-small-3.1-24b-instruct:free',
        'google/gemini-2.0-flash-exp:free'
      ],
      route: 'fallback'
    });
    // Remove single model key — models array takes over
    delete payload.model;

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'HTTP-Referer': 'https://nivi-goal-negotiator.vercel.app',
        'X-Title': 'Nivi Goal Negotiator'
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    if (!r.ok) console.error('OpenRouter error:', r.status, JSON.stringify(data).slice(0, 300));
    return res.status(r.status).json(data);

  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};