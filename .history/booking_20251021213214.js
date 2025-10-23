(function(){
  // Booking page logic: render cards, open modal, calendar and form
  const container = document.getElementById('bkGrid');
  const modal = document.getElementById('bkModal');
  const bkDates = document.getElementById('bkDates');
  const calMonth = document.getElementById('calMonth');
  const calPrev = document.getElementById('calPrev');
  const calNext = document.getElementById('calNext');
  const bkSelectedDate = document.getElementById('bkSelectedDate');
  const bkForm = document.getElementById('bkForm');
  const bkClose = document.getElementById('bkClose');
  const fullCalPrev = document.getElementById('fullCalPrev');
  const fullCalNext = document.getElementById('fullCalNext');
  const fullCalMonth = document.getElementById('fullCalMonth');
  const bkDatesFull = document.getElementById('bkDatesFull');
  const selectedFullLabel = document.getElementById('bkSelectedFull');
  const timesFull = document.getElementById('bkTimesFull');
  const continueFull = document.getElementById('bkContinueFull');
  const altRequestLink = document.getElementById('bkAltRequest');

  if (fullCalPrev){
    fullCalPrev.addEventListener('click', ()=>{
      renderFullCalendar(new Date(fullCurrent.getFullYear(), fullCurrent.getMonth()-1, 1));
    });
  }
  if (fullCalNext){
    fullCalNext.addEventListener('click', ()=>{
      renderFullCalendar(new Date(fullCurrent.getFullYear(), fullCurrent.getMonth()+1, 1));
    });
  }
  let activePackage = null;
  let fullCurrent = new Date();
  let selectedFullDate = null;
  let selectedFullTime = null;

  const packages = {
    mini: {
      id:'mini',
      code:'NR 01',
      title:'Mini Session',
      description:'Perfect for seasonal portraits or a quick refresh.',
      duration:'30 minutes',
      price:'CA$125.00',
  location:'Gatineau, Ottawa & surrounding areas',
      includes:[
        '30 minute guided session',
        '20 edited high-resolution images',
        'Online gallery delivery'
      ],
      readMore:'pricing.html#mini',
      slots:{
        am:['09:00 AM','10:00 AM','11:00 AM'],
        pm:['01:00 PM','02:00 PM']
      }
    },
    midi: {
      id:'midi',
      code:'NR 02',
      title:'Midi Session',
      description:'A balanced session for couples, families, or branding.',
      duration:'45 minutes',
      price:'CA$175.00',
  location:'Gatineau, Ottawa & surrounding areas',
      includes:[
        '45 minute session',
        '35 edited high-resolution images',
        'Online gallery delivery'
      ],
      readMore:'pricing.html#midi',
      slots:{
        am:['09:30 AM','10:30 AM','11:30 AM'],
        pm:['01:30 PM','02:30 PM','03:30 PM']
      }
    },
    maxi: {
      id:'maxi',
      code:'NR 03',
      title:'Maxi Session',
      description:'Full coverage with time for multiple looks and locations.',
      duration:'1 hour',
      price:'CA$225.00',
  location:'Gatineau, Ottawa Valley & surrounding areas',
      includes:[
        '60 minute session',
        '40-50 edited high-resolution images',
        'Online gallery delivery'
      ],
      readMore:'pricing.html#maxi',
      slots:{
        am:['09:00 AM','10:00 AM','11:00 AM'],
        pm:['02:00 PM','03:00 PM','04:00 PM']
      }
    }
  };

  function makeCard(p){
    const a = document.createElement('article'); a.className='bk-card';
  a.innerHTML = `<div class="bk-code">${p.code}</div><h3 class="bk-name">${p.title}</h3><p class="bk-desc">${p.description}</p><div class="bk-meta"><div>${p.duration}</div><div class="bk-price">${p.price}</div></div><div class="bk-meta-small">${p.location}</div><div><button class="bk-cta" data-id="${p.id}">Book Now</button></div>`;
    return a;
  }

  // populate grid
  Object.values(packages).forEach(p => container.appendChild(makeCard(p)));

  // modal helpers
  function openModal(pkg){
    document.getElementById('bkCode').textContent = pkg.code;
    document.getElementById('bkName').textContent = pkg.title;
    document.getElementById('bkShort').textContent = pkg.description;
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
    renderCalendar(new Date());
  }
  function closeModal(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }

  // attach book now handlers
  container.addEventListener('click', function(e){
    const btn = e.target.closest('.bk-cta'); if(!btn) return;
    const id = btn.dataset.id; if(!id) return; openModal(packages[id]);
  });
  bkClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e)=>{ if(e.target === modal) closeModal(); });

  // calendar
  let current = new Date();
  const unavailable = {}; // example: {'2025-10-28': true}
  function firstDayOfMonth(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
  function renderCalendar(d){
    current = new Date(d.getFullYear(), d.getMonth(), 1);
    calMonth.textContent = current.toLocaleString(undefined,{month:'long', year:'numeric'});
    bkDates.innerHTML = '';
    const startDay = firstDayOfMonth(current).getDay();
    const daysInMonth = new Date(current.getFullYear(), current.getMonth()+1, 0).getDate();
    // fill blanks
    for(let i=0;i<startDay;i++){ const blank = document.createElement('div'); bkDates.appendChild(blank); }
    const todayIso = new Date().toISOString().slice(0,10);
    for(let day=1; day<=daysInMonth; day++){
      const el = document.createElement('button'); el.className='bk-date';
      const iso = new Date(current.getFullYear(), current.getMonth(), day).toISOString().slice(0,10);
      el.textContent = String(day);
      if(iso < todayIso){ el.classList.add('disabled'); }
      if(unavailable[iso]) el.classList.add('disabled');
      el.addEventListener('click', ()=>{
        if(el.classList.contains('disabled')) return;
        document.querySelectorAll('.bk-date').forEach(x=>x.classList.remove('selected'));
        el.classList.add('selected');
        bkSelectedDate.textContent = iso;
        bkSelectedDate.dataset.iso = iso;
      });
      bkDates.appendChild(el);
    }
  }
  calPrev.addEventListener('click', ()=>{ renderCalendar(new Date(current.getFullYear(), current.getMonth()-1, 1)); });
  calNext.addEventListener('click', ()=>{ renderCalendar(new Date(current.getFullYear(), current.getMonth()+1, 1)); });

  // submit
  bkForm.addEventListener('submit', function(e){
    e.preventDefault();
    const name = document.getElementById('bkFullName').value;
    const email = document.getElementById('bkEmail').value;
    const phone = document.getElementById('bkPhone').value;
    const date = bkSelectedDate.dataset.iso || null;
    const notes = document.getElementById('bkNotes').value;
    if(!date){ alert('Please select a date from the calendar'); return; }
    console.log('Booking request', { name, email, phone, date, notes });
    document.getElementById('bkThanks').style.display = 'block';
    bkForm.querySelectorAll('input, textarea, button').forEach(i=>i.disabled=true);
    setTimeout(()=>{ closeModal(); bkForm.querySelectorAll('input, textarea, button').forEach(i=>i.disabled=false); document.getElementById('bkThanks').style.display='none'; bkForm.reset(); }, 1400);
  });

  // init small accessibility niceties
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeModal(); });
  // If URL includes ?pkg=..., auto-open that package's modal and optionally preselect date
  (function checkQuery(){
    try{
      const params = new URLSearchParams(window.location.search);
      const pkgId = params.get('pkg');
      const dateParam = params.get('date');
      if (pkgId && packages[pkgId]){
        // Full-page flow: show full view and populate
        const full = document.getElementById('bkFullView');
        const fullCode = document.getElementById('fullCode');
        const fullName = document.getElementById('fullName');
        const fullShort = document.getElementById('fullShort');
        const fullDuration = document.getElementById('fullDuration');
        const fullPrice = document.getElementById('fullPrice');
        const fullLocation = document.getElementById('fullLocation');
        const fullIncludes = document.getElementById('fullIncludes');
        const fullMore = document.getElementById('fullMore');
        const pkg = packages[pkgId];
        activePackage = pkg;
        selectedFullDate = null;
        selectedFullTime = null;
        if (altRequestLink){
          altRequestLink.href = `contact.html?pkg=${pkg.id}&request=custom`;
        }
        if (selectedFullLabel){
          selectedFullLabel.textContent = 'Select a date to see available times';
        }
        showTimesPlaceholder();
        if (continueFull){
          continueFull.dataset.date = '';
          continueFull.dataset.time = '';
        }
        fullCode.textContent = pkg.code;
        fullName.textContent = pkg.title;
        fullShort.textContent = pkg.description;
        fullDuration.textContent = pkg.duration;
        fullPrice.textContent = pkg.price;
        fullLocation.textContent = pkg.location || '';
        fullIncludes.innerHTML = '';
        if (Array.isArray(pkg.includes)){
          pkg.includes.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            fullIncludes.appendChild(li);
          });
        }
        if (pkg.readMore){
          fullMore.href = pkg.readMore;
          fullMore.removeAttribute('hidden');
        } else {
          fullMore.setAttribute('hidden','');
        }
        full.hidden = false;
        document.querySelector('.bk-page').style.display = 'none';
        document.body.classList.add('bk-fullview-active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        let initialDate = new Date();
        let preselectIso = null;
        const timeParam = params.get('time');
        if (dateParam){
          const parts = dateParam.split('-');
          if (parts.length===3){
            const y = Number(parts[0]);
            const m = Number(parts[1])-1;
            const d = Number(parts[2]);
            if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)){
              initialDate = new Date(y, m, 1);
              preselectIso = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
              selectedFullDate = preselectIso;
              selectedFullTime = timeParam || null;
            }
          }
        }
        renderFullCalendar(initialDate);
        if (preselectIso){
          renderTimesForFull(preselectIso);
          requestAnimationFrame(()=>{
            const day = Number(preselectIso.slice(-2));
            const btn = Array.from(document.querySelectorAll('#bkDatesFull .bk-date')).find(b=>Number(b.textContent.trim())===day && !b.classList.contains('disabled'));
            if (btn){
              btn.classList.add('selected');
            }
          });
        }
      }
    }catch(e){/* ignore */}
  })();

  const backButton = document.getElementById('bkBack');
  if (backButton){
    backButton.addEventListener('click', ()=>{
      window.location.href = 'pricing.html';
    });
  }
  
  // Full calendar renderer (renders into #bkDatesFull and small month header)
  function renderFullCalendar(d){
    if (!bkDatesFull || !fullCalMonth) return;
    fullCurrent = new Date(d.getFullYear(), d.getMonth(), 1);
    fullCalMonth.textContent = fullCurrent.toLocaleString(undefined,{month:'long', year:'numeric'});
    bkDatesFull.innerHTML = '';
    const startDay = fullCurrent.getDay();
    const daysInMonth = new Date(fullCurrent.getFullYear(), fullCurrent.getMonth()+1, 0).getDate();
    for(let i=0;i<startDay;i++){ bkDatesFull.appendChild(document.createElement('div')); }
    const todayIso = new Date().toISOString().slice(0,10);
    for(let day=1; day<=daysInMonth; day++){
      const iso = new Date(fullCurrent.getFullYear(), fullCurrent.getMonth(), day).toISOString().slice(0,10);
      const b = document.createElement('button');
      b.className='bk-date';
      b.textContent=String(day);
      if (iso < todayIso) b.classList.add('disabled');
      if (unavailable[iso]) b.classList.add('disabled');
      if (iso === selectedFullDate) b.classList.add('selected');
      b.addEventListener('click', ()=>{
        if (b.classList.contains('disabled')) return;
        document.querySelectorAll('#bkDatesFull .bk-date').forEach(x=>x.classList.remove('selected'));
        b.classList.add('selected');
        selectedFullDate = iso;
        selectedFullTime = null;
        if (continueFull){
          continueFull.dataset.date = iso;
          continueFull.dataset.time = '';
        }
        renderTimesForFull(iso);
      });
      bkDatesFull.appendChild(b);
    }
  }

  function showTimesPlaceholder(){
    if (!timesFull) return;
    timesFull.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'bk-no-times';
    p.textContent = 'Select a date to see available times';
    timesFull.appendChild(p);
  }

  function renderTimesForFull(iso){
    if (!timesFull) return;
    timesFull.innerHTML='';
    const pkg = activePackage || {};
    const slots = pkg.slots || {
      am:['09:00 AM','10:00 AM','11:00 AM'],
      pm:['01:00 PM','02:00 PM','03:00 PM']
    };
    if (selectedFullLabel){
      selectedFullLabel.textContent = formatFullDateLabel(iso);
    }
    if (continueFull){
      continueFull.dataset.date = iso;
      continueFull.dataset.time = selectedFullTime || '';
    }
    let hasTimes = false;
    Object.entries(slots).forEach(([period, arr])=>{
      if (!Array.isArray(arr) || !arr.length) return;
      hasTimes = true;
      const group = document.createElement('div');
      group.className = 'bk-time-group';
      const title = document.createElement('div');
      title.className = 'bk-time-group-title';
      title.textContent = period.toUpperCase();
      const list = document.createElement('div');
      list.className = 'bk-times-grid';
      arr.forEach(t=>{
        const btn = document.createElement('button');
        btn.textContent = t;
        if (t === selectedFullTime) btn.classList.add('selected');
        btn.addEventListener('click', ()=>{
          selectedFullTime = t;
          document.querySelectorAll('#bkTimesFull button').forEach(x=>x.classList.remove('selected'));
          btn.classList.add('selected');
          if (continueFull){
            continueFull.dataset.date = iso;
            continueFull.dataset.time = t;
          }
        });
        list.appendChild(btn);
      });
      group.appendChild(title);
      group.appendChild(list);
      timesFull.appendChild(group);
    });
    if (!hasTimes){
      const empty = document.createElement('p');
      empty.className = 'bk-no-times';
      empty.textContent = 'No times are available for this date. Please choose another day or submit a request.';
      timesFull.appendChild(empty);
    }
  }

  function formatFullDateLabel(iso){
    const date = new Date(`${iso}T00:00:00`);
    const formatted = date.toLocaleDateString(undefined, { weekday:'long', month:'long', day:'numeric', year:'numeric' });
    return `${formatted} · Gatineau (Eastern Time)`;
  }

  // wire continue
  if (continueFull){
    continueFull.addEventListener('click', function(){
      const date = this.dataset.date;
      const time = this.dataset.time;
      if(!date || !time){ alert('Please select a date and time.'); return; }
      const searchPkg = new URLSearchParams(location.search).get('pkg') || (activePackage ? activePackage.id : '');
      const params = new URLSearchParams();
      if (searchPkg) params.set('pkg', searchPkg);
      params.set('date', date);
      params.set('time', time);
      location.href = 'contact.html?' + params.toString();
    });
  }
})();
