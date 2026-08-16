// POST /api/admin/delete — permanently remove a key { key }
const { getRedis } = require('../_lib/redis');
const { checkAdmin } = require('../_lib/auth');

const INDEX_SET = 'licenses:index';

module.exports = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const redis = getRedis();
  if (!redis) {
    res.status(500).json({ error: 'Server is missing Redis storage credentials. See DEPLOY.md.' });
    return;
  }

  const { key } = req.body || {};
  if (!key) {
    res.status(400).json({ error: 'Missing key.' });
    return;
  }

  await redis.del(`license:${key}`);
  await redis.srem(INDEX_SET, key);
  res.status(200).json({ deleted: key });
};
