module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY not set in Vercel environment variables' });

  // Model fallback chain — if one hits rate limit or fails, next is tried automatically
  const models = [
    'openai/gpt-oss-120b',   // GPT-OSS 120B: best quality, Groq recommended replacement
    'qwen/qwen3.6-27b',      // Qwen 3.6 27B: strong fallback, high daily limit
    'openai/gpt-oss-20b',    // GPT-OSS 20B: fastest, highest daily limit
  ];

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

      // On rate limit or model error, silently try next
      if (r.status === 429 || r.status === 404) {
        console.log(`Model ${model} unavailable (${r.status}), trying next...`);
        continue;
      }

      if (!r.ok) {
        console.error(`Groq error (${model}):`, r.status, JSON.stringify(data).slice(0, 200));
      }

      return res.status(r.status).json(data);

    } catch (err) {
      console.error(`Handler error (${model}):`, err.message);
      if (model === models[models.length - 1]) {
        return res.status(500).json({ error: err.message });
      }
      continue;
    }
  }

  return res.status(429).json({
    error: 'All models are currently unavailable. Please try again in a moment.'
  });
};