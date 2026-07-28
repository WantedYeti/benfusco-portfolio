# Booking handoff

## Complete in this build

- Portrait, wedding, real-estate, business, event, drone, and custom-project paths
- Package filtering and package summaries
- Preferred date and time selection in Eastern Time
- Service-specific questions and validation
- Save-and-return on the same browser
- Review step and preparation reminders
- Versioned booking-request acknowledgement for every service
- Real-estate service standards covering delivery, revisions, source files, archive, 360 hosting, drone operation and listing-media licensing
- Optional marketing permission
- Client mailing address, province, final-agreement language preference and real-estate authority fields
- No payment or final-agreement signature collected through the public request form
- Real-estate defaults for included travel, CA$0.70/km excess travel, no standard retainer, payment before full-resolution release, approved-brokerage Net 7 terms, and jurisdiction-aware cancellation handling
- Clear preliminary-price and request-status language
- Duplicate-submit prevention
- Formspree delivery, honeypot spam field, and retry state
- Booking reference and receipt page
- Tentative Google Calendar link and `.ics` download
- Reschedule, update, cancellation, and question-request form
- Desktop and mobile layouts

## External activation still required

The current production host is GitHub Pages. GitHub Pages cannot privately store bookings or read Ben's calendar. The request-first workflow therefore avoids claiming live availability or confirmation.

To add live slot locking, automatic status changes, private document storage, or automatic reminders later, connect a database and server-side service. Those features cannot be made operational from static files alone.

The form endpoint configured in `booking-data.js` is `https://formspree.io/f/mqaylyqj`. Confirm ownership and notification settings in Formspree before public use.
