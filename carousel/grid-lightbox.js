/* Grid Lightbox - Reuses FX Carousel lightbox styling for any image grid */
(function(){
  const SELECTOR = '.portraits-grid img, .portfolio-grid img'; // grids that use this lightbox

  function getSrc(img){
    if (!img) return '';
    return img.currentSrc || img.src || img.getAttribute('data-src') || '';
  }

  function buildLightbox(){
    const wrap = document.createElement('div');
    wrap.className = 'fx-lightbox grid-lb';
    wrap.setAttribute('aria-hidden','true');
    wrap.setAttribute('role','dialog');
    wrap.innerHTML = [
      '<div class="fx-lb-inner">',
      '  <figure class="fx-lb-stage">',
      '    <img class="fx-lb-img" alt="" />',
      '    <button class="fx-lb-close" aria-label="Close" type="button">✕</button>',
      '    <figcaption class="fx-lb-counter"></figcaption>',
      '  </figure>',
      '  <button class="fx-lb-prev" aria-label="Previous" type="button">‹</button>',
      '  <button class="fx-lb-next" aria-label="Next" type="button">›</button>',
      '  <div class="fx-dots" role="tablist" aria-label="Gallery Pagination"></div>',
      '</div>'
    ].join('');
    document.body.appendChild(wrap);
    return {
      root: wrap,
      inner: wrap.querySelector('.fx-lb-inner'),
      img: wrap.querySelector('.fx-lb-img'),
      counter: wrap.querySelector('.fx-lb-counter'),
      prev: wrap.querySelector('.fx-lb-prev'),
      next: wrap.querySelector('.fx-lb-next'),
      close: wrap.querySelector('.fx-lb-close'),
      dots: wrap.querySelector('.fx-dots')
    };
  }

  function initGridLightbox(){
    const nodes = Array.from(document.querySelectorAll(SELECTOR));
    if (!nodes.length) return;

    const ui = buildLightbox();
    let idx = 0;
    const total = nodes.length;

    // Build dots
    ui.dots.innerHTML = '';
    for (let i=0;i<total;i++){
      const b = document.createElement('button');
      b.className = 'fx-dot' + (i===0 ? ' active' : '');
      b.type = 'button';
      b.setAttribute('aria-label', `Go to image ${i+1}`);
      b.addEventListener('click', () => goTo(i));
      ui.dots.appendChild(b);
    }

    function updateDots(){
      const children = ui.dots.children;
      for (let i=0;i<children.length;i++) children[i].classList.toggle('active', i===idx);
    }

    function setBodyLock(lock){
      document.body.classList.toggle('fx-lightbox-open', !!lock);
    }

    function preloadNeighbor(i){
      const n = new Image();
      n.decoding = 'async';
      n.loading = 'eager';
      n.src = getSrc(nodes[i]);
    }

    function load(idxNew){
      const src = getSrc(nodes[idxNew]);
      ui.img.classList.remove('loaded');
      const tmp = new Image();
      tmp.onload = () => { ui.img.src = src; ui.img.classList.add('loaded'); };
      tmp.src = src;
      ui.counter.textContent = `${idxNew+1} / ${total}`;
      updateDots();
      // preload neighbors
      preloadNeighbor((idxNew+1)%total);
      preloadNeighbor((idxNew-1+total)%total);
    }

    function goTo(i){
      idx = (i + total) % total;
      load(idx);
    }
    function step(d){ goTo(idx + d); }

    function open(i){
      idx = i;
      ui.root.classList.add('open');
      ui.root.setAttribute('aria-hidden','false');
      setBodyLock(true);
      load(idx);
      document.addEventListener('keydown', keyHandler);
    }
    function close(){
      ui.root.classList.remove('open');
      ui.root.setAttribute('aria-hidden','true');
      setBodyLock(false);
      document.removeEventListener('keydown', keyHandler);
    }
    function keyHandler(e){
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    }

    // Wire buttons
    ui.prev.addEventListener('click', () => step(-1));
    ui.next.addEventListener('click', () => step(1));
    ui.close.addEventListener('click', () => close());
    // Close when clicking the backdrop (root) or any area inside the overlay that's not the image or UI controls
    ui.root.addEventListener('click', (e) => { if (e.target === ui.root) close(); });
    ui.inner.addEventListener('click', (e) => {
      const t = e.target;
      // Do not close when clicking on the image or navigation controls
      if (t === ui.img) return;
      if (t.closest('.fx-lb-prev, .fx-lb-next, .fx-dots, .fx-lb-close')) return;
      // Otherwise, any click elsewhere should close
      close();
    });

    // Make every grid image clickable
    nodes.forEach((img, i) => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => open(i));
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initGridLightbox);
  } else {
    initGridLightbox();
  }

  // Expose a manual re-init for grids populated after page load (e.g. fetched portfolio images)
  window.reinitGridLightbox = initGridLightbox;
})();
