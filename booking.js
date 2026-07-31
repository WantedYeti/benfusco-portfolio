(function () {
  'use strict';

  const packages = window.BK_PACKAGES || {};
  const settings = window.BK_SETTINGS || {};
  const grid = document.getElementById('bookingGrid');
  const catalog = document.getElementById('bookingCatalog');
  const intro = document.getElementById('bookingIntro');
  const scheduler = document.getElementById('bookingScheduler');
  if (!grid || !scheduler) return;

  const els = {
    hero: document.getElementById('schedulerHero'),
    code: document.getElementById('selectedPackageCode'),
    title: document.getElementById('selectedPackageTitle'),
    description: document.getElementById('selectedPackageDescription'),
    back: document.getElementById('schedulerBack'),
    month: document.getElementById('calendarMonth'),
    prev: document.getElementById('calendarPrev'),
    next: document.getElementById('calendarNext'),
    dates: document.getElementById('calendarDates'),
    dateLabel: document.getElementById('selectedDateLabel'),
    times: document.getElementById('timeOptions'),
    summaryCode: document.getElementById('summaryCode'),
    summaryTitle: document.getElementById('summaryTitle'),
    duration: document.getElementById('summaryDuration'),
    price: document.getElementById('summaryPrice'),
    location: document.getElementById('summaryLocation'),
    includes: document.getElementById('summaryIncludes'),
    retainer: document.getElementById('summaryRetainer'),
    selection: document.getElementById('summarySelection'),
    continue: document.getElementById('schedulerContinue')
  };

  let activePackage = null;
  let selectedDate = '';
  let selectedTime = '';
  let currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  function money(value, currency) {
    if (value === null || value === undefined) return '';
    return `${currency || 'CA$'}${Number(value).toLocaleString('en-CA', { maximumFractionDigits: 0 })}`;
  }

  function packagePrice(pkg) {
    return pkg.priceLabel || money(pkg.price, pkg.currency);
  }

  function localISO(date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  function parseLocalISO(iso) {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function cardTemplate(pkg) {
    const article = document.createElement('article');
    article.className = 'booking-card';
    article.dataset.category = pkg.group || pkg.category;
    const vectorClass = pkg.image.endsWith('.svg') ? ' booking-card-image-vector' : '';
    article.innerHTML = `
      <img class="booking-card-image${vectorClass}" src="${pkg.image}" alt="${pkg.service} by Fusco Media" loading="lazy" decoding="async" width="900" height="650">
      <div class="booking-card-body">
        <p class="summary-code">${pkg.code}</p>
        <h3>${pkg.title}</h3>
        <p>${pkg.description}</p>
        <div class="booking-card-meta"><span>${pkg.duration}</span><strong>${packagePrice(pkg)}</strong></div>
        <button type="button" class="btn btn-dark" data-package-id="${pkg.id}">${pkg.price === null ? 'Request this service' : 'Select package'}</button>
      </div>`;
    return article;
  }

  Object.values(packages).forEach((pkg) => grid.appendChild(cardTemplate(pkg)));

  document.querySelectorAll('[data-booking-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.bookingFilter;
      document.querySelectorAll('[data-booking-filter]').forEach((item) => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      grid.querySelectorAll('.booking-card').forEach((card) => {
        card.hidden = filter !== 'all' && card.dataset.category !== filter;
      });
    });
  });

  grid.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-package-id]');
    if (!trigger) return;
    openScheduler(trigger.dataset.packageId, true);
  });

  function openScheduler(packageId, updateHistory) {
    const pkg = packages[packageId];
    if (!pkg) return;
    activePackage = pkg;
    selectedDate = '';
    selectedTime = '';
    currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    els.hero.style.backgroundImage = `url("${pkg.image}")`;
    els.hero.classList.toggle('scheduler-hero-vector', pkg.image.endsWith('.svg'));
    els.code.textContent = pkg.code;
    els.title.textContent = pkg.title;
    els.description.textContent = pkg.description;
    els.summaryCode.textContent = pkg.code;
    els.summaryTitle.textContent = pkg.title;
    els.duration.textContent = pkg.duration;
    els.price.textContent = packagePrice(pkg);
    els.location.textContent = pkg.location;
    els.includes.innerHTML = '';
    pkg.includes.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      els.includes.appendChild(li);
    });
    els.retainer.textContent = pkg.category === 'real-estate'
      ? `No standard retainer. Payment is due before unwatermarked, full-resolution delivery; approved brokerage accounts may receive Net 7 terms.`
      : pkg.deposit
        ? `No payment is due now. Any retainer and permitted payment method will be confirmed in the client-specific final agreement.`
        : `No payment is required to submit this inquiry.`;
    els.dateLabel.textContent = 'Select a date';
    els.times.innerHTML = '<p class="time-placeholder">Available preferences will appear here.</p>';
    updateSelection();
    renderCalendar();

    intro.hidden = true;
    catalog.hidden = true;
    scheduler.hidden = false;
    document.body.classList.add('scheduler-open');
    if (updateHistory) history.pushState({ packageId }, '', `booking.html?pkg=${encodeURIComponent(packageId)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeScheduler(updateHistory) {
    scheduler.hidden = true;
    catalog.hidden = false;
    intro.hidden = false;
    document.body.classList.remove('scheduler-open');
    activePackage = null;
    if (updateHistory) history.pushState({}, '', 'booking.html');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  els.back.addEventListener('click', () => closeScheduler(true));
  window.addEventListener('popstate', () => {
    const packageId = new URLSearchParams(location.search).get('pkg');
    if (packageId && packages[packageId]) openScheduler(packageId, false);
    else closeScheduler(false);
  });

  function renderCalendar() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    const earliestMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    els.prev.disabled = currentMonth <= earliestMonth;
    els.next.disabled = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1) > maxDate;
    els.month.textContent = currentMonth.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
    els.dates.innerHTML = '';

    const firstDay = currentMonth.getDay();
    const dayCount = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    for (let index = 0; index < firstDay; index += 1) {
      const blank = document.createElement('span');
      blank.className = 'calendar-blank';
      els.dates.appendChild(blank);
    }
    for (let day = 1; day <= dayCount; day += 1) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const iso = localISO(date);
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = day;
      button.className = 'calendar-date';
      button.setAttribute('aria-label', date.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
      if (date < today || date > maxDate) button.disabled = true;
      if (iso === selectedDate) button.classList.add('selected');
      button.addEventListener('click', () => chooseDate(iso));
      els.dates.appendChild(button);
    }
  }

  function chooseDate(iso) {
    selectedDate = iso;
    selectedTime = '';
    renderCalendar();
    const date = parseLocalISO(iso);
    els.dateLabel.textContent = date.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    renderTimes();
    updateSelection();
  }

  function renderTimes() {
    els.times.innerHTML = '';
    Object.entries(activePackage.slots).forEach(([period, times]) => {
      const group = document.createElement('div');
      group.className = 'time-group';
      const label = document.createElement('span');
      label.className = 'time-group-label';
      label.textContent = period;
      const options = document.createElement('div');
      options.className = 'time-group-options';
      times.forEach((time) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = time;
        button.className = 'time-option';
        button.setAttribute('aria-pressed', String(selectedTime === time));
        button.addEventListener('click', () => {
          selectedTime = time;
          els.times.querySelectorAll('.time-option').forEach((item) => {
            const active = item === button;
            item.classList.toggle('selected', active);
            item.setAttribute('aria-pressed', String(active));
          });
          updateSelection();
        });
        options.appendChild(button);
      });
      group.append(label, options);
      els.times.appendChild(group);
    });
  }

  function updateSelection() {
    const ready = Boolean(activePackage && selectedDate && selectedTime);
    els.continue.disabled = !ready;
    if (!ready) {
      els.selection.textContent = selectedDate ? 'Choose a preferred time to continue.' : 'Choose a preferred date and time to continue.';
      return;
    }
    const dateText = parseLocalISO(selectedDate).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });
    els.selection.innerHTML = `<strong>Requested:</strong> ${dateText}<br>${selectedTime} · ${settings.timezoneLabel || 'Eastern Time'}`;
  }

  els.prev.addEventListener('click', () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  els.next.addEventListener('click', () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  els.continue.addEventListener('click', () => {
    if (!activePackage || !selectedDate || !selectedTime) return;
    const request = { packageId: activePackage.id, date: selectedDate, time: selectedTime, savedAt: new Date().toISOString() };
    sessionStorage.setItem('bfmBookingSelection', JSON.stringify(request));
    const params = new URLSearchParams({ pkg: activePackage.id, date: selectedDate, time: selectedTime });
    location.href = `booking-confirm.html?${params.toString()}`;
  });

  const initialId = new URLSearchParams(location.search).get('pkg');
  if (initialId && packages[initialId]) openScheduler(initialId, false);
}());
