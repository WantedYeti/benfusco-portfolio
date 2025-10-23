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
    if (emptyState) emptyState.hidden = false;
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
    ? `${timeParam}  ${endTime} (${timezoneLabel})`
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
  const travelRate = formatMoney(0.60);

  const setText = (id, value)=>{ const el = document.getElementById(id); if (el) el.textContent = value; };
  setText('summaryCode', pkg.code || '');
  setText('summaryTitle', pkg.title || '');
  setText('summaryDesc', pkg.description || '');
  setText('summaryDate', formattedDate);
  setText('summaryTime', sessionTimeDisplay);
  setText('summaryLocation', pkg.location || '');
  setText('summaryTotal', formatMoney(total));
  setText('summaryDeposit', formatMoney(deposit));
  setText('summaryBalance', formatMoney(balance));

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
  if (emptyState) emptyState.hidden = true;

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
  const agreeCheckbox = document.getElementById('agreeCheckbox');
  const phoneInput = document.getElementById('phone');

  const photographerBusiness = 'Ben Fusco Photography';
  const photographerPerson = 'Ben Fusco';
  const photographerEmail = 'contact@benfusco.com';
  const defaultSignatureMessage = 'Signature required';

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

  const buildContractHtml = ({ fullName, email })=>{
    if (!contractContent) return;
    const effectiveDate = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    if (contractMeta){
      contractMeta.textContent = `Effective Date: ${effectiveDate} · Session: ${pkg.title}`;
    }

    const clientLabel = fullName || 'the Client';
    const emailDisplay = email || '________________';
    const includesListHtml = Array.isArray(pkg.includes) && pkg.includes.length
      ? pkg.includes.map(item => `<li>${item}</li>`).join('')
      : '<li>Portrait photography session deliverables as discussed.</li>';
    const locationLine = pkg.location || 'Gatineau, Ottawa Valley & surrounding areas';

    const contractHTML = `
      <p>THIS AGREEMENT is made as of ${effectiveDate} (the "Effective Date") between ${clientLabel} with a primary contact email of ${emailDisplay} ("Client"), and ${photographerBusiness} ("Photographer").</p>
      <p><strong>1. Engagement of Photographer</strong></p>
      <p><strong>1.1 Services.</strong> Subject to the terms set out herein, Client engages Photographer to provide, and Photographer agrees to provide, the photography services described in this Section 1.1 (the "Services") in connection with the portrait session of ${pkg.title} (the "Portrait Session").</p>
      <p>Date and time of Portrait Session: ${formattedDate} at ${sessionTimeDisplay}.</p>
      <p>Location of Portrait Session: ${locationLine}.</p>
      <p>Description of Services:</p>
      <ul>${includesListHtml}</ul>
      <p>As part of the Services, the Photographer will produce or take similar action to create materials from images and provide related deliverables (as set out above) pursuant to the provision of the Services ("Work Product"). "Images" means photographic material, whether still or moving, created by Photographer pursuant to this Agreement and includes, but is not limited to, transparencies, negatives, prints or digital files, captured, recorded, stored or delivered in any type of medium.</p>
      <p><strong>1.2 Exclusivity.</strong> Client acknowledges and agrees that Photographer will be the exclusive provider of the Services in the Portrait Session, unless otherwise agreed to by the parties in writing.</p>
      <p><strong>2. Fees and Payment</strong></p>
      <p><strong>2.1 Fees.</strong> Client will pay Photographer the fees set out herein ("Fees"), including any applicable federal or provincial sales or value-added taxes due on such Fees.</p>
      <ul>
        <li>Total fee for Services: ${formatMoney(total)}</li>
        <li>Retainer due upon signing: ${formatMoney(deposit)}</li>
        <li>Remaining amount due on date of session: ${formatMoney(balance)}</li>
      </ul>
      <p><strong>2.2 Retainer.</strong> Client acknowledges and agrees that the retainer amount set out above is due upon the signing of this Agreement and is not refundable (the "Retainer"), so as to fairly compensate Photographer for committing time to provide the Services and turning down other potential projects or clients. Both parties agree that the Retainer will be credited towards the total Fees payable by Client.</p>
      <p><strong>2.3 Invoice.</strong> Photographer will issue an invoice to Client upon agreement of the Services (the "Invoice"). Client agrees to pay all Fees outstanding on or prior to the due dates set out in Section 2.1. Any payment after the due date will incur a late fee of 2% per month on the outstanding balance. Client acknowledges that the final amount payable may be subject to change depending on actual expenses incurred. Client confirms and agrees that the final calculations provided in the Invoice, should they be different from the total listed in Section 2.1, will be the final amount payable.</p>
      <p><strong>3. Client Responsibilities</strong></p>
      <p><strong>3.1 Required Consents.</strong> Client will ensure that all required consents, as applicable, have been obtained prior to performance of the Services, including any consents required for the performance of Services and the delivery of Work Product by Photographer and, as applicable, from venues or locales where the Services are to be performed or from participants of the Portrait Session.</p>
      <p><strong>3.2 Expenses.</strong> Client will be responsible for reasonable travel expenses at a rate of ${travelRate} per kilometre incurred by Photographer that are necessary for the performance of the Services or travel that is otherwise requested by Client where the location of the performance of the Services is not within a 100 km radius of Gatineau/Ottawa. Client will be responsible for any other expenses incurred by Photographer that are necessary for the performance of the Services as more particularly set out in Article 2.</p>
      <p><strong>3.3 Meals.</strong> When the number of hours that Photographer will be providing the Services is expected to be in excess of 4 hours in duration, Client will provide a meal for Photographer and Photographer's contractor(s) or be responsible for reasonable meal expenses incurred for which Photographer shall provide an invoice.</p>
      <p><strong>3.4 Waiver.</strong> Client (on behalf of themselves and any other participant whose image or recording may be captured by the Services) hereby waives all rights and claims, and releases Photographer from any claim or cause of action, whether now known or unknown, relating to the sale, display, license, use and exploitation of Images pursuant to this Agreement.</p>
      <p><strong>3.5 Minor Children and Behaviour.</strong> Client is solely responsible for the supervision and behaviour of all participants, including minor children, during the Portrait Session. Photographer is not responsible for uncooperative behaviour or the inability to capture images due to non-compliance, lack of participation, or refusal to be photographed by any subject.</p>
      <p><strong>3.6 Pet Clause.</strong> Client is responsible for the behaviour, handling, and safety of any pets brought to the Portrait Session. Photographer is not liable for injury, accidents, or missed photos resulting from uncooperative or aggressive animals.</p>
      <p><strong>3.7 Damage to Photographer Property.</strong> Client will be held liable for any damage to Photographer's equipment or property caused by Client, Client's children, pets, or guests during the Portrait Session, whether accidental or intentional.</p>
      <p><strong>4. Photographer Responsibilities</strong></p>
      <p><strong>4.1 Equipment.</strong> Client will not be required to supply any photography equipment to Photographer.</p>
      <p><strong>4.2 Manner of Service.</strong> Photographer will ensure that the Services are performed in a good, expedient, workmanlike and safe manner, and in such a manner as to avoid unreasonable interference with Client's activities.</p>
      <p><strong>4.3 Safety & Right to Terminate.</strong> Photographer maintains the right to immediately terminate the Portrait Session at any time if Photographer feels threatened, unsafe, or harassed due to the behaviour or actions of Client or Client's guests. In such instances, Photographer will not be obligated to continue the session or deliver any Work Product. No refunds will be issued, and Client may be held liable for any damages or losses incurred by Photographer as a result of the unsafe conduct.</p>
      <p><strong>5. Artistic Release</strong></p>
      <p><strong>5.1 Consistency.</strong> Photographer will use reasonable efforts to ensure that the Services are produced in a style consistent with Photographer's current portfolio.</p>
      <p><strong>5.2 Style.</strong></p>
      <ul>
        <li>Client has reviewed Photographer's previous work and portfolio and has a reasonable expectation that Photographer will perform the Services in a similar style.</li>
        <li>Photographer will use their artistic judgement when providing the Services, and shall have final say regarding the aesthetic judgement and artistic quality of the Services.</li>
        <li>Disagreement with Photographer's artistic judgement or aesthetic ability are not valid reasons for termination of this Agreement or request of any monies returned.</li>
      </ul>
      <p><strong>5.3 Editing Requests.</strong> Photographer will perform standard colour correction and light retouching as part of the editing process. Requests for additional or advanced retouching (e.g., body modifications, object removals, extensive skin smoothing) may incur an additional editing fee at Photographer's discretion. Client understands that Photographer retains full creative control over the editing style and process.</p>
      <p><strong>6. Image Delivery Timeline and Download Policy</strong></p>
      <p><strong>6.1 Delivery Timeline.</strong> Final edited images will be delivered within 4 weeks of the Portrait Session date unless otherwise agreed in writing.</p>
      <p><strong>6.2 Download Responsibility.</strong> It is the Client's responsibility to download and back up all images within 90 days of delivery. Photographer does not guarantee archival of images after this time. If Photographer still has a copy of the images, a ${reuploadFee} re-upload fee will apply if Client requires access to the gallery after expiration.</p>
      <p><strong>7. Term and Termination</strong></p>
      <p><strong>7.1 Term.</strong> This Agreement will begin on the Effective Date and continue until the latter of (i) the date where all outstanding Fees under this Agreement are paid in full; or (ii) the date where all final Work Product has been delivered (the "Term").</p>
      <p><strong>7.2 Cancellation.</strong> Client may terminate the Agreement ("Cancellation") and/or reschedule the Services ("Rescheduling") by providing Photographer with written notice no later than 14 days before the original date of the Portrait Session (the "Minimum Notice"). Client acknowledges and agrees that Client is not relieved of any payment obligations for Cancellations and Rescheduling unless the Minimum Notice in accordance with this Article 7 is duly provided or unless the parties otherwise agree in writing.</p>
      <p><strong>7.3 Rescheduling.</strong> In the event of Rescheduling, Photographer will use commercially reasonable efforts to accommodate Client's change. If Photographer is not able to accommodate Client's change despite using commercially reasonable efforts, the parties agree that such Rescheduling will be deemed as Cancellation by Client and that Photographer will be under no obligation to perform the Services other than on the original date of the Portrait Session.</p>
      <p><strong>7.4 Weather Conditions.</strong> In the case of outdoor sessions, Photographer reserves the right to postpone the Portrait Session due to inclement weather or unsafe conditions. Photographer will make reasonable efforts to reschedule the session at a mutually agreeable time. If rescheduling is not possible, all fees paid (excluding the non-refundable Retainer) may be applied toward a future session.</p>
      <p><strong>7.5 No Refund.</strong> Client acknowledges and agrees that Cancellation by Client will not result in a refund of any fees paid on or prior to the date of Cancellation by Client.</p>
      <p><strong>7.6 Late Arrivals.</strong> In the event that the Client arrives late to the Portrait Session, the amount of time late may be deducted from the time allotted for the session. Photographer will not provide a refund or other compensation for the time deducted from the session due to late arrival of the Client.</p>
      <p><strong>7.7 Replacement.</strong> If the Photographer is unable to personally perform the Services for any reason, a qualified associate photographer may be engaged to capture the images. The Photographer remains fully responsible for editing, delivering, and fulfilling all obligations under this Agreement. Any replacement photographer will maintain the Photographer's style, standards, and quality, ensuring the Client receives the same experience and final results.</p>
      <p><strong>8. Ownership of Work Product by Photographer</strong></p>
      <p><strong>8.1 Ownership of Work.</strong> Photographer will own all right, title and interest in all Work Product. Client (on behalf of themselves and any participants at the Portrait Session) hereby grants Photographer and any of its service providers an exclusive, royalty-free, worldwide, irrevocable, transferable and sublicensable license to use any materials created by Client or attendees, during the performance of the Services, that may be protected by copyright or any intellectual property rights ("Portrait Session Materials") as part of any Work Product or in connection with the marketing, advertising or promotion of Photographer's services, including in connection with Photographer's studio, portfolio, website or social media, in any format or medium. Client acknowledges and affirms that no other person or entity has any rights that may prevent or restrict Photographer from using Portrait Session Materials as provided herein.</p>
      <p><strong>8.2 Model Release.</strong> Client grants Photographer and its assigns the irrevocable and unrestricted right to use and publish images from the Portrait Session for editorial, advertising, portfolio, website, social media, and any other lawful promotional purposes. Client waives the right to inspect or approve the final images used in such materials.</p>
      <p><strong>8.3 RAW Image Files.</strong> Client acknowledges that Photographer does not provide RAW (unprocessed) image files under any circumstances. Final image delivery includes high-resolution edited JPEG files selected and edited at the Photographer's discretion. RAW files are not considered part of the final deliverables and remain the sole property of the Photographer.</p>
      <p><strong>9. Limited License to Client</strong></p>
      <p><strong>9.1 Personal Use.</strong> Photographer hereby grants Client an exclusive, limited, irrevocable, royalty-free, non-transferable and non-sublicensable license to use Work Product for Client's personal use, provided that Client does not remove any attribution notices or copyright notices included by Photographer in any Work Product. Personal use includes, but is not limited to, use of photos on Client's personal social media pages or profiles; in Client's personal creations, such as scrapbooks, albums or personal gifts; in non-commercial physical display; and in personal communications, such as family newsletters, email, or holiday cards. Client will not make any other use of the Work Product without Photographer's prior written consent, including but not limited to use of the Work Product for commercial sale. Client agrees to refrain from cropping, editing, adding filters, or modifying the delivered images in any way. Photographer kindly requests that Client credit Photographer on any images posted to the Client's social media via a tag @benfusco.photo.</p>
      <p><strong>10. Indemnity and Limitation of Liability</strong></p>
      <p><strong>10.1 Indemnification.</strong> Client agrees to indemnify, defend and hold harmless Photographer and its affiliates, employees, agents and independent contractors for any injury, property damage, liability, claim or other cause of action arising out of or related to the Services and/or Work Product Photographer provides to Client.</p>
      <p><strong>10.2 Force Majeure.</strong> Neither party shall be held in breach of or liable under this Agreement for any delay or non-performance of any provision of this Agreement caused by illness, emergency, fire, strike, pandemic, earthquake, or any other conditions beyond the reasonable control of the non-performing party (each a "Force Majeure Event"), and the time of performance of such provision, if any, shall be deemed to be extended for a period equal to the duration of the conditions preventing performance. If such Force Majeure Event persists for more than 60 days, the party not affected by the Force Majeure Event may terminate the Agreement and any prepaid fees for Services not performed (other than the Retainer) shall be returned within 15 days of the date of termination of the Agreement.</p>
      <p><strong>10.3 Failure to Deliver.</strong> Photographer shall not be held liable for delays in the delivery of Work Product, or any Work Product undeliverable, due to technological malfunctions or service interruptions that are beyond the control of Photographer, including as a result of delays in receipt of instructions from Client and for Work Product that fails to meet the specifications set out in Section 1.1 due to the actions of Client or attendees at the Portrait Session that are beyond the control of Photographer.</p>
      <p><strong>10.4 Maximum Liability.</strong> Notwithstanding anything to the contrary, Client agrees that Photographer's maximum liability arising out of or related to the Services or the Work Product shall not exceed the total Fees payable under this Agreement.</p>
      <p><strong>11. General</strong></p>
      <p><strong>11.1 Notice.</strong> Parties shall provide effective notice ("Notice") to each other via either of the following methods of delivery at the date and time which the Notice is sent:</p>
      <ul>
        <li>Photographer's Email: ${photographerEmail}</li>
        <li>Client's Email: ${emailDisplay}</li>
      </ul>
      <p><strong>11.2 Survival.</strong> Articles 7, 8, 9 and 10 will survive termination of this Agreement.</p>
      <p><strong>11.3 Governing Law.</strong> This Agreement will be governed by the laws of the Province of Ontario, Canada.</p>
      <p><strong>11.4 Amendment.</strong> This Agreement may only be amended, supplemented or otherwise modified by written agreement signed by each of the parties.</p>
      <p><strong>11.5 Entire Agreement.</strong> This Agreement constitutes the entire agreement between the parties with respect to the Services and supersedes all prior agreements and understandings, both formal and informal.</p>
      <p><strong>11.6 Severability.</strong> If any provision of this Agreement is determined to be illegal, invalid or unenforceable, in whole or in part, by an arbitrator or any court of competent jurisdiction, that provision or part thereof will be severed from this Agreement and the remaining part of such provision and all other provisions will continue in full force and effect.</p>
      <p><strong>Signatures</strong></p>
      <p>Client: ${fullName || '________________'}<br>${photographerPerson}, ${photographerBusiness}</p>
    `;

    contractContent.innerHTML = contractHTML;
    contractContent.scrollTop = 0;
  };

  const showContractStep = ()=>{
    resetFeedback();
    if (feedback){
      feedback.textContent = '';
    }
    const details = populateContactSummary();
    buildContractHtml(details);
    if (contactStep) contactStep.hidden = true;
    if (contractStep) contractStep.hidden = false;
    resetSignature();
    if (contractStep){
      contractStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      if (validateContactFields()){
        showContractStep();
      }
    });
  }

  if (editContact){
    editContact.addEventListener('click', ()=>{
      resetFeedback();
      if (contactStep) contactStep.hidden = false;
      if (contractStep) contractStep.hidden = true;
      resetSignature();
      if (contactStep){
        contactStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  if (signButton){
    signButton.addEventListener('click', ()=>{
      const name = summaryContactName?.textContent?.trim() || `${fields.firstName.input?.value.trim() || ''} ${fields.lastName.input?.value.trim() || ''}`.trim() || 'Client';
      const timestamp = new Date().toLocaleString();
      if (signatureInput) signatureInput.value = `${name} | Signed ${timestamp}`;
      if (signatureStatus){
        signatureStatus.textContent = `Signed by ${name} on ${timestamp}`;
        signatureStatus.classList.add('is-signed');
      }
      signButton.textContent = 'Signed — click to update';
      resetFeedback();
    });
  }

  if (agreeCheckbox){
    agreeCheckbox.addEventListener('change', ()=>{
      if (agreeCheckbox.checked){
        resetFeedback();
      }
    });
  }

  if (form){
    form.addEventListener('submit', async (event)=>{
      event.preventDefault();
      resetFeedback();

      const contactValid = validateContactFields();
      if (!contactValid){
        if (contactStep) contactStep.hidden = false;
        if (contractStep) contractStep.hidden = true;
        return;
      }

      if (contractStep && contractStep.hidden){
        showContractStep();
        if (feedback){
          feedback.textContent = 'Please review the agreement, sign it, and submit when ready.';
          feedback.style.color = '#6d7080';
        }
        return;
      }

      if (!signatureInput?.value){
        if (feedback){
          feedback.textContent = 'Please sign the agreement before submitting.';
          feedback.style.color = '#f05a5a';
        }
        if (signatureStatus){
          signatureStatus.textContent = defaultSignatureMessage;
          signatureStatus.classList.remove('is-signed');
        }
        return;
      }

      if (!agreeCheckbox?.checked){
        if (feedback){
          feedback.textContent = 'Please confirm that you agree to the contract before submitting.';
          feedback.style.color = '#f05a5a';
        }
        return;
      }

      const submitButton = form.querySelector('.contract-submit');
      if (submitButton){
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
      }

      try {
        const formData = new FormData(form);
        formData.append('bookingSummary', `${pkg.title} on ${formattedDate} at ${sessionTimeDisplay}`);
        formData.append('contractAcceptedAt', new Date().toISOString());
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
          resetSignature();
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
          submitButton.textContent = 'Submit Booking';
        }
      }
    });
  }
})();
