// Shared Redis client. Vercel's Upstash integration names its env vars
// differently depending on how it was connected, so we check every
// known naming pattern rather than relying on just one.
const { Redis } = require('@upstash/redis');

let client = null;
function getRedis() {
  if (client) return client;

  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.REDIS_URL;
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_READ_ONLY_TOKEN;

  if (!url || !token) {
    client = null;
    return null;
  }

  try {
    client = new Redis({ url, token });
  } catch (e) {
    client = null;
  }
  return client;
}

module.exports = { getRedis };
