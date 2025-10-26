Security notes — handling API keys and secrets

What I found
- `contact.html` contains a Google reCAPTCHA "site key":
  - `data-sitekey="6LfxwN8rAAAAAKuiRznbKy3SDpIy-f0zBErTl0M_"`
  - Site keys are meant to be public and are safe to include in client-side markup.
- No other obvious API keys (Stripe, AWS, Google API keys, SendGrid, Mailgun, etc.) were found in HTML/CSS/JS files.
- Some placeholder secret variables exist in `.history/form-handler_*.php` (e.g., `YOUR_RECAPTCHA_SECRET_KEY`) — these are placeholders but should still not be committed with real secrets.
- Formspree form endpoint (`https://formspree.io/f/mqaylyqj`) is present; this is normal for direct client-side Formspree usage.

Recommendations
1) Keep reCAPTCHA secret server-side
   - The site key present in `contact.html` is fine to remain public. The reCAPTCHA *secret* (used to validate tokens) must never be in client-side code.
   - If you currently validate tokens client-side, move verification to a serverless function (example provided in `netlify/functions/verify-recaptcha.js`) and store the secret in an environment variable (`RECAPTCHA_SECRET`).

2) Use environment variables for any server-side secrets
   - Add real secrets to your host's environment (Netlify, Vercel, Cloudflare Workers) via their dashboard or CLI.
   - Locally, use a `.env` file (this repo already ignores `.env` in `.gitignore`). Use `.env.example` as a template.

3) For static hosting (GitHub Pages)
   - You cannot run server-side verification there. Instead:
     - Use Netlify Functions, Vercel Serverless functions, or Cloudflare Workers to verify reCAPTCHA tokens and/or proxy Formspree calls.
     - Alternatively use Formspree’s built-in spam protection or Cloudflare Turnstile which has server-side verification too.

4) Remove any placeholder secrets from commit history
   - The `.history/` folder contains placeholder secrets. If you ever added real secrets and want to purge them, rotate keys and use git filter-branch / BFG to remove them from history.

How to wire the example Netlify function
- Place `netlify/functions/verify-recaptcha.js` (added) and set the environment variable `RECAPTCHA_SECRET` in Netlify dashboard (Site settings → Build & deploy → Environment). Locally, create a `.env` file with `RECAPTCHA_SECRET=...`.
- Call the function from the client after getting the token from `grecaptcha.getResponse()`:
  - POST token to `/.netlify/functions/verify-recaptcha` and check the returned JSON `success` field (same shape as Google response).

If you'd like, I can:
- Wire the contact form JS to call the new serverless function instead of posting secret tokens directly to your server.
- Add an example Netlify config and demo client code to call the function and handle responses.

Summary
- No exposed secret keys found except the public reCAPTCHA site key (which is OK).
- I added a safe example serverless function and `.env.example` to show how to keep secrets server-side.
- Next step: I can update `contact.html`'s client JS to POST tokens to the function and prevent direct secret usage. Tell me if you host on Netlify, Vercel, or another provider and I’ll tailor the instructions.
