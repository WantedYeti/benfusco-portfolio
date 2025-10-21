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
  // init
  (async function(){
    const pkgs = await loadPackages();
    const id = qs('pkg') || 'mini';
    fill(pkgs[id]);
  })();
})();
