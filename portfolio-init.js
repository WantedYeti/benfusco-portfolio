(function(){
  const CATEGORIES = [
    { key: 'weddings', folder: 'Weddings' },
    { key: 'couples', folder: 'Couples' },
    { key: 'portraits', folder: 'Portraits' },
    { key: 'fitness', folder: 'Gym Portraits' },
    { key: 'events', folder: 'Concerts' }
  ];
  const INITIAL_VISIBLE = 24; // how many "All" tiles show before Load More

  const grid = document.getElementById('portfolioGrid');
  const emptyMsg = document.getElementById('portfolioEmpty');
  const loadMoreBtn = document.getElementById('portfolioLoadMore');
  const filterBar = document.getElementById('portfolioFilters');
  if (!grid) return;

  let activeFilter = 'all';

  async function fetchManifest(folder){
    const base = `Images/Desktop/${encodeURIComponent(folder)}`;
    try {
      const resp = await fetch(`${base}/_images.json`, { cache: 'no-store' });
      if (!resp.ok) return [];
      const list = await resp.json();
      if (!Array.isArray(list)) return [];
      return list.map(rel => `${base}/${rel.split('/').map(encodeURIComponent).join('/')}`);
    } catch (_){
      return [];
    }
  }

  function shuffle(arr){
    for (let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function makeFigure(src, category, isVideo){
    const figure = document.createElement('figure');
    figure.dataset.category = category;
    const img = document.createElement('img');
    img.src = src;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = `${category.charAt(0).toUpperCase() + category.slice(1)} photography by Ben Fusco`;
    img.addEventListener('load', () => img.classList.add('is-loaded'));
    figure.appendChild(img);
    return figure;
  }

  function applyFilterAndPaging(){
    const figures = Array.from(grid.children);
    const matching = figures.filter(f => activeFilter === 'all' || f.dataset.category === activeFilter);

    figures.forEach(f => { f.hidden = !(activeFilter === 'all' || f.dataset.category === activeFilter); });

    if (activeFilter === 'all'){
      matching.forEach((f, i) => f.classList.toggle('is-extra', i >= INITIAL_VISIBLE));
      grid.classList.remove('show-extra');
      loadMoreBtn.hidden = matching.length <= INITIAL_VISIBLE;
      loadMoreBtn.textContent = 'Load More';
    } else {
      matching.forEach(f => f.classList.remove('is-extra'));
      loadMoreBtn.hidden = true;
    }

    emptyMsg.hidden = matching.length > 0;
  }

  loadMoreBtn?.addEventListener('click', () => {
    grid.classList.add('show-extra');
    loadMoreBtn.hidden = true;
  });

  filterBar?.addEventListener('click', (e) => {
    const btn = e.target.closest('.portfolio-filter-btn');
    if (!btn) return;
    activeFilter = btn.dataset.filter;
    filterBar.querySelectorAll('.portfolio-filter-btn').forEach(b => {
      const isActive = b === btn;
      b.classList.toggle('is-active', isActive);
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    applyFilterAndPaging();
  });

  async function init(){
    const results = await Promise.all(CATEGORIES.map(c => fetchManifest(c.folder)));
    const fragment = document.createDocumentFragment();

    CATEGORIES.forEach((cat, i) => {
      const urls = shuffle(results[i].slice());
      urls.forEach(url => fragment.appendChild(makeFigure(url, cat.key)));
    });

    if (!fragment.children.length){
      emptyMsg.hidden = false;
      return;
    }

    grid.appendChild(fragment);
    applyFilterAndPaging();

    if (typeof window.reinitGridLightbox === 'function'){
      window.reinitGridLightbox();
    }
  }

  init();
})();
