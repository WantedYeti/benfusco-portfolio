(function(){
  const packages = window.BK_PACKAGES || {};
  const params = new URLSearchParams(window.location.search);
  const pkgId = params.get('pkg');
  const dateParam = params.get('date');
  const timeParam = params.get('time');

  const main = document.getElementById('confirmMain');
  const emptyState = document.getElementById('confirmEmpty');
  const backLink = document.getElementById('confirmBack');

  if (pkgId){
    backLink.href = `booking.html?pkg=${encodeURIComponent(pkgId)}` + (dateParam ? `&date=${encodeURIComponent(dateParam)}` : '');
  }

  if (!pkgId || !packages[pkgId] || !dateParam || !timeParam){
    if (emptyState) emptyState.hidden = false;
    if (main) main.hidden = true;
    return;
  }

  const pkg = packages[pkgId];
  const currency = pkg.currency || '$';
  const formatMoney = (value)=>{
    if (typeof value === 'number') return `${currency}${value.toFixed(2)}`;
    if (typeof value === 'string' && value.startsWith(currency)) return value;
    return `${currency}${value}`;
  };

  const sessionDate = new Date(`${dateParam}T00:00:00`);
  const formattedDate = sessionDate.toLocaleDateString(undefined, { weekday:'long', month:'long', day:'numeric', year:'numeric' });
  const formattedTime = `${timeParam} · Gatineau (Eastern Time)`;
  const total = typeof pkg.price === 'number' ? pkg.price : parseFloat(String(pkg.price).replace(/[^0-9.]/g,'')) || 0;
  const deposit = pkg.deposit ?? Math.round(total * 0.25);
  const balance = Math.max(0, total - deposit);

  // Summary content
  const setText = (id, value)=>{ const el = document.getElementById(id); if (el) el.textContent = value; };
  setText('summaryCode', pkg.code || '');
  setText('summaryTitle', pkg.title || '');
  setText('summaryDesc', pkg.description || '');
  setText('summaryDate', formattedDate);
  setText('summaryTime', formattedTime);
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

  // Hidden fields for submission
  const assign = (id, value)=>{ const el = document.getElementById(id); if (el) el.value = value; };
  assign('hiddenPackageId', pkg.id);
  assign('hiddenPackageTitle', pkg.title || '');
  assign('hiddenSessionDate', formattedDate);
  assign('hiddenSessionTime', formattedTime);
  assign('hiddenSessionPrice', formatMoney(total));
  assign('hiddenDepositDue', formatMoney(deposit));

  if (main) main.hidden = false;
  if (emptyState) emptyState.hidden = true;

  // Form validation + submission
  const form = document.getElementById('confirmForm');
  const feedback = document.getElementById('formFeedback');
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

  Object.values(fields).forEach(field => {
    if (field.input){
      field.input.addEventListener('input', ()=> clearError(field));
      field.input.addEventListener('blur', ()=>{
        if (!field.input.value.trim()){
          setError(field, field.message);
        } else if (field.validator && !field.validator(field.input.value.trim())){
          setError(field, field.message);
        }
      });
    }
  });

  if (form){
    form.addEventListener('submit', async (event)=>{
      event.preventDefault();
      if (feedback) feedback.textContent = '';

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
      if (hasError) return;

      const submitButton = form.querySelector('.confirm-submit');
      if (submitButton){
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
      }

      try {
        const formData = new FormData(form);
        formData.append('bookingSummary', `${pkg.title} on ${formattedDate} at ${timeParam}`);
        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });
        if (response.ok){
          if (feedback){
            feedback.textContent = 'Thank you! Your booking request has been sent. I will be in touch soon.';
            feedback.style.color = '#2b6b2b';
          }
          form.reset();
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
          submitButton.textContent = 'Confirm Booking';
        }
      }
    });
  }
})();
