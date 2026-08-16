// GET  /api/admin/keys — list all license keys
// POST /api/admin/keys — create a new license key { label, scansLimit }
const crypto = require('crypto');
const { getRedis } = require('../_lib/redis');
const { checkAdmin } = require('../_lib/auth');

const INDEX_SET = 'licenses:index';

module.exports = async (req, res) => {
  if (!checkAdmin(req, res)) return;

  const redis = getRedis();
  if (!redis) {
    res.status(500).json({ error: 'Server is missing Redis storage credentials. See DEPLOY.md.' });
    return;
  }

  if (req.method === 'GET') {
    const keys = await redis.smembers(INDEX_SET);
    const records = await Promise.all(
      keys.map(async (k) => {
        const r = await redis.hgetall(`license:${k}`);
        return { key: k, ...r };
      })
    );
    records.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    res.status(200).json({ keys: records });
    return;
  }

  if (req.method === 'POST') {
    const { label, scansLimit } = req.body || {};
    const limit = parseInt(scansLimit, 10) || 20;
    const newKey = 'PUN-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    const createdAt = new Date().toISOString();

    await redis.hset(`license:${newKey}`, {
      label: label || '',
      scansLimit: limit,
      scansUsed: 0,
      revoked: 'false',
      createdAt,
    });
    await redis.sadd(INDEX_SET, newKey);

    res.status(200).json({ key: newKey, label: label || '', scansLimit: limit, scansUsed: 0, revoked: 'false', createdAt });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
