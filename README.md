# Ben Fusco Media

Static photography, video, and creative-media website for `benfusco.com`, designed for GitHub Pages.

## Temporary coming-soon gate

The public build currently loads `site-gate.js` on every root HTML page. It displays a "Coming soon" screen and uses a session-only client-side password check for casual preview access. Because GitHub Pages is static hosting, this is not secure access control: the source files and assets remain publicly downloadable. `robots.txt` temporarily blocks crawling while the gate is active. Remove the gate script references, restore `robots.txt`, and bump the service-worker version before the public launch.

## Booking system

The website uses a request-first booking flow:

1. The client chooses a service or package.
2. The client chooses a preferred date and time.
3. Service-specific details and contact information are collected.
4. The client reviews a versioned booking-request acknowledgement and selects a separate optional portfolio preference.
5. The request is submitted through the configured Formspree endpoint. No signature or payment is collected at this stage.
6. A reference number, next steps, tentative calendar hold, and change-request link are shown.

A selected time is deliberately described as a request until Ben Fusco Media approves it. This keeps the GitHub Pages site honest because it does not have a private server or calendar database that can lock appointment slots.

## Before accepting public bookings

- Sign in to the Formspree account that owns form `mqaylyqj` and confirm delivery to `contact@benfusco.com`.
- Submit one test request for every service category.
- Have separate final consumer and business agreements reviewed by an Ontario or Quebec lawyer, including a French version where required.
- Confirm applicable taxes and the final client-specific payment method before sending an agreement. Real-estate defaults are now: first 50 km round trip included, CA$0.70/km afterward, no standard retainer, payment before full-resolution release, optional Net 7 for approved brokerages, and the reviewed cancellation tiers documented in `REAL_ESTATE_AGREEMENT_HANDOFF.md`.
- Never request a property lockbox code through the public form.

Package definitions and shared booking settings live in `booking-data.js`.

## Final pre-test additions

- The Contact page submits through the same configured Formspree endpoint and includes validation, spam honeypot, success, and retry states.
- `privacy.html` explains contact, booking-draft, acknowledgement, and third-party handling.
- `404.html` provides a branded GitHub Pages error page.
- `Images/social-preview.jpg` is the 1200×630 sharing card used by public pages.
- Homepage structured data identifies the business, service area, contact details, and service catalogue.
- The legacy concert image over 9 MB was reduced to a web-appropriate size without changing its filename or gallery reference.
