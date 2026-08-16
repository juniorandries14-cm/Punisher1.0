// Simple admin auth: compares the x-admin-password header against the
// ADMIN_PASSWORD environment variable set in Vercel project settings.
function checkAdmin(req, res) {
  const provided = req.headers['x-admin-password'];
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    res.status(500).json({ error: 'Server is missing ADMIN_PASSWORD. Add it in Vercel → Settings → Environment Variables, then redeploy.' });
    return false;
  }
  if (!provided || provided !== expected) {
    res.status(401).json({ error: 'Invalid admin password.' });
    return false;
  }
  return true;
}

module.exports = { checkAdmin };
