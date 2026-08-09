module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENROUTER_API_KEY not set' });

  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'HTTP-Referer': 'https://nivi-goal-negotiator.vercel.app',
        'X-Title': 'Nivi Goal Negotiator'
      },
      body: JSON.stringify(req.body)
    });

    const data = await r.json();

    // Log the actual error from OpenRouter so we can see it in Vercel logs
    if (!r.ok) {
      console.error('OpenRouter error:', r.status, JSON.stringify(data));
    }

    return res.status(r.status).json(data);
  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};