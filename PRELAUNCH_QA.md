# Pre-launch QA — July 27, 2026

## Passed locally

- Homepage images, curated gallery, six-set featured slideshow, pause control, and service-radius map
- Desktop navigation and mobile menu
- Portfolio category filters, empty-category state, load-more control, lightbox, and close control
- Services, Team, About, Contact, Privacy, 404, booking receipt, and booking-management pages
- Real-estate packages at CA$350, CA$550, and CA$695
- Real-estate language for 50 final images total, including drone photos and one basic 2D floor plan
- Booking flow through package, requested date/time, client details, review, preparation checklist, and request acknowledgement
- Mobile layouts at 390 × 844 with no page-level horizontal overflow
- No broken local HTML, stylesheet, script, or image references detected on the primary pages
- JavaScript syntax checks passed

## Intentionally not submitted during QA

- The final Contact and Booking requests were not sent to Formspree, to avoid creating fake customer messages. Send one clearly labelled test submission from each form before launch and verify delivery to `contact@benfusco.com`.

## Before publishing

- Have the final client agreements reviewed by a qualified Quebec/Ontario lawyer and prepare the legally required French version or presentation process for Quebec clients.
- Test the GitHub Pages preview in Safari, Chrome, and a physical phone.
- Confirm Formspree ownership, notification delivery, and spam controls.
- Replace or add portfolio images for categories that currently show the intentional “coming soon” state.
- Push the complete project, including `CNAME`, `.nojekyll`, `404.html`, and the `Images` directory, to the GitHub Pages branch.
