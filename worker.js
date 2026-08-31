/*
  ============================================================
  THE PROXY (Cloudflare Worker)
  ------------------------------------------------------------
  This tiny server holds the secret Anthropic API key so it
  NEVER appears in ai-assistant-builder.html or on any laptop.

  The page sends its messages here; this Worker adds the key
  and forwards them to Claude, then sends the answer back.

  Setup steps are in SETUP.md. The one thing you MUST edit
  here is ALLOWED_ORIGINS below.
  ============================================================
*/

// Which websites may use this Worker. This stops strangers who find the
// Worker URL from spending your budget.
// NOTE: every GitHub Pages site (https://<name>.github.io) is allowed
// automatically by isAllowedOrigin() below, so you do NOT need to add each
// student's page here.
const ALLOWED_ORIGINS = [
  "null",                        // allows opening the .html file directly (double-click)
  "http://localhost:8000",       // when you run a local server
  "http://127.0.0.1:8000",
];

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1000;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    // Browsers send a "preflight" OPTIONS request first. Answer it.
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== "POST") {
      return jsonError("Only POST is allowed here.", 405, cors);
    }

    // Reject any site that isn't allowed (see isAllowedOrigin below).
    if (!isAllowedOrigin(origin)) {
      return jsonError("This origin is not allowed to use this bot.", 403, cors);
    }

    // Make sure the secret key is actually configured on the server.
    if (!env.ANTHROPIC_API_KEY) {
      return jsonError("Server is missing its API key.", 500, cors);
    }

    let incoming;
    try {
      incoming = await request.json();
    } catch (e) {
      return jsonError("Request body was not valid JSON.", 400, cors);
    }

    // Build the request to Anthropic. We cap max_tokens here so a
    // single message can't run up a huge (expensive) response.
    const anthropicBody = {
      model: incoming.model || DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      system: incoming.system,
      messages: incoming.messages,
    };

    let upstream;
    try {
      upstream = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,     // the secret, added server-side
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(anthropicBody),
      });
    } catch (e) {
      return jsonError("Could not reach Claude.", 502, cors);
    }

    // Pass Anthropic's answer straight back, keeping its status code so
    // the page can show the right error (bad key, rate limit, etc.).
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { ...cors, "content-type": "application/json" },
    });
  },
};

// Decide whether a website is allowed to use this Worker.
function isAllowedOrigin(origin) {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow every student's GitHub Pages site (each is https://their-name.github.io).
  try {
    const host = new URL(origin).hostname;
    if (host === "github.io" || host.endsWith(".github.io")) return true;
  } catch (e) {
    // origin wasn't a normal URL (e.g. "null") — handled by the list above.
  }
  return false;
}

function corsHeaders(origin) {
  // Echo the origin back if it's allowed; otherwise send a harmless default.
  const allowed = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function jsonError(message, status, cors) {
  return new Response(JSON.stringify({ error: { message: message } }), {
    status: status,
    headers: { ...cors, "content-type": "application/json" },
  });
}
