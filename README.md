# DewBox

Video editor portfolio site. Uploads go to YouTube as **unlisted**, site fetches and displays them with tags/details. No separate database — tags live in YouTube's native video tags field.

## Stack
- Static HTML/CSS/JS (Tailwind via CDN) — `public/`
- Cloudflare Pages Functions (API routes) — `functions/`
- Cloudflare KV — stores the YouTube OAuth refresh token
- YouTube Data API v3 — upload, list, playlist

## One-time setup

### 1. Google Cloud OAuth
1. Go to [console.cloud.google.com](https://console.cloud.google.com), create/select a project.
2. Enable **YouTube Data API v3** (APIs & Services → Library).
3. APIs & Services → Credentials → Create OAuth client ID → type **Web application**.
4. Add authorized redirect URI: `https://<your-pages-domain>/api/auth/callback` (and a `http://localhost:8788/api/auth/callback` for local dev).
5. Note the **Client ID** and **Client Secret**.
6. OAuth consent screen: add her Google account as a test user (or publish app) so login works.

### 2. Cloudflare KV namespace
```
npx wrangler kv namespace create TOKENS
```
Copy the returned `id` into `wrangler.toml` under `[[kv_namespaces]]`.

### 3. Environment variables / secrets
Local dev — create `.dev.vars` (gitignored):
```
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
OAUTH_REDIRECT_URI=http://localhost:8788/api/auth/callback
```

Production — set via Cloudflare dashboard (Pages project → Settings → Environment variables) or:
```
npx wrangler pages secret put GOOGLE_CLIENT_ID
npx wrangler pages secret put GOOGLE_CLIENT_SECRET
npx wrangler pages secret put OAUTH_REDIRECT_URI
```
`OAUTH_REDIRECT_URI` in production = `https://<your-pages-domain>/api/auth/callback`.

### 4. Run locally
```
npm run dev
```
Visit `http://localhost:8788/upload.html`, click Connect, authorize her channel once.

### 5. Deploy to Cloudflare Pages
```
npm run deploy
```
Or connect the repo in the Cloudflare dashboard for git-based auto-deploys.

## How it works
- **Connect**: `/api/auth/start` → Google consent → `/api/auth/callback` stores refresh token in KV.
- **Upload**: `upload.html` posts to `/api/upload`, which does a resumable upload to YouTube with `privacyStatus: unlisted`. Tags entered in the form become the video's YouTube tags.
- **Gallery**: `index.html` calls `/api/videos`, which refreshes the access token, lists her uploads playlist, and returns title/description/tags/thumbnail per video. Filter buttons are generated from tags found across videos. Auto-refreshes every 30s.
- **Watch**: clicking a card opens an embedded player modal; "Watch on YouTube" link opens the real unlisted URL.
