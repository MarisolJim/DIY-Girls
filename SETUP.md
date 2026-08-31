# Hiding the API key with a proxy

The page no longer contains the API key. Instead it calls a small **proxy**
server that holds the key. This is the only way to keep the key truly hidden —
anything shipped to the browser can be read by whoever opens the page.

```
ai-assistant-builder.html   →   your Worker (holds the key)   →   Anthropic
        (no key)                    worker.js                     api.anthropic.com
```

## Step 0 — rotate the old key first

The old key was visible in the file, so treat it as leaked:
in the [Anthropic Console](https://console.anthropic.com), **revoke it** and
create a **new** key. Use the new one below.

## Step 1 — deploy the proxy (once)

Using the Cloudflare dashboard (no command line needed):

1. Sign in at [dash.cloudflare.com](https://dash.cloudflare.com) →
   **Workers & Pages** → **Create** → **Create Worker**. Name it
   (e.g. `tumo-bot`) and **Deploy**.
2. Click **Edit code**, delete the sample, and paste in all of `worker.js`.
3. In `worker.js`, set `ALLOWED_ORIGINS` to where you open the page
   (see Step 3). **Deploy.**
4. Open **Settings → Variables and Secrets** → add a **secret**:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your new key
   - Save.
5. Copy the Worker's URL, e.g. `https://tumo-bot.yourname.workers.dev`.

## Step 2 — connect the page

Open `ai-assistant-builder.html`, find `PROXY_URL` near the top of the script,
and paste the Worker URL in:

```js
const PROXY_URL = "https://tumo-bot.yourname.workers.dev";
```

## Step 3 — where you open the page (origins)

The Worker only answers requests from addresses in its `ALLOWED_ORIGINS` list.

- **Recommended:** run a local server so the address is stable. In this folder:
  ```bash
  python -m http.server 8000
  ```
  then open `http://localhost:8000/ai-assistant-builder.html`.
  `localhost:8000` is already in the list.
- **Hosted** (GitHub Pages, TUMO server, etc.): add that address to
  `ALLOWED_ORIGINS` and re-deploy the Worker.
- **Opening the file directly** (double-click, `file://`): the browser sends
  origin `"null"`. You'd have to uncomment `"null"` in the list, but that's less
  safe — prefer the local server above.

## Safety extras (recommended)

- Give the key its own **Workspace** with a **hard monthly spend limit** in the
  Anthropic Console — your safety net if anything leaks.
- Add a Cloudflare **Rate Limiting rule** to the Worker (e.g. 20 requests/min
  per IP) to blunt abuse if the URL gets out.

## If something breaks

The page shows errors as a small centered message:

| You see…                                     | Fix                                              |
|----------------------------------------------|--------------------------------------------------|
| "Not connected yet"                          | `PROXY_URL` is still empty in the HTML.           |
| "couldn't sign in to Claude"                 | The key on the Worker is wrong, expired, or missing. |
| "Too many messages right now"                | Rate limit — wait a few seconds.                 |
| "Can't reach the server"                     | Wrong `PROXY_URL`, or you're offline.            |
| "origin is not allowed"                      | Your address isn't in the Worker's `ALLOWED_ORIGINS`. |
