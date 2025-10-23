# AI Coding Guidelines for benfusco-portfolio

## Architecture & Layout
- Static multi-page photography site (no bundler). Key entry points live at the project root (`index.html`, `pricing.html`, `contact.html`, booking flows, etc.).
- Global styling is centralized in `styles.css`; page-specific tweaks rely on utility classes rather than duplicating inline styles.
- `main.js` owns navbar behavior (hamburger, dropdowns, scroll state), Instagram slider, service worker registration, and Leaflet map bootstrap. It assumes the markup classes `.menu-toggle`, `.nav-overlay`, `#menu`, `.navbar`, and `.ig-slider` exist—preserve these hooks when editing HTML.
- `carousel/` hosts the reusable FX carousel (`carousel.js`, `carousel.css`). Each `<div class="fx-carousel">` can load images from a folder (`data-src="Images/Wedding"`) or a JSON array embedded in `data-images`. Autoplay, layout, and styling are driven entirely by the data attributes.

## Data & Content Sources
- Image folders under `Images/` may include an `_images.json` file with relative filenames; the carousel loader prefixes the folder path automatically. Supply this JSON whenever filenames are not numeric.
- Booking pages (`booking.html`, `booking.js`) consume session metadata from `booking-data.js` via `window.BK_PACKAGES`. Add new packages there so both the card grid and modal/full calendar stay in sync.
- Contact form posts to Formspree (`formspree.io`) and expects reCAPTCHA markup already in `contact.html`. Keep the honeypot inputs intact.

## Runtime Behavior & Conventions
- Carousels shuffle when `data-shuffle="true"`, pause autoplay on previous navigation, resume on next, and delay autoplay until the viewport is ≥25% visible. Respect those UX rules when composing new carousels.
- Desktop/mobile nav dropdowns rely on `folder-parent` markup with nested `<ul class="folder-child">`. Avoid routing bare `#` links; use `href="#"` only where the JS toggles the dropdown.
- Leaflet assets load lazily via IntersectionObserver inside `index.html`. If you relocate sections, keep `id="map"` and `window.initLeafletMap` wiring intact.
- The home portraits grid uses `.portrait-thumb` hooks for the fullscreen lightbox managed in `main.js`; keep that class on new thumbnails.

## Service Worker & Deployment
- `sw.js` precaches the core shell. Update `SW_VERSION` whenever you change resource filenames or caching strategy so clients pick up the new bundle.
- `netlify.toml` publishes the repo root. No build step is required, but test locally on an HTTP server to exercise the service worker (e.g., `npx serve .`).
- `CNAME` pins the production domain; keep it untouched so static hosting stays mapped.

## Development Workflow Tips
- Run locally with any static server (`npx http-server .` or VS Code Live Server). Avoid `file://` loads because IntersectionObserver + service worker expect http/https.
- When adding JS, prefer plain ES5 compatible code—existing files avoid modules and rely on IIFEs for compatibility with older browsers.
- Lazy loading is already wired (native `loading="lazy"`, IntersectionObserver). Reuse these patterns instead of adding third-party libraries.
- Ensure third-party scripts (Instagram embed, Leaflet) are only loaded once; `main.js` already injects them when their sections enter the viewport.

## Pull Request Expectations
- Verify pages in desktop & mobile breakpoints; the carousel adjusts per `data-per-view` and relies on CSS media queries.
- After editing HTML/JS that touches navigation, carousel, or booking flows, open each relevant page to confirm there are no console warnings.
- Keep assets lightweight; large images should already be exported to web-sized JPG/WebP. Add new ones into the appropriate `Images/` subfolder and update `_images.json` if the carousel must see them.