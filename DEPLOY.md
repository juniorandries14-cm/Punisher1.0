# Deploying PUNISHER

Files in this folder:
- `index.html` — the client app people use (locked behind a license key)
- `admin.html` — **your** host panel, at `yoursite.vercel.app/admin.html`, for generating/revoking keys
- `api/scan.js` — validates a license key, checks quota, calls Claude's vision model
- `api/key-status.js` — checks whether a key is valid (used by the client's unlock screen)
- `api/admin/keys.js`, `api/admin/revoke.js`, `api/admin/delete.js` — key management, admin-password protected
- `manifest.json`, `icon.svg` — "install as app" support
- `package.json` — declares the one dependency (`@upstash/redis`)

You need three things set up before it fully works: an Anthropic API key, a Redis database (for storing keys), and an admin password of your choosing.

## 1. Get an Anthropic API key
1. console.anthropic.com → sign in → **API Keys** → **Create Key**.
2. Copy it. You'll paste it into Vercel in step 4, never into any file.
3. API usage is billed to this key separately from any claude.ai subscription — check current pricing at docs.claude.com.

## 2. Deploy the folder to Vercel
1. Sign in at vercel.com.
2. Go to **vercel.com/drop**, drag this whole folder in, choose a team + project name, click **Deploy**.
3. You'll get a URL like `your-project.vercel.app`. Note: every drop creates a **new** project — if you update the code later, either drop again (new URL) or connect a GitHub repo instead for a stable URL. Ask me if you want the GitHub version.

## 3. Add Redis (stores your license keys)
1. In your Vercel project, go to the **Storage** tab.
2. Choose **Upstash Redis** from the marketplace and create a database (free tier is enough to start).
3. Connect it to this project — Vercel automatically adds the needed environment variables (`KV_REST_API_URL` / `KV_REST_API_TOKEN` or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` depending on the integration). You don't need to copy these by hand.

## 4. Set your remaining environment variables
Go to **Project → Settings → Environment Variables** and add:
| Key | Value |
|---|---|
| `ANTHROPIC_API_KEY` | the key from step 1 |
| `ADMIN_PASSWORD` | any password you choose — this protects `/admin.html` and the admin API routes |

Apply both to Production (and Preview if you want).

## 5. Redeploy
Environment variables only apply to deployments made after you add them.
Go to **Deployments → ⋯ → Redeploy**.

## 6. Generate your first key
1. Open `your-project.vercel.app/admin.html`.
2. Enter the `ADMIN_PASSWORD` you set in step 4.
3. Fill in a label (e.g. a person's name) and a scan limit, click **Generate Key**.
4. Copy the generated key (looks like `PUN-A1B2C3D4E5F6`) and send it to that person along with the main site link: `your-project.vercel.app`.

## 7. What people you give it to see
They open `your-project.vercel.app`, get an "Enter Access Key" screen, paste in the key you gave them, and are in. Their scan usage counts against the limit you set for their key. You can revoke or delete any key at any time from `/admin.html` — revoking is instant on their next scan attempt.

## Notes
- Keep `/admin.html`'s URL and your `ADMIN_PASSWORD` private — anyone with both can generate and revoke keys.
- Each scan costs Anthropic API credits billed to your key — keep an eye on usage in the Anthropic console as you hand out more keys.
- If you'd rather deploy on Netlify or elsewhere, the same logic works with minor syntax changes to the `/api` functions — say the word and I'll convert it.
