/* FX Carousel - Reusable Apple-like carousel
   Config via data attributes or options object.
   Usage: new FXCarousel(element, { src: 'Images/Wedding', shuffle: true, autoplay: { delay: 3000 } })
   Or markup: <div class="fx-carousel" data-src="Images/Wedding" data-shuffle="true"></div>
*/
(function(){
  const ease = 'cubic-bezier(.22,.68,.18,.99)';

  function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

  function preload(src){ const img = new Image(); img.decoding='async'; img.loading='eager'; img.src = src; return img; }

  function buildMarkup(root){
    root.classList.add('fx-carousel');
    root.innerHTML = [
      '<div class="fx-viewport" role="region" aria-roledescription="carousel">',
      '  <div class="fx-track" aria-live="polite"></div>',
      '  <button class="fx-arrow fx-prev" aria-label="Previous slide" type="button">‹</button>',
      '  <button class="fx-arrow fx-next" aria-label="Next slide" type="button">›</button>',
      '  <div class="fx-dots" role="tablist" aria-label="Carousel Pagination"></div>',
      '  <button class="fx-play" aria-label="Pause autoplay" type="button" title="Pause">',
      '    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>',
      '  </button>',
      '</div>',
      '<div class="fx-lightbox" aria-hidden="true" aria-modal="true" role="dialog">',
      '  <div class="fx-lb-inner">',
      '    <figure class="fx-lb-stage">',
      '      <img class="fx-lb-img" alt="" />',
      '      <figcaption class="fx-lb-counter"></figcaption>',
      '    </figure>',
      '    <button class="fx-lb-close" aria-label="Close" type="button">✕</button>',
      '    <button class="fx-lb-prev" aria-label="Previous" type="button">‹</button>',
      '    <button class="fx-lb-next" aria-label="Next" type="button">›</button>',
      '  </div>',
      '</div>'
    ].join('');
    return {
      viewport: root.querySelector('.fx-viewport'),
      track: root.querySelector('.fx-track'),
      prevBtn: root.querySelector('.fx-prev'),
      nextBtn: root.querySelector('.fx-next'),
      dots: root.querySelector('.fx-dots'),
      playBtn: root.querySelector('.fx-play'),
      lightbox: root.querySelector('.fx-lightbox'),
      lbImg: root.querySelector('.fx-lb-img'),
      lbCounter: root.querySelector('.fx-lb-counter'),
      lbPrev: root.querySelector('.fx-lb-prev'),
      lbNext: root.querySelector('.fx-lb-next'),
      lbClose: root.querySelector('.fx-lb-close'),
    };
  }

  function toUrl(base){ try { return new URL(base, document.baseURI).toString(); } catch { return base; } }

  function readFolderListing(folder){
    // Static hosting cannot list directories; allow pairing with a JSON beside the folder.
    // Attempt to fetch folder/_images.json if available. Otherwise, fallback to common names.
    const jsonUrl = toUrl(folder.replace(/\/$/,'') + '/_images.json');
    return fetch(jsonUrl, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(arr => Array.isArray(arr) ? arr.map(item => {
        if (/^https?:\//.test(item) || item.startsWith('/')) return item;
        return folder.replace(/\/$/,'') + '/' + item;
      }) : Promise.reject())
      .catch(() => {
        // Fallback: try common sequential names up to a cap
        const exts = ['.jpg','.jpeg','.png','.webp'];
        const guesses = [];
        for(let i=1;i<=80;i++){
          for(const ext of exts){ guesses.push(`${folder.replace(/\/$/,'')}/${i}${ext}`); }
          for(const ext of exts){ guesses.push(`${folder.replace(/\/$/,'')}/0${i}${ext}`); }
        }
        return guesses; // We'll check by attempting to load; broken ones are skipped when onerror.
      });
  }

  class FXCarousel {
    constructor(root, options={}){
      this.root = root;
      this.opts = Object.assign({
        src: root.getAttribute('data-src') || '',
        images: null, // explicit list if provided
        shuffle: (root.getAttribute('data-shuffle')||'false') === 'true',
        loop: true,
        autoplay: { enabled: true, delay: 3200 },
        startVisibleRatio: 0.25,
        preloadAhead: 2,
      }, options);

      this.ui = buildMarkup(root);
      this.state = { idx: 0, timer: null, playing: true, imgs: [], ready: false, cloning: false };
      this.bound = {
        next: () => this.go( this.state.idx + 1, {via:'next'} ),
        prev: () => this.go( this.state.idx - 1, {via:'prev'} ),
        onResize: () => this.applyTransform(),
        onKey: (e) => this.onKey(e),
        onVis: (entries) => this.onIntersect(entries),
        onPlayToggle: () => this.toggleAutoplay(),
        openLightbox: (e) => this.openLightboxFrom(e),
        lbClose: () => this.closeLightbox(),
        lbPrev: () => this.lightboxStep(-1),
        lbNext: () => this.lightboxStep(1),
      };

      this.mount();
    }

    async mount(){
      const { src, images, shuffle: doShuffle } = this.opts;
      let list = [];
      if (Array.isArray(images) && images.length){ list = images; }
      else if (src){ list = await readFolderListing(src); }
      else { console.warn('FXCarousel: no images source'); return; }

      // Create slide elements and skip broken guesses
      const verified = await this.verifyImages(list);
      this.state.imgs = doShuffle ? shuffle(verified.slice()) : verified;

      this.renderSlides();
      this.buildDots();
      this.bind();
      this.observeVisibility();
      this.state.ready = true;
      this.applyTransform(true);
      // Start/stop autoplay based on initial visibility
      if (this.opts.autoplay.enabled){
        const rect = this.ui.viewport.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
        const ratio = visible / Math.max(1, rect.height);
        if (ratio >= this.opts.startVisibleRatio) this.play(); else this.pause();
      }
    }

    async verifyImages(list){
      const checks = list.map(src => new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => resolve(null);
        img.src = src;
      }));
      const results = await Promise.all(checks);
      return results.filter(Boolean);
    }

    renderSlides(){
      const { track } = this.ui;
      track.innerHTML = '';
      const imgs = this.state.imgs;
      if (!imgs.length) return;
      const make = (src, i) => {
        const slide = document.createElement('div');
        slide.className = 'fx-slide';
        slide.setAttribute('data-i', i);
        const img = document.createElement('img');
        img.className = 'fx-img';
        img.alt = '';
        img.decoding = 'async';
        img.loading = 'lazy';
        img.src = src;
        img.addEventListener('click', this.bound.openLightbox);
        slide.appendChild(img);
        return slide;
      };

      const slides = imgs.map((src,i) => make(src,i));

      if (this.opts.loop && imgs.length > 1){
        track.appendChild( make(imgs[imgs.length-1], -1) );
        slides.forEach(s => track.appendChild(s));
        track.appendChild( make(imgs[0], imgs.length) );
        this.state.idx = 0;
        this.state.offset = 1; // account for leading clone
      } else {
        slides.forEach(s => track.appendChild(s));
        this.state.idx = 0; this.state.offset = 0;
      }

      this.updateClasses();
    }

    buildDots(){
      const { dots } = this.ui;
      dots.innerHTML = '';
      this.state.imgs.forEach((_, i) => {
        const b = document.createElement('button');
        b.className = 'fx-dot' + (i===0?' active':'');
        b.setAttribute('type','button');
        b.setAttribute('aria-label', 'Go to slide ' + (i+1));
        b.addEventListener('click', () => this.go(i, {jump:true}));
        dots.appendChild(b);
      });
    }

    bind(){
      const { prevBtn, nextBtn, playBtn } = this.ui;
      prevBtn.addEventListener('click', () => { this.pause(); this.bound.prev(); });
      nextBtn.addEventListener('click', () => { /* keep playing */ this.bound.next(); });
      playBtn.addEventListener('click', this.bound.onPlayToggle);
      window.addEventListener('resize', this.bound.onResize, { passive:true });
      this.root.addEventListener('keydown', this.bound.onKey);

      // Lightbox handlers
      const { lightbox, lbClose, lbPrev, lbNext } = this.ui;
      lbClose.addEventListener('click', this.bound.lbClose);
      lbPrev.addEventListener('click', this.bound.lbPrev);
      lbNext.addEventListener('click', this.bound.lbNext);
      lightbox.addEventListener('click', (e) => { if (e.target === lightbox) this.closeLightbox(); });
    }

    observeVisibility(){
      if (!('IntersectionObserver' in window)) return;
      this.io = new IntersectionObserver(this.bound.onVis, { threshold: [this.opts.startVisibleRatio] });
      this.io.observe(this.ui.viewport);
    }

    onIntersect(entries){
      for (const entry of entries){
        if (entry.isIntersecting && entry.intersectionRatio >= this.opts.startVisibleRatio){
          if (this.opts.autoplay.enabled) this.play();
        } else {
          this.pause();
        }
      }
    }

    onKey(e){
      if (document.body.classList.contains('fx-lightbox-open')) return; // lightbox handles its own
      if (e.key === 'ArrowRight'){ this.bound.next(); }
      else if (e.key === 'ArrowLeft'){ this.pause(); this.bound.prev(); }
      else if (e.key === ' ' || e.code === 'Space'){ e.preventDefault(); this.toggleAutoplay(); }
      else if (e.key === 'Enter'){ this.openLightbox(this.state.idx); }
    }

    slideCount(){ return this.state.imgs.length; }

    applyTransform(immediate){
      const { track } = this.ui;
      const w = this.ui.viewport.clientWidth;
      const perView = w < 900 ? 1 : 3;
      const slideW = w / perView;
      const base = -(this.state.idx + this.state.offset) * slideW;
      track.style.transition = immediate ? 'none' : `transform 740ms ${ease}`;
      track.style.transform = `translate3d(${base}px,0,0)`;
      // set classes for center-focused look
      this.updateClasses(perView);
    }

    updateClasses(perView){
      const slides = this.ui.track.children;
      const activeAt = this.state.idx + this.state.offset;
      for (let i=0; i<slides.length; i++){
        slides[i].classList.remove('active','prev','next');
      }
      if (perView === 1){
        slides[activeAt]?.classList.add('active');
      } else {
        slides[activeAt]?.classList.add('active');
        slides[activeAt-1]?.classList.add('prev');
        slides[activeAt+1]?.classList.add('next');
      }
      // dots
      const dots = this.ui.dots.children;
      for (let i=0;i<dots.length;i++){ dots[i].classList.toggle('active', i===this.state.idx); }
    }

    go(targetIdx, meta={}){
      if (!this.state.ready) return;
      const N = this.slideCount();
      if (!N) return;
      const { via, jump } = meta;

      // crossfade hint
      this.crossfadeHint(via);

      const before = this.state.idx;
      let next = targetIdx;
      if (this.opts.loop){
        if (next < 0) next = N-1;
        if (next >= N) next = 0;
      } else {
        next = Math.max(0, Math.min(N-1, next));
      }

      if (before === next && !jump) return;
      this.state.idx = next;
      this.applyTransform(false);
      // handle seamless snap when moving into clones
      if (this.opts.loop){
        const N2 = this.slideCount();
        const { track } = this.ui;
        const onEnd = () => {
          track.removeEventListener('transitionend', onEnd);
          // if at virtual -1 (leading clone visible), snap to last real
          if (before === 0 && via === 'prev' && this.state.idx === N2-1){
            track.style.transition = 'none';
            this.state.idx = N2-1; this.applyTransform(true);
          }
          // if at virtual N (trailing clone), snap to first real
          if (before === N2-1 && via === 'next' && this.state.idx === 0){
            track.style.transition = 'none';
            this.state.idx = 0; this.applyTransform(true);
          }
        };
        track.addEventListener('transitionend', onEnd);
      }
      this.schedule(); // reset autoplay when navigating forward; prev was paused already in handler
      this.preloadAhead();
    }

    crossfadeHint(via){
      if (!via) return;
      const activeSlide = this.ui.track.children[this.state.idx + this.state.offset];
      if (!activeSlide) return;
      const img = activeSlide.querySelector('img.fx-img');
      if (!img) return;
      const clone = img.cloneNode(true);
      clone.classList.add('fade-out');
      activeSlide.appendChild(clone);
      requestAnimationFrame(() => {
        clone.classList.add('fading');
        setTimeout(() => clone.remove(), 450);
      });
    }

    preloadAhead(){
      const { preloadAhead } = this.opts;
      const N = this.slideCount();
      for (let k=1; k<=preloadAhead; k++){
        const i1 = (this.state.idx + k) % N;
        const i2 = (this.state.idx - k + N) % N;
        preload(this.state.imgs[i1]);
        preload(this.state.imgs[i2]);
      }
    }

    schedule(){
      if (!this.opts.autoplay.enabled) return;
      clearTimeout(this.state.timer);
      if (!this.state.playing) return;
      this.state.timer = setTimeout(() => this.go(this.state.idx + 1, {via:'next'}), this.opts.autoplay.delay);
    }

    play(){ this.state.playing = true; this.ui.playBtn.title = 'Pause'; this.ui.playBtn.setAttribute('aria-label','Pause autoplay'); this.schedule(); }
    pause(){ this.state.playing = false; clearTimeout(this.state.timer); this.ui.playBtn.title = 'Play'; this.ui.playBtn.setAttribute('aria-label','Play autoplay'); }
    toggleAutoplay(){ this.state.playing ? this.pause() : this.play(); }

    openLightboxFrom(e){
      const slide = e.currentTarget.closest('.fx-slide');
      const idx = Number(slide.getAttribute('data-i'));
      this.openLightbox(idx);
    }

    openLightbox(idx){
      this.pause();
      document.body.classList.add('fx-lightbox-open');
      this.ui.lightbox.classList.add('open');
      this.ui.lightbox.setAttribute('aria-hidden','false');
      this.lbIndex = (typeof idx==='number') ? idx : this.state.idx;
      this.loadLbImage();
      document.addEventListener('keydown', this.lbKeyHandler = (e)=>{
        if (e.key==='Escape') this.closeLightbox();
        else if (e.key==='ArrowRight') this.lightboxStep(1);
        else if (e.key==='ArrowLeft') this.lightboxStep(-1);
      });
    }

    closeLightbox(){
      this.ui.lightbox.classList.remove('open');
      this.ui.lightbox.setAttribute('aria-hidden','true');
      document.body.classList.remove('fx-lightbox-open');
      document.removeEventListener('keydown', this.lbKeyHandler);
      if (this.opts.autoplay.enabled) this.play();
    }

    lightboxStep(dir){
      const N = this.slideCount();
      this.lbIndex = (this.lbIndex + dir + N) % N;
      this.loadLbImage();
    }

    loadLbImage(){
      const src = this.state.imgs[this.lbIndex];
      this.ui.lbImg.classList.remove('loaded');
      const img = new Image();
      img.onload = () => {
        this.ui.lbImg.src = src; this.ui.lbImg.classList.add('loaded');
        this.ui.lbCounter.textContent = `${this.lbIndex+1} / ${this.slideCount()}`;
      };
      img.src = src;
    }
  }

  // Auto-init via data attributes
  function autoInit(){
    const nodes = document.querySelectorAll('.fx-carousel');
    nodes.forEach(node => {
      if (node.__fx) return;
      let images = undefined;
      const inline = node.getAttribute('data-images');
      if (inline) {
        try { images = JSON.parse(inline); } catch(e) { console.warn('FXCarousel: bad data-images JSON', e); }
      }
      node.__fx = new FXCarousel(node, {
        src: images ? undefined : (node.getAttribute('data-src') || undefined),
        images,
        shuffle: (node.getAttribute('data-shuffle')||'false') === 'true',
      });
    });
  }
  document.addEventListener('DOMContentLoaded', autoInit);

  // visibility/focus handling
  document.addEventListener('visibilitychange', () => {
    const nodes = document.querySelectorAll('.fx-carousel');
    nodes.forEach(node => {
      const inst = node.__fx; if (!inst) return;
      if (document.hidden) inst.pause(); else {
        // resume only if in view
        const rect = inst.ui.viewport.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
        const ratio = visible / Math.max(1, rect.height);
        if (ratio >= inst.opts.startVisibleRatio && inst.opts.autoplay.enabled) inst.play();
      }
    });
  });

  // export
  window.FXCarousel = FXCarousel;
})();