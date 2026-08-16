// GET /api/key-status — checks a license key's validity + remaining scans
// without consuming a scan. Called on page load once a key is saved locally.
const { getRedis } = require('./_lib/redis');

module.exports = async (req, res) => {
  const redis = getRedis();
  if (!redis) {
    res.status(500).json({ error: 'Server is missing Redis storage credentials. See DEPLOY.md.' });
    return;
  }

  const key = req.headers['x-license-key'];
  if (!key) {
    res.status(400).json({ error: 'Missing license key.' });
    return;
  }

  const record = await redis.hgetall(`license:${key}`);
  if (!record || Object.keys(record).length === 0) {
    res.status(404).json({ valid: false, error: 'Key not found.' });
    return;
  }

  const revoked = record.revoked === 'true' || record.revoked === true;
  const scansUsed = parseInt(record.scansUsed, 10) || 0;
  const scansLimit = parseInt(record.scansLimit, 10) || 0;

  res.status(200).json({
    valid: !revoked && scansUsed < scansLimit,
    revoked,
    label: record.label || '',
    scansUsed,
    scansLimit,
  });
};
