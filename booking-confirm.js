(function () {
  'use strict';

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  window.addEventListener('pageshow', () => window.scrollTo(0, 0), { once: true });

  const packages = window.BK_PACKAGES || {};
  const settings = window.BK_SETTINGS || {};
  const serviceStandards = window.BK_SERVICE_STANDARDS || {};
  const params = new URLSearchParams(location.search);
  const packageId = params.get('pkg');
  const requestedDate = params.get('date');
  const requestedTime = params.get('time');
  const pkg = packages[packageId];
  if (!pkg || !/^\d{4}-\d{2}-\d{2}$/.test(requestedDate || '') || !requestedTime) {
    location.replace('booking.html');
    return;
  }

  const form = document.getElementById('bookingForm');
  const serviceFields = document.getElementById('serviceFields');
  const draftKey = `bfmBookingDraft:${packageId}:${requestedDate}:${requestedTime}`;
  let currentStep = 'details';
  let submitting = false;

  const money = (value) => value === null || value === undefined ? 'Custom quote' : `CA$${Number(value).toLocaleString('en-CA', { maximumFractionDigits: 0 })}`;
  const balance = pkg.price === null ? null : Math.max(0, pkg.price - (pkg.deposit || 0));
  const localDate = (() => { const [y, m, d] = requestedDate.split('-').map(Number); return new Date(y, m - 1, d); })();
  const formattedDate = localDate.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  }

  function realEstateAddonsHTML() {
    const addons = window.BK_ADDONS?.['real-estate'] || [];
    if (!addons.length) return '';
    return `<details class="addon-picker" open>
      <summary><span><strong>Optional enhancements</strong><small>Add only what supports this listing.</small></span><span class="addon-count" id="addonCount">0 selected</span></summary>
      <div class="addon-grid">${addons.map((item) => {
        const addon = typeof item === 'string' ? { name: item, description: '', priceLabel: 'Custom quote' } : item;
        return `<label class="addon-card">
          <input type="checkbox" name="addOns" value="${escapeHTML(addon.name)}">
          <span class="addon-check" aria-hidden="true">✓</span>
          <span class="addon-copy"><strong>${escapeHTML(addon.name)}</strong><small>${escapeHTML(addon.description)}</small></span>
          <span class="addon-price">${escapeHTML(addon.priceLabel || 'Custom quote')}</span>
        </label>`;
      }).join('')}</div>
      <p class="addon-selection" id="addonSelection" role="status" aria-live="polite">No optional enhancements selected.</p>
    </details>`;
  }

  function makeReference() {
    const datePart = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    const bytes = new Uint8Array(3);
    if (crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else bytes.forEach((_, index) => { bytes[index] = Math.floor(Math.random() * 256); });
    return `BFM-${datePart}-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  }

  const reference = makeReference();
  const back = document.getElementById('confirmBack');
  back.href = `booking.html?pkg=${encodeURIComponent(packageId)}&date=${requestedDate}&time=${encodeURIComponent(requestedTime)}`;

  document.getElementById('bookingReference').value = reference;
  document.getElementById('hiddenPackageId').value = pkg.id;
  document.getElementById('hiddenService').value = pkg.service;
  document.getElementById('hiddenPackageTitle').value = pkg.title;
  document.getElementById('hiddenDate').value = requestedDate;
  document.getElementById('hiddenTime').value = requestedTime;
  document.getElementById('hiddenPrice').value = pkg.price === null ? 'Custom quote' : money(pkg.price);
  document.getElementById('hiddenRetainer').value = pkg.category === 'real-estate'
    ? 'No standard retainer — payment terms confirmed in final agreement'
    : pkg.deposit ? `Preliminary ${money(pkg.deposit)} — not due through request form` : 'Not required for inquiry';
  document.getElementById('requestAcknowledgementVersion').value = settings.requestAcknowledgementVersion || 'BFM-REQUEST-DRAFT';

  document.getElementById('sidebarImage').src = pkg.image;
  document.getElementById('sidebarImage').alt = `${pkg.title} preview`;
  document.getElementById('sidebarCode').textContent = pkg.code;
  document.getElementById('sidebarTitle').textContent = pkg.title;
  document.getElementById('sidebarDate').textContent = formattedDate;
  document.getElementById('sidebarTime').textContent = `${requestedTime} · Eastern Time`;
  document.getElementById('sidebarPrice').textContent = money(pkg.price);
  document.getElementById('sidebarRetainer').textContent = 'None';
  document.getElementById('sidebarBalance').textContent = 'Confirmed in final quote';

  function fieldTemplates() {
    const templates = {
      portrait: `
        <label class="field"><span>Session type *</span><select name="sessionType" required><option value="">Choose one</option><option>Individual portrait</option><option>Couple</option><option>Family</option><option>Personal branding</option><option>Fitness</option><option>Other</option></select></label>
        <label class="field"><span>Number of participants *</span><input name="participantCount" type="number" min="1" max="30" inputmode="numeric" required></label>
        <label class="field"><span>Preferred location *</span><input name="preferredLocation" placeholder="Location or neighbourhood" required></label>
        <label class="field"><span>Setting *</span><select name="setting" required><option value="">Choose one</option><option>Outdoor</option><option>Indoor</option><option>Studio</option><option>Open to suggestions</option></select></label>
        <label class="field"><span>Children or pets attending?</span><select name="childrenPets"><option>No</option><option>Children</option><option>Pets</option><option>Children and pets</option></select></label>
        <label class="field"><span>Style or mood</span><input name="styleMood" placeholder="Natural, editorial, energetic…"></label>`,
      'real-estate': `
        <label class="field"><span>You are the… *</span><select name="clientRole" required><option value="">Choose one</option><option>Realtor</option><option>Homeowner</option><option>Builder</option><option>Property manager</option><option>Rental host</option><option>Other</option></select></label>
        <label class="field"><span>Brokerage or company legal name</span><input name="brokerageLegalName" autocomplete="organization" placeholder="If applicable"></label>
        <label class="field full"><span>Your authority for this request *</span><select name="bookingAuthority" required><option value="">Choose one</option><option>I own the property</option><option>I am the authorized listing agent or broker</option><option>I am authorized by the property owner</option><option>I am authorized by the property manager or builder</option><option>I need to confirm authority before the shoot</option></select><small>The final agreement will identify who may authorize access and licence the resulting media.</small></label>
        <label class="field"><span>Property type *</span><select name="propertyType" required><option value="">Choose one</option><option>Detached home</option><option>Townhouse</option><option>Condo</option><option>Multi-unit property</option><option>Commercial property</option><option>Vacant land</option><option>Other</option></select></label>
        <label class="field full"><span>Property address *</span><input name="propertyAddress" autocomplete="street-address" required></label>
        <label class="field"><span>Approximate square footage *</span><input name="squareFootage" type="number" min="1" max="50000" inputmode="numeric" required><small>Base package pricing applies up to 2,500 sq. ft.</small></label>
        <label class="field"><span>Occupancy *</span><select name="occupancy" required><option value="">Choose one</option><option>Vacant</option><option>Owner occupied</option><option>Tenant occupied</option><option>New construction</option></select></label>
        <label class="field"><span>Bedrooms</span><input name="bedrooms" type="number" min="0" max="50" inputmode="numeric"></label>
        <label class="field"><span>Bathrooms</span><input name="bathrooms" type="number" min="0" max="50" step="0.5" inputmode="decimal"></label>
        <label class="field"><span>Number of levels</span><input name="levels" type="number" min="1" max="20" inputmode="numeric"></label>
        <label class="field"><span>Preferred listing date</span><input name="listingDate" type="date"></label>
        <label class="field full"><span>Access arrangements *</span><input name="accessArrangement" placeholder="Owner present, agent present, lockbox shared later…" required><small>For security, do not enter a lockbox code here. Share it directly after the booking is approved.</small></label>
        <label class="field full"><span>Features to highlight</span><textarea name="propertyFeatures" rows="3" placeholder="Renovated kitchen, water view, large yard…"></textarea></label>
        <label class="check-row full"><input type="checkbox" name="propertyAccessConfirmation" value="Confirmed" required><span>I confirm that I have, or will obtain before the appointment, the legal authority and permissions needed for Ben Fusco Media to enter and capture the property, exterior and requested aerial media. *</span></label>
        ${realEstateAddonsHTML()}`,
      'wedding-inquiry': `
        <label class="field full"><span>Partner or couple names *</span><input name="coupleNames" required></label>
        <label class="field"><span>Ceremony venue or city *</span><input name="ceremonyVenue" required></label>
        <label class="field"><span>Reception venue or city *</span><input name="receptionVenue" required></label>
        <label class="field"><span>Ceremony time</span><input name="ceremonyTime" type="time"></label>
        <label class="field"><span>Estimated guest count</span><input name="guestCount" type="number" min="1" max="2000" inputmode="numeric"></label>
        <label class="field"><span>Coverage needed *</span><select name="coverageType" required><option value="">Choose one</option><option>Photography</option><option>Video</option><option>Photography and video</option><option>Not sure yet</option></select></label>
        <label class="field"><span>Estimated coverage length</span><select name="coverageLength"><option>Not sure yet</option><option>4 hours</option><option>6 hours</option><option>8 hours</option><option>10+ hours</option></select></label>
        <label class="field"><span>First look?</span><select name="firstLook"><option>Undecided</option><option>Yes</option><option>No</option></select></label>
        <label class="field"><span>Interested in a second photographer?</span><select name="secondPhotographer"><option>Undecided</option><option>Yes</option><option>No</option></select></label>
        <label class="field"><span>Interested in drone coverage?</span><select name="droneInterest"><option>Undecided</option><option>Yes</option><option>No</option></select></label>
        <label class="field"><span>Planner contact</span><input name="plannerContact"></label>`,
      'business-social': `
        <label class="field"><span>Business name *</span><input name="businessName" required></label>
        <label class="field"><span>Industry *</span><input name="industry" required></label>
        <label class="field"><span>Content needed *</span><select name="mediaType" required><option value="">Choose one</option><option>Photography</option><option>Video</option><option>Photography and video</option><option>Ongoing content</option></select></label>
        <label class="field"><span>Primary platform *</span><select name="primaryPlatform" required><option value="">Choose one</option><option>Website</option><option>Instagram / Facebook</option><option>TikTok</option><option>LinkedIn</option><option>Paid advertising</option><option>Multiple platforms</option></select></label>
        <label class="field full"><span>Deliverables you need *</span><textarea name="deliverables" rows="3" required placeholder="For example: 25 photos and three vertical reels"></textarea></label>
        <label class="field"><span>Project location *</span><input name="projectLocation" required></label>
        <label class="field"><span>Deadline</span><input name="deadline" type="date"></label>
        <label class="field full"><span>Brand or campaign direction</span><textarea name="brandDirection" rows="3"></textarea></label>`,
      'events-concerts': `
        <label class="field"><span>Event name *</span><input name="eventName" required></label>
        <label class="field"><span>Event type *</span><input name="eventType" placeholder="Concert, launch, conference…" required></label>
        <label class="field full"><span>Venue and address *</span><input name="venueAddress" required></label>
        <label class="field"><span>Event start time *</span><input name="eventStart" type="time" required></label>
        <label class="field"><span>Event end time *</span><input name="eventEnd" type="time" required></label>
        <label class="field"><span>Estimated attendance</span><input name="attendance" type="number" min="1" max="100000" inputmode="numeric"></label>
        <label class="field"><span>Coverage needed *</span><select name="coverageType" required><option value="">Choose one</option><option>Photography</option><option>Video</option><option>Photography and video</option></select></label>
        <label class="field"><span>Stage or media access</span><select name="stageAccess"><option>Not applicable</option><option>Confirmed</option><option>Pending</option><option>Needs discussion</option></select></label>
        <label class="field full"><span>Required deliverables *</span><textarea name="deliverables" rows="3" required></textarea></label>
        <label class="field"><span>Delivery deadline</span><input name="deadline" type="date"></label>`,
      'drone-aerial': `
        <label class="field"><span>Project type *</span><input name="projectType" placeholder="Property, venue, construction…" required></label>
        <label class="field"><span>Photos or video? *</span><select name="mediaType" required><option value="">Choose one</option><option>Photos</option><option>Video</option><option>Photos and video</option></select></label>
        <label class="field full"><span>Flight location or address *</span><input name="flightLocation" required></label>
        <label class="field"><span>Approximate site size</span><input name="siteSize"></label>
        <label class="field"><span>Weather flexibility *</span><select name="weatherFlexibility" required><option value="">Choose one</option><option>Flexible by several days</option><option>Backup date available</option><option>Fixed event date</option></select></label>
        <label class="field full"><span>Project purpose and deliverables *</span><textarea name="deliverables" rows="3" required></textarea></label>
        <label class="field"><span>Property access or permission confirmed?</span><select name="sitePermission"><option>Yes</option><option>Pending</option><option>Not sure</option></select></label>
        <label class="field"><span>Known hazards or restrictions</span><input name="knownRestrictions" placeholder="Power lines, airport, crowds…"></label>`,
      'custom-project': `
        <label class="field"><span>Project type *</span><input name="projectType" required></label>
        <label class="field"><span>Project location *</span><input name="projectLocation" required></label>
        <label class="field full"><span>What would you like to create? *</span><textarea name="projectGoals" rows="4" required></textarea></label>
        <label class="field full"><span>Desired deliverables *</span><textarea name="deliverables" rows="3" required></textarea></label>
        <label class="field"><span>Deadline</span><input name="deadline" type="date"></label>
        <label class="field"><span>Estimated budget</span><select name="budgetRange"><option value="">Prefer not to say</option><option>Under CA$500</option><option>CA$500–1,000</option><option>CA$1,000–2,500</option><option>CA$2,500+</option></select></label>`
    };
    if (pkg.category === 'portrait') return templates.portrait;
    if (pkg.category === 'real-estate') return templates['real-estate'];
    return templates[pkg.id] || templates['custom-project'];
  }

  document.getElementById('projectLegend').textContent = `${pkg.service} details`;
  serviceFields.innerHTML = fieldTemplates();

  function updateAddonSummary() {
    const inputs = Array.from(form.querySelectorAll('input[name="addOns"]'));
    const selection = document.getElementById('addonSelection');
    const count = document.getElementById('addonCount');
    if (!inputs.length || !selection || !count) return;
    const selected = inputs.filter((input) => input.checked).map((input) => input.value);
    inputs.forEach((input) => input.closest('.addon-card')?.classList.toggle('is-selected', input.checked));
    count.textContent = `${selected.length} selected`;
    selection.textContent = selected.length
      ? `Selected: ${selected.join(', ')}. Final add-on pricing will be confirmed before approval.`
      : 'No optional enhancements selected.';
  }

  form.querySelectorAll('input[name="addOns"]').forEach((input) => input.addEventListener('change', updateAddonSummary));

  function setStep(step) {
    currentStep = step;
    document.querySelectorAll('[data-step]').forEach((panel) => { panel.hidden = panel.dataset.step !== step; });
    document.querySelectorAll('[data-progress-step]').forEach((item) => {
      const order = ['details', 'agreement', 'submit'];
      const currentIndex = order.indexOf(step === 'review' ? 'details' : step);
      const itemIndex = order.indexOf(item.dataset.progressStep);
      item.classList.toggle('is-active', item.dataset.progressStep === step || (step === 'review' && item.dataset.progressStep === 'details'));
      item.classList.toggle('is-complete', itemIndex > -1 && itemIndex < currentIndex);
    });
    document.querySelector('[data-step]:not([hidden])')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validatePanel(step, errorId) {
    const panel = document.querySelector(`[data-step="${step}"]`);
    const error = document.getElementById(errorId);
    error.textContent = '';
    const controls = Array.from(panel.querySelectorAll('input,select,textarea')).filter((control) => !control.disabled && control.type !== 'hidden');
    for (const control of controls) {
      if (!control.checkValidity()) {
        control.reportValidity();
        control.focus();
        error.textContent = 'Please complete the required fields before continuing.';
        return false;
      }
    }
    return true;
  }

  function labelFor(control) {
    if (control.name === 'addOns') return 'Optional enhancements';
    const label = control.closest('label')?.querySelector('span')?.textContent || control.name;
    return label.replace(/\s*\*.*$/, '').replace(/\s*\(optional\).*$/i, '').trim();
  }

  function collectReviewItems() {
    const items = [];
    const handled = new Set();
    form.querySelectorAll('[data-step="details"] input,[data-step="details"] select,[data-step="details"] textarea').forEach((control) => {
      if (!control.name || control.type === 'hidden' || control.name.startsWith('_') || ['privacyConsent'].includes(control.name) || handled.has(control.name)) return;
      handled.add(control.name);
      let value = '';
      if (control.type === 'checkbox') value = Array.from(form.querySelectorAll(`[name="${CSS.escape(control.name)}"]:checked`)).map((item) => item.value).join(', ');
      else value = control.value.trim();
      if (value) items.push({ label: labelFor(control), value });
    });
    return items;
  }

  function renderReview() {
    const container = document.getElementById('reviewContent');
    const name = `${form.firstName.value.trim()} ${form.lastName.value.trim()}`;
    const items = collectReviewItems();
    container.innerHTML = `
      <section class="review-card"><h3>Appointment</h3><dl><div><dt>Service</dt><dd>${escapeHTML(pkg.service)}</dd></div><div><dt>Package</dt><dd>${escapeHTML(pkg.title)}</dd></div><div><dt>Requested date</dt><dd>${escapeHTML(formattedDate)}</dd></div><div><dt>Requested time</dt><dd>${escapeHTML(requestedTime)} · Eastern Time</dd></div></dl></section>
      <section class="review-card"><h3>Contact</h3><dl><div><dt>Name</dt><dd>${escapeHTML(name)}</dd></div><div><dt>Email</dt><dd>${escapeHTML(form.email.value)}</dd></div><div><dt>Phone</dt><dd>${escapeHTML(form.phone.value)}</dd></div></dl></section>
      <section class="review-card review-wide"><h3>Project details</h3><dl>${items.map((item) => `<div><dt>${escapeHTML(item.label)}</dt><dd>${escapeHTML(item.value)}</dd></div>`).join('')}</dl></section>`;
    renderPreparation();
  }

  function renderPreparation() {
    const lists = {
      portrait: ['Choose clothing that feels like you and avoid last-minute logos or wrinkles.', 'Arrive ready at the agreed location and allow time for parking.', 'Bring any meaningful props, pet supplies, or inspiration references.'],
      'real-estate': ['Clean and declutter all photographed areas.', 'Turn on working lights, open blinds, and secure pets.', 'Move vehicles and hide personal information before arrival.', 'Confirm legal access to the property and exterior areas.'],
      inquiry: ['Keep your preferred date available until you receive a reply.', 'Prepare any timeline, brief, or reference link that will help define the scope.', 'Expect a separate quote and service agreement before the booking is confirmed.']
    };
    const list = lists[pkg.category] || lists.inquiry;
    const container = document.getElementById('preparationChecklist');
    container.innerHTML = `<h3>Preparation reminder</h3><ul>${list.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul><label class="check-row"><input type="checkbox" id="prepReviewed"><span>I have reviewed this preparation information.</span></label>`;
  }

  function listHTML(items) {
    return `<ul>${items.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>`;
  }

  function acknowledgementHTML() {
    const fullName = `${form.firstName.value.trim()} ${form.lastName.value.trim()}`;
    const address = [form.clientAddress.value, form.clientCity.value, form.clientProvince.value, form.clientPostalCode.value].filter(Boolean).join(', ');
    const common = `<p class="request-only-note"><strong>Booking request only:</strong> This acknowledgement is not the final service agreement, does not reserve the requested date, and does not require payment.</p>
      <p><strong>${escapeHTML(fullName)}</strong>, of <strong>${escapeHTML(address)}</strong>, is requesting <strong>${escapeHTML(pkg.title)}</strong> from <strong>Ben Fusco Media</strong> for <strong>${escapeHTML(formattedDate)}</strong> at <strong>${escapeHTML(requestedTime)}</strong> Eastern Time. Reference: <strong>${escapeHTML(reference)}</strong>.</p>`;

    if (pkg.category === 'real-estate') {
      const standards = serviceStandards.realEstate || {};
      const deliveryItems = [standards.photoDelivery];
      if (packageId !== 'real-estate-photos') deliveryItems.push(standards.videoDelivery);
      if (packageId === 'real-estate-premium') deliveryItems.push(standards.tourDelivery, standards.tourHosting);
      return `${common}
        <h3>1. Requested scope and preliminary price</h3><p>The selected package has a preliminary base price of ${money(pkg.price)} for one property up to 2,500 sq. ft. The final written quote will identify the exact deliverables, approved add-ons, travel, applicable taxes, total price, payment method and payment schedule. Larger, unusually complex, distant, multi-unit or multi-building properties may require a revised quote.</p>
        <p><strong>Requested package deliverables:</strong></p>${listHTML(pkg.includes || [])}
        <h3>2. Draft delivery standards</h3>${listHTML(deliveryItems.filter(Boolean))}<p>${escapeHTML(standards.deliveryMethod || '')}</p>
        <h3>3. Revisions, source files and archive</h3><p>${escapeHTML(standards.revisions || '')}</p><p>${escapeHTML(standards.rawFiles || '')}</p><p>${escapeHTML(standards.archive || '')}</p>
        <h3>4. Property readiness, access and floor plans</h3><p>The final agreement will require lawful access and a clean, staged, safe and shoot-ready property. Pets, occupants, vehicles, valuables and personal information must be managed before arrival. Any additional work, return visit or expanded scope will be discussed and approved rather than charged as an undisclosed automatic fee.</p><p>Floor plans are marketing references only, not architectural drawings, surveys, appraisals or guaranteed measurements. The client remains responsible for verifying measurements and listing information before publication.</p>
        <h3>5. Drone and 360° limitations</h3><p>${escapeHTML(standards.drone || '')} Aerial coverage is not guaranteed when a safe and lawful flight is unavailable; the final agreement will state whether the aerial portion is rescheduled, replaced with an agreed alternative, or credited.</p>${packageId === 'real-estate-premium' ? `<p>The requested 360° tour is an interactive hosted presentation, not a guaranteed measured 3D model. ${escapeHTML(standards.tourHosting || '')}</p>` : ''}
        <h3>6. Draft listing-media licence</h3><p>${escapeHTML(standards.licence || '')}</p><p>${escapeHTML(standards.licenceEnd || '')}</p><p>${escapeHTML(standards.portfolio || '')}</p>
        <h3>7. Draft travel and payment standards</h3><p>${escapeHTML(standards.travel || '')}</p><p>${escapeHTML(standards.payment || '')}</p>
        <h3>8. Draft cancellation and rescheduling standards</h3><p>${escapeHTML(standards.cancellation || '')}</p><p>${escapeHTML(standards.lateCancellation || '')}</p><p>${escapeHTML(standards.weatherReschedule || '')}</p><p>These standards are disclosed for review and become binding only when included in the client-specific final agreement. No blanket non-refundable charge is created by this acknowledgement. Mandatory consumer rights remain unaffected.</p>
        <h3>9. Language and next steps</h3><p>The requested final-agreement language is <strong>${escapeHTML(form.agreementLanguage.value)}</strong>. Where Quebec French-language requirements apply, applicable French terms will be provided before a client elects to be bound only by another-language version. The requested date becomes confirmed only after the final quote and agreement are accepted by both parties and any legally permitted payment is completed.</p>`;
    }

    return `${common}
      <h3>1. Request only</h3><p>This submission records an availability and project request. The displayed package price, if any, is preliminary. It is not confirmation of services, a final price, a reserved date or a payment request.</p>
      <h3>2. Review and proposal</h3><p>Ben Fusco Media will review the requested date, location, client type, creative scope, travel, safety, deliverables and applicable taxes, then reply within ${escapeHTML(settings.responseWindow || '24–48 hours')}. A client-specific final quote and service agreement will be provided before work is confirmed.</p>
      <h3>3. Client information and authority</h3><p>The requester confirms that the submitted information is accurate and that required permissions will be obtained before any service. Drone services remain subject to weather, airspace, privacy, access and safe operating conditions.</p>
      <h3>4. Privacy and optional marketing use</h3><p>Submitted information will be used to review and respond to the request under the Privacy Policy. Portfolio and social-media use remains a separate optional choice and does not affect service or pricing.</p>
      <h3>5. Language, final agreement and payment</h3><p>The requested final-agreement language is <strong>${escapeHTML(form.agreementLanguage.value)}</strong>. Any final agreement will state the exact scope, total, taxes, payment method, delivery, cancellation, licence and jurisdiction-specific rights. No payment is due through this request form.</p>`;
  }

  function prepareAcknowledgement() {
    document.getElementById('agreementTitle').textContent = 'Booking request acknowledgement';
    document.getElementById('agreementText').innerHTML = acknowledgementHTML();
  }

  function renderFinal() {
    const final = document.getElementById('finalSummary');
    final.innerHTML = `<p class="sidebar-code">${escapeHTML(reference)}</p><h3>${escapeHTML(pkg.title)}</h3><dl><div><dt>Client</dt><dd>${escapeHTML(form.firstName.value)} ${escapeHTML(form.lastName.value)}</dd></div><div><dt>Requested date</dt><dd>${escapeHTML(formattedDate)}</dd></div><div><dt>Requested time</dt><dd>${escapeHTML(requestedTime)} · Eastern Time</dd></div><div><dt>Preliminary base price</dt><dd>${escapeHTML(money(pkg.price))}</dd></div><div><dt>Agreement language</dt><dd>${escapeHTML(form.agreementLanguage.value)}</dd></div></dl>`;
    const realEstatePayment = serviceStandards.realEstate?.payment;
    document.getElementById('paymentNotice').innerHTML = pkg.category === 'real-estate'
      ? `<strong>No payment or standard retainer is due now.</strong> ${escapeHTML(realEstatePayment || '')}`
      : `<strong>No payment is due now.</strong> Ben Fusco Media will first confirm availability, client type, scope, travel, taxes, add-ons, the final total, the applicable agreement and a legally permitted payment method.`;
  }

  document.querySelector('[data-next="review"]').addEventListener('click', () => {
    if (!validatePanel('details', 'detailsError')) return;
    renderReview();
    setStep('review');
  });
  document.querySelector('[data-next="agreement"]').addEventListener('click', () => {
    prepareAcknowledgement();
    setStep('agreement');
  });
  document.querySelector('[data-next="submit"]').addEventListener('click', () => {
    const error = document.getElementById('agreementError');
    error.textContent = '';
    const consent = document.getElementById('agreementConsent');
    if (!consent.checked) { consent.reportValidity(); consent.focus(); return; }
    const acknowledgementText = document.getElementById('agreementText').innerText.trim();
    document.getElementById('requestAcknowledgementRecord').value = JSON.stringify({
      version: settings.requestAcknowledgementVersion || 'BFM-REQUEST-DRAFT',
      acknowledgedBy: `${form.firstName.value} ${form.lastName.value}`.trim(),
      acknowledgedAt: new Date().toISOString(),
      languagePreference: form.agreementLanguage.value,
      text: acknowledgementText
    });
    renderFinal();
    setStep('submit');
  });

  document.querySelectorAll('[data-back]').forEach((button) => button.addEventListener('click', () => setStep(button.dataset.back)));

  function draftData() {
    const data = {};
    new FormData(form).forEach((value, key) => {
      if (['_gotcha', 'requestAcknowledgementRecord', 'accessArrangement'].includes(key)) return;
      if (data[key]) data[key] = Array.isArray(data[key]) ? [...data[key], value] : [data[key], value];
      else data[key] = value;
    });
    return { savedAt: new Date().toISOString(), values: data };
  }

  function restoreDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey));
      if (!draft?.values) return;
      const draftAge = Date.now() - new Date(draft.savedAt).getTime();
      if (!Number.isFinite(draftAge) || draftAge > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(draftKey);
        return;
      }
      Object.entries(draft.values).forEach(([name, value]) => {
        const controls = form.querySelectorAll(`[name="${CSS.escape(name)}"]`);
        const values = Array.isArray(value) ? value : [value];
        controls.forEach((control) => {
          if (control.type === 'checkbox' || control.type === 'radio') control.checked = values.includes(control.value);
          else control.value = values[0];
        });
      });
      updateAddonSummary();
      document.getElementById('saveStatus').textContent = `Saved information restored from ${new Date(draft.savedAt).toLocaleString('en-CA')}.`;
    } catch (_) { localStorage.removeItem(draftKey); }
  }

  document.getElementById('saveDraft').addEventListener('click', () => {
    localStorage.setItem(draftKey, JSON.stringify(draftData()));
    document.getElementById('saveStatus').textContent = 'Saved on this device for 7 days. Access arrangements and acknowledgement records are not stored in the draft.';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting) return;
    const finalConfirm = document.getElementById('finalConfirm');
    const error = document.getElementById('submitError');
    error.textContent = '';
    if (!finalConfirm.checked) { finalConfirm.reportValidity(); finalConfirm.focus(); return; }
    submitting = true;
    const button = document.getElementById('submitBooking');
    const status = document.getElementById('submissionStatus');
    button.disabled = true;
    button.textContent = 'Sending request…';
    status.textContent = 'Securely sending your booking request.';
    const payload = new FormData(form);
    payload.append('submittedAt', new Date().toISOString());
    payload.append('requestedDateDisplay', formattedDate);
    payload.append('page', location.href);
    try {
      const response = await fetch(settings.formEndpoint, { method: 'POST', body: payload, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Submission was not accepted');
      const receipt = { reference, packageId, service: pkg.service, title: pkg.title, date: requestedDate, dateDisplay: formattedDate, time: requestedTime, timezone: settings.timezone || 'America/Toronto', firstName: form.firstName.value.trim(), lastName: form.lastName.value.trim(), email: form.email.value.trim(), price: pkg.price, deposit: pkg.deposit, balance, status: 'Request received — awaiting review' };
      sessionStorage.setItem('bfmBookingReceipt', JSON.stringify(receipt));
      localStorage.removeItem(draftKey);
      location.href = `booking-success.html?ref=${encodeURIComponent(reference)}`;
    } catch (_) {
      submitting = false;
      button.disabled = false;
      button.textContent = 'Try submitting again';
      status.textContent = '';
      error.innerHTML = `The request could not be sent. Please check your connection and try again, or email <a href="mailto:${escapeHTML(settings.businessEmail)}">${escapeHTML(settings.businessEmail)}</a>.`;
    }
  });

  restoreDraft();
  updateAddonSummary();
  setStep(currentStep);
}());
