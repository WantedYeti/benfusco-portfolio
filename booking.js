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
    mini: { id:'mini', code:'NR 01', title:'Mini Session', description:'Short session for seasonal or quick portraits.', duration:'15 minutes', price:'$125' },
    midi: { id:'midi', code:'NR 02', title:'Midi Session', description:'Balanced session for couples or families.', duration:'30 minutes', price:'$175' },
    maxi: { id:'maxi', code:'NR 03', title:'Maxi Session', description:'Full session for variety and coverage.', duration:'60 minutes', price:'$225' }
  };

  function makeCard(p){
    const a = document.createElement('article'); a.className='bk-card';
    a.innerHTML = `<div class="bk-code">${p.code}</div><h3 class="bk-name">${p.title}</h3><p class="bk-desc">${p.description}</p><div class="bk-meta"><div>${p.duration}</div><div class="bk-price">${p.price}</div></div><div><button class="bk-cta" data-id="${p.id}">Book Now</button></div>`;
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
})();
