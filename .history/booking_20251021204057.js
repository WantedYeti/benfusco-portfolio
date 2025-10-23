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

  const packages = {
    mini: {
      id:'mini',
      code:'NR 01',
      title:'Mini Session',
      description:'Perfect for seasonal portraits or a quick refresh.',
      duration:'30 minutes',
      price:'CA$125.00',
      location:'Kingston, Ottawa & Surrounding Areas',
      includes:[
        '30 minute guided session',
        '20 edited high-resolution images',
        'Online gallery delivery'
      ],
      readMore:'pricing.html#mini'
    },
    midi: {
      id:'midi',
      code:'NR 02',
      title:'Midi Session',
      description:'A balanced session for couples, families, or branding.',
      duration:'45 minutes',
      price:'CA$175.00',
      location:'Kingston, Ottawa & Surrounding Areas',
      includes:[
        '45 minute session',
        '35 edited high-resolution images',
        'Online gallery delivery'
      ],
      readMore:'pricing.html#midi'
    },
    maxi: {
      id:'maxi',
      code:'NR 03',
      title:'Maxi Session',
      description:'Full coverage with time for multiple looks and locations.',
      duration:'1 hour',
      price:'CA$225.00',
      location:'Kingston, Brockville, Ottawa & Surrounding Areas',
      includes:[
        '60 minute session',
        '40-50 edited high-resolution images',
        'Online gallery delivery'
      ],
      readMore:'pricing.html#maxi'
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
        // render calendar to full view
        renderFullCalendar(new Date());
        if (dateParam){
          const parts = dateParam.split('-');
          if (parts.length===3){
            const y = Number(parts[0]), m = Number(parts[1])-1, d = Number(parts[2]);
            renderFullCalendar(new Date(y,m,d));
            setTimeout(()=>{
              const btn = Array.from(document.querySelectorAll('#bkDatesFull .bk-date')).find(b=>b.textContent.trim()==String(d) && !b.classList.contains('disabled'));
              if (btn) btn.click();
            },50);
          }
        }
      }
    }catch(e){/* ignore */}
  })();
  
  // Full calendar renderer (renders into #bkDatesFull and small month header)
  function renderFullCalendar(d){
    const target = document.getElementById('bkDatesFull');
    const monthEl = document.getElementById('fullCalMonth');
    let cur = new Date(d.getFullYear(), d.getMonth(), 1);
    monthEl.textContent = cur.toLocaleString(undefined,{month:'long', year:'numeric'});
    target.innerHTML = '';
    const startDay = new Date(cur.getFullYear(), cur.getMonth(), 1).getDay();
    const daysInMonth = new Date(cur.getFullYear(), cur.getMonth()+1, 0).getDate();
    for(let i=0;i<startDay;i++){ target.appendChild(document.createElement('div')); }
    const todayIso = new Date().toISOString().slice(0,10);
    for(let day=1; day<=daysInMonth; day++){
      const iso = new Date(cur.getFullYear(), cur.getMonth(), day).toISOString().slice(0,10);
      const b = document.createElement('button'); b.className='bk-date'; b.textContent=String(day);
      if (iso < todayIso) b.classList.add('disabled');
      b.addEventListener('click', ()=>{
        if (b.classList.contains('disabled')) return;
        document.querySelectorAll('#bkDatesFull .bk-date').forEach(x=>x.classList.remove('selected'));
        b.classList.add('selected');
        // populate times for selected date
        renderTimesForFull(iso);
      });
      target.appendChild(b);
    }
  }

  function renderTimesForFull(iso){
    const grid = document.getElementById('bkTimesFull'); grid.innerHTML='';
    // simple times as example
    const times = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00'];
    times.forEach(t=>{
      const btn = document.createElement('button'); btn.textContent = t; btn.addEventListener('click', ()=>{
        document.querySelectorAll('#bkTimesFull button').forEach(x=>x.classList.remove('selected'));
        btn.classList.add('selected');
        // store selection (could update a hidden field or display a summary)
        document.getElementById('bkContinueFull').dataset.date = iso; document.getElementById('bkContinueFull').dataset.time = t;
      });
      grid.appendChild(btn);
    });
  }

  // wire continue
  document.getElementById('bkContinueFull').addEventListener('click', function(){
    const date = this.dataset.date; const time = this.dataset.time;
    if(!date || !time){ alert('Please select a date and time.'); return; }
    const params = new URLSearchParams(); params.set('pkg', (new URLSearchParams(location.search)).get('pkg') || ''); params.set('date', date); params.set('time', time);
    // navigate to contact with selection
    location.href = 'contact.html?' + params.toString();
  });
})();
