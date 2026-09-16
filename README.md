# DIY Girls — AI Assistant Builder

A beginner-friendly coding project where students build and customize their own
AI chatbot. The entire app is a single `index.html` file: students edit colors,
fonts, and the assistant's personality, then chat with a real AI powered by Claude.

The secret API key never lives in this file. Instead, the page sends messages to a
small **proxy server** (a Cloudflare Worker) that adds the key on its end and
forwards the request to Claude. That means the page can be shared publicly without
exposing the key.

## What students learn

- Editing HTML, CSS variables, and reading through JavaScript
- How a web page talks to a server (`fetch`, JSON, request/response)
- What a **system prompt** is and how it shapes an AI's behavior
- Why secret keys belong on a server, not in front-end code

## Files

| File            | Purpose                                              |
| --------------- | ---------------------------------------------------- |
| `index.html`    | The whole app — HTML, CSS, and JavaScript in one file |
| `.gitattributes`| Git line-ending normalization                        |

## How it works

1. The student fills in the **Assistant Name**, **System Prompt**, and **Welcome
   Message** in the configuration panel.
2. When they type a message and click **Send**, the page posts the conversation to
   `PROXY_URL`.
3. The proxy attaches the secret API key and calls the Claude API, then returns the
   reply.
4. The assistant's response is rendered in the chat (Markdown is formatted using
   [marked](https://github.com/markedjs/marked), loaded from a CDN).

The proxy URL is set once near the top of the `<script>` section:

```js
const PROXY_URL = "https://diy-girls-bot.<your-worker>.workers.dev";
```

## Running it

No build step and no dependencies to install — it's a plain HTML page.

- **Quickest:** double-click `index.html` to open it in a browser.
- **Recommended:** serve it locally so everything behaves like the real site:

  ```bash
  python -m http.server 8000
  ```

  Then visit `http://localhost:8000`.

An internet connection is required — the page loads Google Fonts and the marked
library from a CDN, and it needs to reach the proxy to talk to the AI.

## Customizing your assistant

Look for the comment blocks marked **`STUDENTS:`** in `index.html`:

- **Colors & fonts** — the `:root` CSS variables near the top (`--primary-color`,
  `--background`, `--bot-face`, and more).
- **Header** — the title and "Built by" line in the `<div class="header">` block.
- **Personality** — set the **System Prompt** in the running page to tell the
  assistant how to behave.

You can also swap the robot emoji face (`--bot-face`) for your own image by following
the commented instructions in the CSS.

## Setting up the proxy (for instructors)

The chatbot needs a proxy so the Claude API key stays private. A Cloudflare Worker
is a good fit: it receives the JSON body from the page, adds the `x-api-key` header,
forwards the request to the Claude API, and returns the response (with CORS headers
so the browser can read it). Once deployed, paste the Worker's URL into `PROXY_URL`.

## Notes

- The page currently requests the `claude-sonnet-4-6` model — update the `model`
  field in `sendMessage()` if you want a different one.
- Errors are handled gracefully in the chat (bad key, rate limits, network issues),
  so students get a friendly message instead of a blank screen.
