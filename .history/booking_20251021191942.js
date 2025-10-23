(function(){
  function qs(name){
    const u = new URL(location.href);
    return u.searchParams.get(name);
  }
  async function loadPackages(){
    try{
      const r = await fetch('data/packages.json', {cache:'no-store'});
      if(!r.ok) throw new Error('Packages not found');
      return await r.json();
    } catch(err){ console.error(err); return {}; }
  }
  function fill(pkg){
    if(!pkg){ document.getElementById('pkgTitle').textContent='Package not found'; return; }
    document.getElementById('pkgCode').textContent = pkg.code || '';
    document.getElementById('pkgTitle').textContent = pkg.title || '';
    document.getElementById('pkgDesc').textContent = pkg.description || '';
    document.getElementById('pkgPrice').textContent = pkg.price || '';
    const list = document.getElementById('pkgList'); list.innerHTML='';
    if(pkg.duration) { const li = document.createElement('li'); li.textContent = 'Duration: ' + pkg.duration; list.appendChild(li); }
    if(pkg.location) { const li = document.createElement('li'); li.textContent = 'Location: ' + pkg.location; list.appendChild(li); }
    if(pkg.edited) { const li = document.createElement('li'); li.textContent = 'Edited images: ' + pkg.edited; list.appendChild(li); }
    document.getElementById('pkgDuration').textContent = pkg.duration || '—';
    document.getElementById('pkgLocation').textContent = pkg.location || '—';
    document.getElementById('pkgEdited').textContent = pkg.edited || '—';
    const proceed = document.getElementById('proceedBtn');
    proceed.href = 'contact.html?pkg=' + encodeURIComponent(pkg.id) + '&title=' + encodeURIComponent(pkg.title);
    proceed.textContent = pkg.contactCTA || 'Proceed to contact';
  }
  // small date picker + timeslots
  function mkDateGrid(){
    const root = document.getElementById('datePicker');
    const slots = document.getElementById('timeSlots');
    root.innerHTML=''; slots.innerHTML='';
    const today = new Date();
    const days = 21;
    for(let i=0;i<days;i++){
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate()+i);
      const btn = document.createElement('button');
      btn.type='button'; btn.className='date-btn';
      btn.style.margin='4px'; btn.style.padding='8px 10px'; btn.style.border='1px solid #e5e5e5'; btn.style.background='#fff';
      btn.textContent = d.toLocaleDateString(undefined,{weekday:'short', month:'short', day:'numeric'});
      btn.dataset.iso = d.toISOString().slice(0,10);
      btn.addEventListener('click', ()=>{
        // highlight
        document.querySelectorAll('#datePicker .date-btn').forEach(x=>x.style.boxShadow='');
        btn.style.boxShadow='0 6px 18px rgba(0,0,0,0.06)';
        renderTimesFor(d);
      });
      root.appendChild(btn);
      if(i===0){ btn.click(); }
    }
  }

  function renderTimesFor(d){
    const slots = document.getElementById('timeSlots');
    slots.innerHTML='';
    // simple set of times: 9am - 6pm every 30m
    const times = [];
    for(let h=9; h<=17; h++){
      times.push({h, m:0}); times.push({h, m:30});
    }
    times.push({h:18,m:0});
    times.forEach(t=>{
      const td = new Date(d.getFullYear(), d.getMonth(), d.getDate(), t.h, t.m);
      const btn = document.createElement('button'); btn.type='button'; btn.className='time-btn';
      btn.style.padding='8px'; btn.style.border='1px solid #e5e5e5'; btn.style.background='#fff';
      btn.textContent = td.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
      btn.dataset.time = td.toTimeString().slice(0,5);
      btn.addEventListener('click', ()=>{
        document.querySelectorAll('#timeSlots .time-btn').forEach(x=>x.style.outline='');
        btn.style.outline='3px solid rgba(0,0,0,0.06)';
        btn.dataset.selected = '1';
        btn.dataset.date = d.toISOString().slice(0,10);
        // mark selection
        document.getElementById('timeSlots').dataset.selectedDate = d.toISOString().slice(0,10);
        document.getElementById('timeSlots').dataset.selectedTime = btn.dataset.time;
      });
      slots.appendChild(btn);
    });
  }

  // handle continue
  document.addEventListener('DOMContentLoaded', function(){
    const cont = document.getElementById('continueBooking');
    if(cont){
      cont.addEventListener('click', function(){
        const selDate = document.getElementById('timeSlots').dataset.selectedDate;
        const selTime = document.getElementById('timeSlots').dataset.selectedTime;
        const params = new URLSearchParams(location.search);
        const pkg = params.get('pkg') || 'mini';
        if(!selDate || !selTime){ alert('Please choose a date and time slot.'); return; }
        // navigate to contact with package and datetime
        const title = params.get('title') || '';
        const qs = new URLSearchParams();
        qs.set('pkg', pkg); qs.set('title', title); qs.set('date', selDate); qs.set('time', selTime);
        location.href = 'contact.html?' + qs.toString();
      });
    }
    mkDateGrid();
  });
  // init
  (async function(){
    const pkgs = await loadPackages();
    const id = qs('pkg') || 'mini';
    fill(pkgs[id]);
  })();
})();
