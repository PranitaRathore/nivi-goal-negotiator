module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY not set in Vercel environment variables' });

  // Primary: llama-3.3-70b-versatile (best quality, 1000 req/day free)
  // Fallback: llama-3.1-8b-instant   (faster, 14400 req/day free)
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

  for (const model of models) {
    try {
      const body = Object.assign({}, req.body, { model });
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify(body)
      });

      const data = await r.json();

      // On rate limit, try the next model in the list
      if (r.status === 429) {
        console.log(`Rate limit on ${model}, trying next...`);
        continue;
      }

      if (!r.ok) {
        console.error(`Groq error (${model}):`, r.status, JSON.stringify(data).slice(0, 200));
      }

      // Tag the response with which model was used
      if (data.model === undefined) data.model = model;
      return res.status(r.status).json(data);

    } catch (err) {
      console.error(`Handler error (${model}):`, err.message);
      if (model === models[models.length - 1]) {
        return res.status(500).json({ error: err.message });
      }
      // Try next model on network error too
      continue;
    }
  }

  // All models exhausted
  return res.status(429).json({
    error: 'All models are rate limited. Daily quota may be reached. Please try again tomorrow or reduce request frequency.'
  });
};