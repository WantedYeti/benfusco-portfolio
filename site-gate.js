(() => {
  'use strict';

  // Keep the preview gate ready for future private updates without showing it publicly.
  const SITE_GATE_ENABLED = false;
  if (!SITE_GATE_ENABLED) return;

  const SESSION_KEY = 'bfm-preview-access-v1';
  const PASSWORD_HASH = '6cbefd8960d511540f34779628ef4e5a55b758d3be5749cd8878a09b348c052b';
  const root = document.documentElement;

  try {
    if (sessionStorage.getItem(SESSION_KEY) === 'granted') return;
  } catch (_) {
    // Continue with the gate when storage is unavailable.
  }

  root.classList.add('site-gate-pending');

  const style = document.createElement('style');
  style.id = 'site-gate-styles';
  style.textContent = `
    html.site-gate-pending body { visibility: hidden !important; }
    html.site-gate-locked,
    html.site-gate-locked body { min-height: 100%; overflow: hidden !important; }
    html.site-gate-locked body { margin: 0; background: #0d0d0d; }
    html.site-gate-locked body > :not(#site-access-gate) { display: none !important; }
    #site-access-gate,
    #site-access-gate * { box-sizing: border-box; }
    #site-access-gate {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: grid;
      place-items: center;
      min-height: 100svh;
      padding: 32px;
      overflow: auto;
      color: #f7f3ed;
      background:
        linear-gradient(90deg, rgba(8, 8, 8, .9), rgba(8, 8, 8, .62)),
        url('Images/Desktop/Weddings/Max and Taylor/14-2M2A4891.jpg') center 42% / cover no-repeat;
      font-family: Montserrat, Arial, sans-serif;
    }
    .site-gate-panel {
      width: min(100%, 540px);
      padding: clamp(38px, 7vw, 72px);
      text-align: center;
      border: 1px solid rgba(247, 243, 237, .3);
      background: rgba(13, 13, 13, .82);
      box-shadow: 0 28px 90px rgba(0, 0, 0, .38);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }
    .site-gate-brand,
    .site-gate-kicker,
    .site-gate-note {
      margin: 0;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .32em;
      text-transform: uppercase;
    }
    .site-gate-brand { color: #f7f3ed; }
    .site-gate-brand span {
      display: block;
      margin-top: 8px;
      font-size: 8px;
      letter-spacing: .5em;
      color: #b8b1a8;
    }
    .site-gate-rule {
      width: 44px;
      height: 1px;
      margin: 32px auto;
      background: rgba(247, 243, 237, .45);
    }
    .site-gate-kicker { margin-bottom: 18px; color: #b8b1a8; }
    .site-gate-title {
      margin: 0;
      font-family: 'Bodoni Moda', Georgia, serif;
      font-size: clamp(48px, 8vw, 76px);
      font-weight: 500;
      line-height: .98;
      letter-spacing: -.04em;
    }
    .site-gate-message {
      margin: 20px 0 30px;
      color: #d5cfc7;
      font-size: 13px;
      line-height: 1.7;
    }
    .site-gate-form { display: grid; gap: 12px; }
    .site-gate-input {
      width: 100%;
      min-height: 52px;
      padding: 0 18px;
      color: #f7f3ed;
      border: 1px solid rgba(247, 243, 237, .4);
      border-radius: 0;
      outline: 0;
      background: rgba(0, 0, 0, .28);
      font: 600 14px Montserrat, Arial, sans-serif;
      letter-spacing: .08em;
    }
    .site-gate-input::placeholder { color: #a9a39b; }
    .site-gate-input:focus { border-color: #f7f3ed; box-shadow: 0 0 0 1px #f7f3ed; }
    .site-gate-submit {
      min-height: 52px;
      padding: 0 22px;
      color: #111;
      border: 1px solid #fbfaf7;
      background: #fbfaf7;
      cursor: pointer;
      font: 700 9px Montserrat, Arial, sans-serif;
      letter-spacing: .24em;
      text-transform: uppercase;
      transition: background .2s ease, color .2s ease;
    }
    .site-gate-submit:hover,
    .site-gate-submit:focus-visible { color: #fbfaf7; background: transparent; }
    .site-gate-error {
      min-height: 18px;
      margin: 2px 0 0;
      color: #e8b4ab;
      font-size: 11px;
      line-height: 1.5;
    }
    .site-gate-note { margin-top: 24px; color: #8f8982; font-size: 7px; }
    @media (max-width: 600px) {
      #site-access-gate {
        padding: 20px;
        background:
          linear-gradient(rgba(8, 8, 8, .66), rgba(8, 8, 8, .9)),
          url('Images/Mobile/Weddings/Max and Taylor/14-2M2A4891.jpg') center 35% / cover no-repeat;
      }
      .site-gate-panel { padding: 42px 26px; }
      .site-gate-title { font-size: clamp(48px, 15vw, 64px); }
    }
    @media (prefers-reduced-motion: reduce) {
      .site-gate-submit { transition: none; }
    }
  `;
  document.head.appendChild(style);

  function hex(buffer) {
    return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function digest(value) {
    const data = new TextEncoder().encode(value);
    return hex(await crypto.subtle.digest('SHA-256', data));
  }

  function mountGate() {
    if (document.getElementById('site-access-gate')) return;

    const gate = document.createElement('main');
    gate.id = 'site-access-gate';
    gate.setAttribute('aria-labelledby', 'site-gate-title');
    gate.innerHTML = `
      <section class="site-gate-panel">
        <p class="site-gate-brand">Fusco<span>Media</span></p>
        <div class="site-gate-rule" aria-hidden="true"></div>
        <p class="site-gate-kicker">Private preview</p>
        <h1 class="site-gate-title" id="site-gate-title">Coming soon.</h1>
        <p class="site-gate-message">Please be patient.</p>
        <form class="site-gate-form" novalidate>
          <label class="site-gate-kicker" for="site-gate-password">Password</label>
          <input class="site-gate-input" id="site-gate-password" name="password" type="password" autocomplete="current-password" required>
          <button class="site-gate-submit" type="submit">Enter preview</button>
          <p class="site-gate-error" role="status" aria-live="polite"></p>
        </form>
        <p class="site-gate-note">Founded by Ben Fusco &middot; Ottawa &amp; Gatineau</p>
      </section>
    `;

    document.body.prepend(gate);
    root.classList.remove('site-gate-pending');
    root.classList.add('site-gate-locked');

    const form = gate.querySelector('form');
    const input = gate.querySelector('input');
    const error = gate.querySelector('.site-gate-error');

    form.addEventListener('submit', async event => {
      event.preventDefault();
      error.textContent = '';

      try {
        if (await digest(input.value) === PASSWORD_HASH) {
          try { sessionStorage.setItem(SESSION_KEY, 'granted'); } catch (_) {}
          root.classList.remove('site-gate-locked');
          gate.remove();
          style.remove();
          return;
        }
      } catch (_) {
        // Treat hashing failures the same as an incorrect password.
      }

      input.value = '';
      input.setAttribute('aria-invalid', 'true');
      error.textContent = 'That password is not correct. Please try again.';
      input.focus();
    });

    input.addEventListener('input', () => input.removeAttribute('aria-invalid'));
    input.focus({ preventScroll: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountGate, { once: true });
  } else {
    mountGate();
  }
})();
