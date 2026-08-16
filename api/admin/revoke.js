// POST /api/admin/revoke — toggle a key's revoked state { key, revoked }
const { getRedis } = require('../_lib/redis');
const { checkAdmin } = require('../_lib/auth');

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

  const { key, revoked } = req.body || {};
  if (!key) {
    res.status(400).json({ error: 'Missing key.' });
    return;
  }

  const exists = await redis.exists(`license:${key}`);
  if (!exists) {
    res.status(404).json({ error: 'Key not found.' });
    return;
  }

  await redis.hset(`license:${key}`, { revoked: revoked ? 'true' : 'false' });
  res.status(200).json({ key, revoked: !!revoked });
};
