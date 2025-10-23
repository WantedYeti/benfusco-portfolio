(function(){
  const packages = window.BK_PACKAGES || {};
  const params = new URLSearchParams(window.location.search);
  const pkgId = params.get('pkg');
  const dateParam = params.get('date');
  const timeParam = params.get('time');

  const main = document.getElementById('confirmMain');
  const emptyState = document.getElementById('confirmEmpty');
  const backLink = document.getElementById('confirmBack');

  if (pkgId && backLink){
    backLink.href = `booking.html?pkg=${encodeURIComponent(pkgId)}` + (dateParam ? `&date=${encodeURIComponent(dateParam)}` : '');
  }

  if (!pkgId || !packages[pkgId] || !dateParam || !timeParam){
    if (main) main.hidden = true;
    return;
  }

  const pkg = packages[pkgId];
  const currency = pkg.currency || 'CA$';
  const formatMoney = (value)=>{
    if (typeof value === 'number' && Number.isFinite(value)) return `${currency}${value.toFixed(2)}`;
    if (typeof value === 'string' && value.startsWith(currency)) return value;
    const numeric = parseFloat(String(value).replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(numeric)) return `${currency}${value}`;
    return `${currency}${numeric.toFixed(2)}`;
  };

  const parseDurationMinutes = (duration)=>{
    if (!duration) return NaN;
    const lower = String(duration).toLowerCase();
    const hourMatch = lower.match(/([0-9]*\.?[0-9]+)\s*hour/);
    if (hourMatch){
      return Math.round(parseFloat(hourMatch[1]) * 60);
    }
    const minuteMatch = lower.match(/([0-9]*\.?[0-9]+)\s*min/);
    if (minuteMatch){
      return Math.round(parseFloat(minuteMatch[1]));
    }
    return NaN;
  };

  const timeToMinutes = (timeString)=>{
    if (!timeString) return NaN;
    const match = timeString.trim().match(/^([0-9]{1,2}):([0-9]{2})\s*(AM|PM)$/i);
    if (!match) return NaN;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const suffix = match[3].toUpperCase();
    if (suffix === 'PM' && hours !== 12) hours += 12;
    if (suffix === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutesTotal)=>{
    if (!Number.isFinite(minutesTotal)) return null;
    const minutesInDay = 24 * 60;
    const normalized = ((minutesTotal % minutesInDay) + minutesInDay) % minutesInDay;
    let hours24 = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    const suffix = hours24 >= 12 ? 'PM' : 'AM';
    let hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;
    const minuteStr = minutes.toString().padStart(2, '0');
    return `${hours12}:${minuteStr} ${suffix}`;
  };

  const durationMinutes = parseDurationMinutes(pkg.duration);
  const timezoneLabel = 'Eastern Time';
  const startMinutes = timeToMinutes(timeParam);
  const endTime = Number.isFinite(startMinutes) && Number.isFinite(durationMinutes)
    ? minutesToTime(startMinutes + durationMinutes)
    : null;
  const sessionTimeDisplay = endTime
    ? `${timeParam} – ${endTime} (${timezoneLabel})`
    : `${timeParam} (${timezoneLabel})`;

  const sessionDate = new Date(`${dateParam}T00:00:00`);
  const formattedDate = sessionDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const total = typeof pkg.price === 'number' ? pkg.price : parseFloat(String(pkg.price).replace(/[^0-9.]/g, '')) || 0;
  const deposit = pkg.deposit ?? Math.round(total * 0.25);
  const balance = Math.max(0, total - deposit);
  const reuploadFee = formatMoney(350);

  const body = document.body;
  const stepClasses = ['is-step-contact', 'is-step-contract', 'is-step-payment'];
  const setStepState = (state)=>{
    if (!body) return;
    stepClasses.forEach(className => body.classList.remove(className));
    if (state) body.classList.add(state);
  };

  const setText = (id, value)=>{ const el = document.getElementById(id); if (el) el.textContent = value; };
  setText('summaryCode', pkg.code || '');
  setText('summaryTitle', pkg.title || '');
  setText('summaryDesc', pkg.description || '');
  setText('summaryDate', formattedDate);
  setText('summaryTime', sessionTimeDisplay);
  setText('summaryLocation', pkg.location || '');
  setText('summarySessionFee', formatMoney(total));
  setText('summaryTotal', formatMoney(total));
  setText('summaryDeposit', formatMoney(deposit));
  setText('summaryBalance', formatMoney(balance));
  setText('transferAmount', formatMoney(deposit));

  const summaryMore = document.getElementById('summaryMore');
  if (summaryMore){
    if (pkg.readMore){
      summaryMore.href = pkg.readMore;
    } else {
      summaryMore.style.display = 'none';
    }
  }

  const includesList = document.getElementById('summaryIncludes');
  if (includesList){
    includesList.innerHTML = '';
    if (Array.isArray(pkg.includes)){
      pkg.includes.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        includesList.appendChild(li);
      });
    }
  }

  const photo = document.getElementById('summaryPhoto');
  if (photo && pkg.image){
    photo.style.backgroundImage = `url('${pkg.image}')`;
  }

  const assign = (id, value)=>{ const el = document.getElementById(id); if (el) el.value = value; };
  assign('hiddenPackageId', pkg.id);
  assign('hiddenPackageTitle', pkg.title || '');
  assign('hiddenSessionDate', formattedDate);
  assign('hiddenSessionTime', sessionTimeDisplay);
  assign('hiddenSessionPrice', formatMoney(total));
  assign('hiddenDepositDue', formatMoney(deposit));

  if (main) main.hidden = false;
  setStepState('is-step-contact');

  const form = document.getElementById('confirmForm');
  const feedback = document.getElementById('formFeedback');
  const continueButton = document.getElementById('continueButton');
  const editContact = document.getElementById('editContact');
  const contactStep = document.getElementById('contactStep');
  const contractStep = document.getElementById('contractStep');
  const summaryContactName = document.getElementById('summaryContactName');
  const summaryContactEmail = document.getElementById('summaryContactEmail');
  const summaryContactPhone = document.getElementById('summaryContactPhone');
  const contractMeta = document.getElementById('contractMeta');
  const contractContent = document.getElementById('contractContent');
  const signatureInput = document.getElementById('signatureInput');
  const signButton = document.getElementById('signButton');
  const signatureStatus = document.getElementById('signatureStatus');
  const signatureModal = document.getElementById('signatureModal');
  const signatureDialog = signatureModal ? signatureModal.querySelector('.signature-dialog') : null;
  const signatureClose = document.getElementById('signatureClose');
  const signatureCanvas = document.getElementById('signatureCanvas');
  const signatureCtx = signatureCanvas ? signatureCanvas.getContext('2d') : null;
  const signatureAccept = document.getElementById('signatureAccept');
  const signatureCancel = document.getElementById('signatureCancel');
  const signatureClear = document.getElementById('signatureClear');
  const signatureTyped = document.getElementById('signatureTyped');
  const signatureConsent = document.getElementById('signatureConsent');
  const signatureModeButtons = Array.from(document.querySelectorAll('[data-signature-mode]'));
  const signaturePanels = Array.from(document.querySelectorAll('[data-signature-panel]'));
  const agreeCheckbox = document.getElementById('agreeCheckbox');
  const contractFeedback = document.getElementById('contractFeedback');
  const contractContinue = document.getElementById('contractContinue');
  const paymentStep = document.getElementById('paymentStep');
  const backToContract = document.getElementById('backToContract');
  const depositCheckbox = document.getElementById('depositCheckbox');
  const phoneInput = document.getElementById('phone');
  const transferAmountEl = document.getElementById('transferAmount');
  const transferEmailEl = document.getElementById('transferEmail');

  const photographerBusiness = 'Ben Fusco';
  const photographerPerson = 'Ben Fusco';
  const photographerEmail = 'bennyfusco@gmail.com';
  const photographerNoticeEmail = 'contact@benfusco.com';
  const defaultSignatureMessage = 'Signature required';
  const signatureCanvasHeight = 180;
  let signatureMode = 'draw';
  let signatureHasInk = false;
  let signatureModalOpen = false;
  let bodyScrollLockY = 0;
  let bodyScrollLocked = false;
  if (transferEmailEl) transferEmailEl.textContent = photographerEmail;

  const fields = {
    firstName: {
      input: document.getElementById('firstName'),
      error: document.getElementById('firstNameError'),
      message: 'First name is required.'
    },
    lastName: {
      input: document.getElementById('lastName'),
      error: document.getElementById('lastNameError'),
      message: 'Last name is required.'
    },
    email: {
      input: document.getElementById('email'),
      error: document.getElementById('emailError'),
      message: 'A valid email is required.',
      validator: (value)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    }
  };

  const clearError = (field)=>{
    if (field?.error) field.error.textContent = '';
    if (field?.input) field.input.classList.remove('has-error');
  };

  const setError = (field, message)=>{
    if (field?.error) field.error.textContent = message;
    if (field?.input) field.input.classList.add('has-error');
  };

  const resetFeedback = ()=>{
    if (feedback){
      feedback.textContent = '';
      feedback.style.color = '#2b6b2b';
    }
  };

  const clearContractFeedback = ()=>{
    if (contractFeedback){
      contractFeedback.textContent = '';
      contractFeedback.style.color = '#6d7080';
    }
  };

  const setContractError = (message)=>{
    if (contractFeedback){
      contractFeedback.textContent = message;
      contractFeedback.style.color = '#f05a5a';
    }
  };

  const resetPaymentStep = ()=>{
    if (depositCheckbox) depositCheckbox.checked = false;
  };

  const validateContactFields = ()=>{
    let hasError = false;
    Object.values(fields).forEach(field => {
      if (!field.input) return;
      const value = field.input.value.trim();
      const valid = value && (!field.validator || field.validator(value));
      if (!valid){
        setError(field, field.message);
        hasError = true;
      }
    });
    return !hasError;
  };

  const resetSignature = ()=>{
    if (signatureInput) signatureInput.value = '';
    if (signButton) signButton.textContent = 'Click here to sign';
    if (signatureStatus){
      signatureStatus.textContent = defaultSignatureMessage;
      signatureStatus.classList.remove('is-signed');
    }
    signatureHasInk = false;
    if (signatureConsent) signatureConsent.checked = false;
    if (signatureCanvas && signatureCtx) resetSignatureCanvas();
    clearContractFeedback();
  };

  const populateContactSummary = ()=>{
    const first = fields.firstName.input?.value.trim() || '';
    const last = fields.lastName.input?.value.trim() || '';
    const fullName = `${first} ${last}`.trim();
    if (summaryContactName) summaryContactName.textContent = fullName || '—';

    const emailVal = fields.email.input?.value.trim() || '';
    if (summaryContactEmail) summaryContactEmail.textContent = emailVal || '—';

    const phoneVal = phoneInput?.value.trim() || '';
    if (summaryContactPhone) summaryContactPhone.textContent = phoneVal || '—';

    return { fullName, email: emailVal };
  };

  const getDefaultSignatureName = ()=>{
    const summaryName = summaryContactName?.textContent?.trim();
    if (summaryName) return summaryName;
    const first = fields.firstName.input?.value.trim() || '';
    const last = fields.lastName.input?.value.trim() || '';
    const fallback = `${first} ${last}`.trim();
    return fallback || 'Client';
  };

  const updateSignatureAccept = ()=>{
    if (!signatureAccept) return;
    const consentOk = !!signatureConsent?.checked;
    let ready = false;
    if (signatureMode === 'draw'){
      ready = signatureHasInk;
    } else {
      ready = Boolean(signatureTyped?.value.trim());
    }
    signatureAccept.disabled = !(ready && consentOk);
  };

  const resetSignatureCanvas = ()=>{
    if (!signatureCanvas || !signatureCtx) return;
    const container = signatureCanvas.parentElement;
    let width = container?.clientWidth || container?.getBoundingClientRect().width || (window.innerWidth ? window.innerWidth - 64 : 420);
    width = Math.max(240, Math.min(width, 520));
    const ratio = window.devicePixelRatio || 1;
    signatureCanvas.width = width * ratio;
    signatureCanvas.height = signatureCanvasHeight * ratio;
    signatureCanvas.style.width = `${width}px`;
    signatureCanvas.style.height = `${signatureCanvasHeight}px`;
    signatureCtx.setTransform(1, 0, 0, 1, 0, 0);
    signatureCtx.fillStyle = '#ffffff';
    signatureCtx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    signatureCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
    signatureCtx.lineCap = 'round';
    signatureCtx.lineJoin = 'round';
    signatureCtx.lineWidth = 2;
    signatureCtx.strokeStyle = '#111';
    signatureHasInk = false;
    updateSignatureAccept();
  };

  const signaturePanelsByMode = signaturePanels.reduce((acc, panel)=>{
    const key = panel.getAttribute('data-signature-panel');
    if (key) acc[key] = panel;
    return acc;
  }, {});

  const setSignatureMode = (mode)=>{
    signatureMode = mode;
    signatureModeButtons.forEach(btn => {
      const active = btn.dataset.signatureMode === mode;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      btn.setAttribute('tabindex', active ? '0' : '-1');
    });
    Object.entries(signaturePanelsByMode).forEach(([key, panel])=>{
      panel.hidden = key !== mode;
    });
    if (mode === 'draw'){
      signatureHasInk = false;
      resetSignatureCanvas();
      setTimeout(()=>{
        signatureCanvas?.focus();
      }, 0);
    } else if (signatureTyped){
      if (!signatureTyped.value.trim()){
        signatureTyped.value = getDefaultSignatureName();
      }
      setTimeout(()=>{
        signatureTyped.focus();
      }, 0);
    }
    updateSignatureAccept();
  };

  const handleSignatureKeydown = (event)=>{
    if (event.key === 'Escape'){
      closeSignatureModal();
    }
  };

  const closeSignatureModal = ()=>{
    if (!signatureModalOpen || !signatureModal) return;
    signatureModal.classList.remove('open');
    signatureModalOpen = false;
    document.body.classList.remove('modal-open');
    window.removeEventListener('keydown', handleSignatureKeydown);
    setTimeout(()=>{
      if (!signatureModalOpen){
        signatureModal.hidden = true;
      }
    }, 200);
  };

  const openSignatureModal = ()=>{
    if (!signatureModal){
      const timestampFallback = new Date().toLocaleString();
      const fallbackName = getDefaultSignatureName();
      if (signatureInput) signatureInput.value = `${fallbackName} | Signed ${timestampFallback}`;
      if (signatureStatus){
        signatureStatus.textContent = `Signed by ${fallbackName} on ${timestampFallback}`;
        signatureStatus.classList.add('is-signed');
      }
      signButton.textContent = 'Signed — click to update';
      resetFeedback();
      clearContractFeedback();
      return;
    }
  signatureConsent.checked = false;
    let existingRecord = null;
    if (signatureInput?.value){
      try {
        existingRecord = JSON.parse(signatureInput.value);
      } catch (err){
        existingRecord = null;
      }
    }
    if (signatureTyped){
      if (existingRecord?.mode === 'type'){
        signatureTyped.value = existingRecord.name || existingRecord.value || getDefaultSignatureName();
      } else {
        signatureTyped.value = getDefaultSignatureName();
      }
    }
    signatureModal.hidden = false;
    requestAnimationFrame(()=>{
      signatureModal.classList.add('open');
    });
    document.body.classList.add('modal-open');
    signatureModalOpen = true;
    const initialMode = existingRecord?.mode === 'type' ? 'type' : 'draw';
    setSignatureMode(initialMode);
    if (initialMode === 'draw' && existingRecord?.dataUrl && signatureCanvas && signatureCtx){
      const img = new Image();
      img.onload = ()=>{
        resetSignatureCanvas();
        const ratio = window.devicePixelRatio || 1;
        const width = signatureCanvas.width / ratio;
        signatureCtx.drawImage(img, 0, 0, width, signatureCanvasHeight);
        signatureHasInk = true;
        updateSignatureAccept();
      };
      img.src = existingRecord.dataUrl;
    } else {
      signatureHasInk = initialMode === 'type' ? Boolean(signatureTyped?.value.trim()) : false;
      updateSignatureAccept();
    }
    window.addEventListener('keydown', handleSignatureKeydown);
  };

  const getCanvasPosition = (evt)=>{
    if (!signatureCanvas) return { x: 0, y: 0 };
    const rect = signatureCanvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  };

  const buildContractHtml = ({ fullName, email })=>{
    if (!contractContent) return;
    const effectiveDate = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    if (contractMeta){
      contractMeta.textContent = `Effective Date: ${effectiveDate} · Session: ${pkg.title}`;
    }

  const highlight = (text)=>`<span class="contract-highlight">${text}</span>`;

  const clientNameLine = fullName || 'Client Name';
  const clientEmailLine = email || 'Client Email';
  const locationLine = pkg.location || 'Location provided by client';
  const sessionDateLine = formattedDate || 'Client date';
  const sessionTimeLine = sessionTimeDisplay || 'Client time';
  const highlightedTime = highlight(sessionTimeLine);
  const totalDisplay = highlight(formatMoney(total));
  const retainerDisplay = highlight(formatMoney(deposit));
  const remainingDisplay = highlight(formatMoney(balance));
  const durationText = Number.isFinite(durationMinutes) ? `${durationMinutes}-minute session` : 'Portrait session as outlined above';
  const durationHighlight = highlight(durationText);
  const includesEdited = Array.isArray(pkg.includes) ? pkg.includes.find(item => /edited/i.test(item)) : null;
  const includesGallery = Array.isArray(pkg.includes) ? pkg.includes.find(item => /gallery/i.test(item)) : null;
  const descriptionItems = [];
  descriptionItems.push(durationHighlight);
  if (includesEdited) descriptionItems.push(highlight(includesEdited));
  else descriptionItems.push(highlight('Edited images delivered via online gallery'));
  if (includesGallery && includesGallery !== includesEdited) descriptionItems.push(highlight(includesGallery));
  const descriptionListHtml = descriptionItems.map(item => `<li>${item}</li>`).join('');
  const monthlyFeeHighlight = highlight('2% monthly fee');
  const cancellationHighlight = highlight('14 days');
  const governingHighlight = highlight('Ontario, Canada');

    const signatureLine = photographerBusiness === photographerPerson
      ? photographerPerson
      : `${photographerPerson}, ${photographerBusiness}`;

    const contractHTML = [
  `<p>This Portrait Photography Services Agreement ("Agreement") is made as of ${effectiveDate} (the "Effective Date") between ${clientNameLine}, with a primary contact email of ${clientEmailLine} ("Client"), and ${photographerPerson} ("Photographer").</p>`,
      '<p><strong>1. Engagement of Photographer</strong></p>',
      `<p><strong>1.1 Services.</strong> Subject to the terms of this Agreement, Client engages Photographer to provide portrait photography services (the "Services") for the session described below (the "Portrait Session").</p>`,
  `<p>Date and Time: ${sessionDateLine} — ${highlightedTime}</p>`,
      `<p>Location: ${locationLine}</p>`,
      '<p>Description:</p>',
      `<ul>${descriptionListHtml}</ul>`,
      '<p>The Photographer will capture and deliver photographic material (the "Work Product") as described above. "Images" include all photographic material, whether film or digital, created by the Photographer under this Agreement.</p>',
      '<p><strong>1.2 Exclusivity.</strong> Client agrees that Photographer will be the exclusive service provider for this Portrait Session unless otherwise agreed in writing.</p>',
      '<p><strong>2. Fees and Payment</strong></p>',
      '<p><strong>2.1 Fees.</strong></p>',
      `<ul><li>Total Fee: ${totalDisplay}</li><li>Retainer (due upon signing): ${retainerDisplay}</li><li>Remaining balance (due on the day of the session): ${remainingDisplay}</li></ul>`,
      '<p>All applicable taxes will be added where required.</p>',
      `<p><strong>2.2 Retainer.</strong> The Client acknowledges the retainer is non-refundable, securing the Photographer’s time and date. It will be applied toward the total fee.</p>`,
  `<p><strong>2.3 Invoice and Late Payments.</strong> An invoice will be issued upon agreement of the Services. Late payments are subject to a ${monthlyFeeHighlight} on the outstanding balance.</p>`,
      '<p><strong>3. Client Responsibilities</strong></p>',
      '<p><strong>3.1 Consents.</strong> Client must obtain any necessary consents or permissions for locations, venues, and participants before the session.</p>',
      '<p><strong>3.2 Travel and Expenses.</strong> If the session location is more than 100 km from Brockville, Ontario, the Client agrees to reimburse reasonable travel expenses.</p>',
      '<p><strong>3.3 Liability Waiver.</strong> Client releases and holds harmless the Photographer from any claims relating to the use, sale, or publication of images created under this Agreement.</p>',
      '<p><strong>3.4 Supervision of Children.</strong> Client is responsible for supervising all participants, including minors, during the session. The Photographer is not responsible for uncooperative behaviour.</p>',
      '<p><strong>3.5 Pets.</strong> Client is responsible for any pets brought to the session. The Photographer is not liable for accidents or missed photos due to animal behaviour.</p>',
      '<p><strong>3.6 Damage to Equipment.</strong> Client is responsible for any damage caused to the Photographer’s equipment or property during the session.</p>',
      '<p><strong>4. Photographer Responsibilities</strong></p>',
      '<p><strong>4.1 Equipment.</strong> Photographer will supply all necessary equipment.</p>',
      '<p><strong>4.2 Professional Conduct.</strong> Photographer will perform the Services in a professional, safe, and efficient manner.</p>',
      '<p><strong>4.3 Safety & Right to Terminate.</strong> Photographer may terminate the session immediately if they feel unsafe or harassed. No refunds will be issued in such cases.</p>',
      '<p><strong>5. Artistic Release</strong></p>',
      '<p><strong>5.1 Artistic Style.</strong> Client acknowledges having reviewed the Photographer’s portfolio and understands that work will be consistent with the Photographer’s artistic style.</p>',
      '<p><strong>5.2 Creative Control.</strong> Photographer retains full artistic discretion in selecting, editing, and finalizing images. Disagreement with artistic judgment does not constitute grounds for refund or termination.</p>',
      '<p><strong>5.3 Editing Requests.</strong> Standard colour correction and light retouching are included. Advanced retouching may incur additional fees at the Photographer’s discretion.</p>',
      '<p><strong>6. Image Delivery and Download Policy</strong></p>',
      '<p><strong>6.1 Delivery Timeline.</strong> Final edited images will be delivered within 4 weeks unless otherwise agreed in writing.</p>',
      '<p><strong>6.2 Delivery Method.</strong> All final images will be delivered via a private online gallery. The Client will receive a secure download link and instructions for accessing their gallery.</p>',
  `<p><strong>6.3 Client Download Responsibility.</strong> Client must download and back up images within 90 days of delivery. After this period, re-uploading (if possible) may incur a ${reuploadFee} fee.</p>`,
      '<p><strong>7. Term and Termination</strong></p>',
      '<p><strong>7.1 Term.</strong> This Agreement remains in effect until all Services are completed and fees are paid.</p>',
  `<p><strong>7.2 Cancellation.</strong> Cancellations must be made at least ${cancellationHighlight} before the session. Retainers are non-refundable.</p>`,
      '<p><strong>7.3 Rescheduling.</strong> Photographer will make reasonable efforts to reschedule, subject to availability. If unavailable, the rescheduling will be treated as a cancellation.</p>',
      '<p><strong>7.4 Weather Conditions.</strong> Outdoor sessions may be postponed due to inclement weather. Fees (excluding the non-refundable retainer) may be applied toward a future session.</p>',
      '<p><strong>7.5 No Refunds.</strong> Client agrees no refunds will be issued for cancellations or dissatisfaction with subjective preferences.</p>',
      '<p><strong>7.6 Late Arrivals.</strong> Late arrivals may result in reduced shooting time without refund.</p>',
      '<p><strong>7.7 Replacement Photographer.</strong> If the Photographer is unavailable due to emergency, a qualified associate may perform the session, maintaining style and quality.</p>',
      '<p><strong>8. Reshoot Policy</strong></p>',
      '<p><strong>8.1 Eligibility for Reshoot.</strong> Reshoots may be scheduled only under reasonable circumstances, including severe weather, equipment failure, or unforeseen issues preventing delivery of expected quality. Reshoots requested for dissatisfaction with appearance, clothing, or subjective preference require a new booking and session fee.</p>',
      '<p><strong>8.2 Reshoot Scheduling.</strong> Reshoots will be scheduled based on mutual availability and held within 60 days of the original session date.</p>',
      '<p><strong>9. Ownership of Work Product</strong></p>',
      '<p><strong>9.1 Copyright.</strong> All images and Work Product remain the sole property of the Photographer.</p>',
      '<p><strong>9.2 Model Release.</strong> Client grants the Photographer permission to use images for portfolio, website, social media, and marketing purposes.</p>',
      '<p><strong>9.3 RAW Files.</strong> RAW (unedited) files are not included in the final delivery and remain the exclusive property of the Photographer.</p>',
      '<p><strong>10. Client License</strong></p>',
      '<p><strong>10.1 Personal Use License.</strong> The Photographer grants the Client a non-commercial license to use the delivered images for personal purposes such as printing, sharing on social media, or display at home. Client may not edit, alter, or apply filters to the images. Proper credit via tag @benfusco.photo is appreciated when posting online.</p>',
      '<p><strong>11. Indemnity and Limitation of Liability</strong></p>',
      '<p><strong>11.1 Indemnification.</strong> Client agrees to indemnify and hold harmless the Photographer from any claims or damages arising from the session.</p>',
      '<p><strong>11.2 Force Majeure.</strong> Neither party is liable for delays caused by illness, emergencies, natural disasters, or events beyond control.</p>',
      '<p><strong>11.3 Failure to Deliver.</strong> Photographer is not liable for delivery delays due to technical failures, client behaviour, or unforeseen circumstances.</p>',
      '<p><strong>11.4 Maximum Liability.</strong> Photographer’s maximum liability is limited to the total fees paid under this Agreement.</p>',
      '<p><strong>12. General Provisions</strong></p>',
      `<p><strong>12.1 Notices.</strong> Photographer Email: ${photographerNoticeEmail}. Client Email: ${clientEmailLine}.</p>`,
      '<p><strong>12.2 Survival.</strong> Sections 7–11 will survive termination of this Agreement.</p>',
  `<p><strong>12.3 Governing Law.</strong> This Agreement is governed by the laws of ${governingHighlight}.</p>`,
      '<p><strong>12.4 Amendments.</strong> Any amendments must be made in writing and signed by both parties.</p>',
      '<p><strong>12.5 Entire Agreement.</strong> This document represents the entire understanding between the parties.</p>',
      '<p><strong>12.6 Severability.</strong> If any clause is found invalid, the remainder of this Agreement shall remain in full force.</p>',
      `<p><strong>Signatures.</strong><br>Client: ${fullName || '________________'}<br>${signatureLine}</p>`
    ].join('');

    contractContent.innerHTML = contractHTML;
    contractContent.scrollTop = 0;
  };

  const showContactStep = ()=>{
    clearContractFeedback();
    resetFeedback();
    setStepState('is-step-contact');
    if (contactStep) contactStep.hidden = false;
    if (contractStep) contractStep.hidden = true;
    if (paymentStep) paymentStep.hidden = true;
    resetSignature();
    resetPaymentStep();
    if (contactStep){
      contactStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const showContractStep = ()=>{
    resetFeedback();
    clearContractFeedback();
    const details = populateContactSummary();
    buildContractHtml(details);
    setStepState('is-step-contract');
    if (contactStep) contactStep.hidden = true;
    if (contractStep) contractStep.hidden = false;
    if (paymentStep) paymentStep.hidden = true;
    if (!signatureInput?.value){
      resetSignature();
    }
    resetPaymentStep();
    if (contractStep){
      contractStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const showPaymentStep = ()=>{
    clearContractFeedback();
    resetFeedback();
    setStepState('is-step-payment');
    if (contractStep) contractStep.hidden = true;
    if (paymentStep){
      paymentStep.hidden = false;
      paymentStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  Object.values(fields).forEach(field => {
    if (field.input){
      field.input.addEventListener('input', ()=>{
        clearError(field);
        resetFeedback();
      });
      field.input.addEventListener('blur', ()=>{
        if (!field.input.value.trim()){
          setError(field, field.message);
        } else if (field.validator && !field.validator(field.input.value.trim())){
          setError(field, field.message);
        }
      });
    }
  });

  if (continueButton){
    continueButton.addEventListener('click', ()=>{
      resetFeedback();
      clearContractFeedback();
      if (validateContactFields()){
        showContractStep();
      }
    });
  }

  if (editContact){
    editContact.addEventListener('click', ()=>{
      showContactStep();
    });
  }

  if (contractContinue){
    contractContinue.addEventListener('click', ()=>{
      clearContractFeedback();
      resetFeedback();
      if (!signatureInput?.value){
        setContractError('Please sign the agreement to continue.');
        if (signatureStatus){
          signatureStatus.textContent = defaultSignatureMessage;
          signatureStatus.classList.remove('is-signed');
        }
        return;
      }
      if (!agreeCheckbox?.checked){
        setContractError('Please confirm that you agree to the contract.');
        return;
      }
      showPaymentStep();
    });
  }

  if (backToContract){
    backToContract.addEventListener('click', ()=>{
      showContractStep();
    });
  }

  if (signButton){
    signButton.addEventListener('click', ()=>{
      openSignatureModal();
    });
  }

  if (signatureModeButtons.length){
    signatureModeButtons.forEach(btn => {
      btn.addEventListener('click', ()=>{
        const mode = btn.dataset.signatureMode || 'draw';
        setSignatureMode(mode);
      });
    });
  }

  if (signatureClear){
    signatureClear.addEventListener('click', ()=>{
      resetSignatureCanvas();
    });
  }

  if (signatureConsent){
    signatureConsent.addEventListener('change', updateSignatureAccept);
  }

  if (signatureTyped){
    signatureTyped.addEventListener('input', updateSignatureAccept);
  }

  if (signatureCancel){
    signatureCancel.addEventListener('click', ()=>{
      closeSignatureModal();
    });
  }

  if (signatureClose){
    signatureClose.addEventListener('click', ()=>{
      closeSignatureModal();
    });
  }

  if (signatureModal){
    signatureModal.addEventListener('click', (event)=>{
      if (event.target === signatureModal){
        closeSignatureModal();
      }
    });
  }

  if (signatureAccept){
    signatureAccept.addEventListener('click', ()=>{
      if (signatureAccept.disabled) return;
      const timestamp = new Date();
      const displayTime = timestamp.toLocaleString();
      const record = {
        mode: signatureMode,
        timestamp: timestamp.toISOString(),
      };
      let signerName = getDefaultSignatureName();
      if (signatureMode === 'draw'){
        if (signatureCanvas){
          record.dataUrl = signatureCanvas.toDataURL('image/png');
        }
        record.name = signerName;
      } else {
        signerName = signatureTyped?.value.trim() || signerName;
        record.name = signerName;
        record.value = signerName;
      }
      if (signatureInput) signatureInput.value = JSON.stringify(record);
      if (signatureStatus){
        const descriptor = signatureMode === 'draw' ? 'drawn signature' : 'typed signature';
        signatureStatus.textContent = `Signed by ${record.name} on ${displayTime} (${descriptor})`;
        signatureStatus.classList.add('is-signed');
      }
      signButton.textContent = 'Signed — click to update';
      resetFeedback();
      clearContractFeedback();
      closeSignatureModal();
    });
  }

  if (signatureCanvas && signatureCtx){
    let drawing = false;
    signatureCanvas.addEventListener('pointerdown', (event)=>{
      if (signatureMode !== 'draw') return;
      event.preventDefault();
      const pos = getCanvasPosition(event);
      signatureCanvas.setPointerCapture?.(event.pointerId);
      signatureCtx.beginPath();
      signatureCtx.moveTo(pos.x, pos.y);
      signatureCtx.lineTo(pos.x + 0.01, pos.y + 0.01);
      signatureCtx.stroke();
      drawing = true;
      signatureHasInk = true;
      updateSignatureAccept();
    });
    signatureCanvas.addEventListener('pointermove', (event)=>{
      if (!drawing || signatureMode !== 'draw') return;
      event.preventDefault();
      const pos = getCanvasPosition(event);
      signatureCtx.lineTo(pos.x, pos.y);
      signatureCtx.stroke();
    });
    const finishStroke = (event)=>{
      if (!drawing) return;
      drawing = false;
      signatureCanvas.releasePointerCapture?.(event.pointerId);
      signatureCtx.closePath();
    };
    signatureCanvas.addEventListener('pointerup', (event)=>{
      if (signatureMode !== 'draw') return;
      event.preventDefault();
      finishStroke(event);
    });
    signatureCanvas.addEventListener('pointercancel', finishStroke);
    signatureCanvas.addEventListener('pointerleave', ()=>{
      drawing = false;
    });
  }

  window.addEventListener('resize', ()=>{
    if (signatureModalOpen){
      resetSignatureCanvas();
    }
  });

  if (agreeCheckbox){
    agreeCheckbox.addEventListener('change', ()=>{
      if (agreeCheckbox.checked){
        resetFeedback();
        clearContractFeedback();
      }
    });
  }

  if (depositCheckbox){
    depositCheckbox.addEventListener('change', ()=>{
      if (depositCheckbox.checked){
        resetFeedback();
      }
    });
  }

  if (form){
    form.addEventListener('submit', async (event)=>{
      event.preventDefault();
      resetFeedback();
      clearContractFeedback();

      const contactValid = validateContactFields();
      if (!contactValid){
        showContactStep();
        return;
      }

      if (!signatureInput?.value){
        showContractStep();
        setContractError('Please sign the agreement before submitting.');
        return;
      }

      if (!agreeCheckbox?.checked){
        showContractStep();
        setContractError('Please confirm that you agree to the contract before submitting.');
        return;
      }

      if (paymentStep && paymentStep.hidden){
        showPaymentStep();
        if (feedback){
          feedback.textContent = 'Confirm your retainer details below, then send your booking request.';
          feedback.style.color = '#6d7080';
        }
        return;
      }

      if (!depositCheckbox?.checked){
        if (feedback){
          feedback.textContent = 'Please confirm that you will send the retainer via e-transfer.';
          feedback.style.color = '#f05a5a';
        }
        return;
      }

      const submitButton = form.querySelector('.payment-submit');
      if (submitButton){
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
      }

      try {
        const formData = new FormData(form);
        const bookingSummary = `${pkg.title} on ${formattedDate} at ${sessionTimeDisplay}`;
        formData.append('bookingSummary', bookingSummary);
        formData.append('contractAcceptedAt', new Date().toISOString());
        const sessionDetails = [
          `Package: ${pkg.title} (${pkg.code || '—'})`,
          `Date & Time: ${formattedDate} at ${sessionTimeDisplay}`,
          `Location: ${pkg.location || 'Client provided'}`,
          `Session Fee: ${formatMoney(total)}`,
          `Retainer Due: ${formatMoney(deposit)}`,
          `Remaining Balance: ${formatMoney(balance)}`
        ];
        if (Array.isArray(pkg.includes) && pkg.includes.length){
          sessionDetails.push(`Includes: ${pkg.includes.join(', ')}`);
        }
        formData.append('sessionDetails', sessionDetails.join('\n'));
        if (signatureInput?.value){
          formData.append('signaturePayload', signatureInput.value);
        }
        formData.append('_subject', `New Booking Request – ${pkg.title}`);
        formData.append('_cc', 'contact@benfusco.com');
        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });
        if (response.ok){
          if (feedback){
            feedback.textContent = 'Thank you! Your booking request and signed agreement have been sent. I will be in touch soon.';
            feedback.style.color = '#2b6b2b';
          }
          resetPaymentStep();
          if (agreeCheckbox) agreeCheckbox.checked = false;
        } else {
          throw new Error('Form submission failed');
        }
      } catch (error){
        console.error(error);
        if (feedback){
          feedback.textContent = 'Something went wrong. Please try again or email me directly.';
          feedback.style.color = '#f05a5a';
        }
      } finally {
        if (submitButton){
          submitButton.disabled = false;
          submitButton.textContent = 'Send Booking Request';
        }
      }
    });
  }
})();
