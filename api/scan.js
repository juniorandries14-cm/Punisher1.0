// /api/scan — validates the caller's license key, checks their scan quota,
// increments usage, then forwards the screenshot to Claude's vision model.
// ANTHROPIC_API_KEY stays server-side only.
const { getRedis } = require('./_lib/redis');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY. Add it in Vercel → Settings → Environment Variables, then redeploy.' });
    return;
  }

  const redis = getRedis();
  if (!redis) {
    res.status(500).json({ error: 'Server is missing Redis storage credentials. See DEPLOY.md.' });
    return;
  }

  const licenseKey = req.headers['x-license-key'];
  if (!licenseKey) {
    res.status(401).json({ error: 'Missing license key.' });
    return;
  }

  const licensePath = `license:${licenseKey}`;
  const record = await redis.hgetall(licensePath);
  if (!record || Object.keys(record).length === 0) {
    res.status(404).json({ error: 'Invalid license key.' });
    return;
  }

  const revoked = record.revoked === 'true' || record.revoked === true;
  const scansUsed = parseInt(record.scansUsed, 10) || 0;
  const scansLimit = parseInt(record.scansLimit, 10) || 0;

  if (revoked) {
    res.status(403).json({ error: 'This key has been revoked.' });
    return;
  }
  if (scansUsed >= scansLimit) {
    res.status(403).json({ error: 'Scan limit reached for this key.' });
    return;
  }

  try {
    const { image, mediaType, prompt } = req.body || {};
    if (!image || !mediaType || !prompt) {
      res.status(400).json({ error: 'Missing image, mediaType, or prompt in request body.' });
      return;
    }

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 700,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: data.error?.message || 'Anthropic API error', raw: data });
      return;
    }

    const newUsed = await redis.hincrby(licensePath, 'scansUsed', 1);

    res.status(200).json({
      ...data,
      license: { scansUsed: newUsed, scansLimit }
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unexpected server error' });
  }
};
