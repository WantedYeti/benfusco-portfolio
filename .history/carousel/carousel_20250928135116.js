/* FX Carousel - Reusable Apple-like carousel
   Config via data attributes or options object.
   Usage: new FXCarousel(element, { src: 'Images/Wedding', shuffle: true, autoplay: { delay: 3000 } })
   Or markup: <div class="fx-carousel" data-src="Images/Wedding" data-shuffle="true"></div>
*/
(function(){
  const ease = 'ease-in-out';
  const DUR = 800; // ms, consistent smooth duration
  const FADE = 660; // ms, matches .fx-img fade durations in CSS
  const PAUSE_SVG = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
  const PLAY_SVG  = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
  function preload(src){ const img = new Image(); img.decoding='async'; img.loading='eager'; img.fetchPriority = 'high'; img.src = src; return img; }
  async function decodeOnce(src){
    try {
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = src;
      if (img.decode) await img.decode();
      return true;
    } catch { return false; }
  }
  function toUrl(base){ try { return new URL(base, document.baseURI).toString(); } catch { return base; } }
  const decodeEl = (img) => (img && img.decode ? img.decode().catch(()=>{}) : Promise.resolve());

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
      '      <button class="fx-lb-close" aria-label="Close" type="button">✕</button>',
      '      <figcaption class="fx-lb-counter"></figcaption>',
      '    </figure>',
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
      lbInner: root.querySelector('.fx-lb-inner'),
      lbImg: root.querySelector('.fx-lb-img'),
      lbCounter: root.querySelector('.fx-lb-counter'),
      lbPrev: root.querySelector('.fx-lb-prev'),
      lbNext: root.querySelector('.fx-lb-next'),
      lbClose: root.querySelector('.fx-lb-close'),
    };
  }

  // Preload manager to hint the browser for the next images
  let fxPreloads = new Set();
  function updatePreloads(urls){
    try {
      const head = document.head || document.getElementsByTagName('head')[0];
      // Clean old hints
      head.querySelectorAll('link[data-fx-preload="1"]').forEach(n => n.parentNode.removeChild(n));
      fxPreloads.clear();
      // Add new hints
      (urls || []).slice(0,2).forEach(href => {
        if (!href || fxPreloads.has(href)) return;
        const l = document.createElement('link');
        l.rel = 'preload'; l.as = 'image'; l.href = href; l.setAttribute('data-fx-preload','1');
        head.appendChild(l);
        fxPreloads.add(href);
      });
    } catch(_){ /* noop */ }
  }

  // Lazy-load helpers
  function markLoaded(img){ try { img.setAttribute('data-loaded','1'); } catch(_){} }
  function isLoaded(img){ return !!img && (img.getAttribute('data-loaded') === '1' || !!img.currentSrc || (!!img.src && img.complete)); }
  function loadImmediate(img){
    if (!img || isLoaded(img)) return;
    const src = img.getAttribute('data-src');
    if (!src) return;
    img.src = src;
  }

  function readFolderListing(folder){
    const jsonUrl = toUrl(folder.replace(/\/$/,'') + '/_images.json');
    return fetch(jsonUrl, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(arr => Array.isArray(arr) ? arr.map(item => {
        if (/^https?:\//.test(item) || item.startsWith('/')) return item;
        return folder.replace(/\/$/,'') + '/' + item;
      }) : Promise.reject())
      .catch(() => {
        const exts = ['.jpg','.jpeg','.png','.webp'];
        const guesses = [];
        for(let i=1;i<=80;i++){
          for(const ext of exts){ guesses.push(`${folder.replace(/\/$/,'')}/${i}${ext}`); }
          for(const ext of exts){ guesses.push(`${folder.replace(/\/$/,'')}/0${i}${ext}`); }
        }
        return guesses;
      });
  }

  class FXCarousel {
    constructor(root, options={}){
      this.root = root;
      this.opts = Object.assign({
        src: root.getAttribute('data-src') || '',
        images: null,
        shuffle: (root.getAttribute('data-shuffle')||'false') === 'true',
        loop: true,
        autoplay: { enabled: true, delay: Number(root.getAttribute('data-delay')) || 3200 },
        aspect: (root.getAttribute('data-aspect') || '').toLowerCase(),
        startVisibleRatio: 0.25,
        preloadAhead: 2,
        tight: (root.getAttribute('data-tight')||'false') === 'true',
        perViewDesktop: Number(root.getAttribute('data-per-view')) || 3,
        perViewMobile: 1,
      }, options);

      this.ui = buildMarkup(root);
      this.state = { idx: 0, timer: null, playing: true, userPaused: false, imgs: [], ready: false, widths: [], prefix: [], offset: 0, animating: false, needResize: false };
      this.bound = {
        next: () => this.go(this.state.idx + 1, { via: 'next' }),
        prev: () => this.go(this.state.idx - 1, { via: 'prev' }),
        onResize: () => this.onResize(),
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

      const verified = await this.verifyImages(list);
      this.state.imgs = doShuffle ? shuffle(verified.slice()) : verified;

      if (!this.state.imgs.length){
        console.warn('FXCarousel: no images resolved for', src || '[inline images]');
        this.ui.track.innerHTML = '';
        const msg = document.createElement('div');
        msg.className = 'fx-status';
        msg.textContent = 'No images available for this carousel.';
        this.ui.viewport.appendChild(msg);
        return;
      }

  // Prep phase: hide viewport until base layout is stable to avoid first-paint jitter
  this.ui.viewport.classList.add('fx-prep');
  this.renderSlides();
  this.applyAspect();
      if (this.opts.tight) {
        this.root.classList.add('fx-tight');
        this.computeLayout();
      }
      this.buildDots();
      this.bind();
      this.observeVisibility();
      // Lazy-load observer and immediate warm-up
      this.attachLazy();
      this.ensureNeighborsLoaded(2);
      this.state.ready = true;
      // Decode a wider window around the starting view to avoid blank neighbors on first paint
      try {
        const imgsInTrack = Array.from(this.ui.track.querySelectorAll('img.fx-img'));
        const j = this.state.idx + this.state.offset; // current absolute index in track
        const decodeTargets = [j-3, j-2, j-1, j, j+1, j+2, j+3]
          .map(k => imgsInTrack[k])
          .filter(Boolean);
        // Ensure they are actually loading so decode() isn't a no-op
        decodeTargets.forEach(loadImmediate);
        await Promise.race([
          Promise.all(decodeTargets.map(decodeEl)),
          new Promise(res => setTimeout(res, 600))
        ]);
      } catch(_){ }
      // Compute layout and place track before we reveal
      this.applyTransform(true);
      // Reveal after a tick to let the compositor settle
      requestAnimationFrame(() => this.ui.viewport.classList.remove('fx-prep'));
      // Warm up cache for neighbors to avoid blank left/right images on first paint
      this.preloadAhead();
      updatePreloads([
        this.state.imgs[(this.state.idx+1)%this.slideCount()],
        this.state.imgs[(this.state.idx+2)%this.slideCount()]
      ]);
      if (this.opts.autoplay.enabled){
        const rect = this.ui.viewport.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
        const ratio = visible / Math.max(1, rect.height);
        if (ratio >= this.opts.startVisibleRatio) this.play(); else this.pause();
        // Fallback: after layout settles, re-check visibility and start autoplay if now visible
        setTimeout(() => {
          try {
            const r = this.ui.viewport.getBoundingClientRect();
            const V = window.innerHeight || document.documentElement.clientHeight;
            const vis = Math.max(0, Math.min(r.bottom, V) - Math.max(r.top, 0));
            const rr = vis / Math.max(1, r.height);
            if (rr >= this.opts.startVisibleRatio && !this.state.userPaused) this.play();
          } catch(_){}
        }, 800);
      }
    }

    attachLazy(){
      const imgs = Array.from(this.ui.track.querySelectorAll('img.fx-img'));
      if ('IntersectionObserver' in window){
        const io = new IntersectionObserver(entries => {
          for (const e of entries){
            if (e.isIntersecting){
              loadImmediate(e.target);
              io.unobserve(e.target);
            }
          }
        }, { root: this.ui.viewport, rootMargin: '0px 1200px 0px 1200px', threshold: 0.01 });
        imgs.forEach(img => { if (!isLoaded(img)) io.observe(img); });
        this._lazyIO = io;
      } else {
        // Fallback: load everything if IO unsupported
        setTimeout(() => imgs.forEach(loadImmediate), 0);
      }
    }

    ensureNeighborsLoaded(radius=2){
      const slides = Array.from(this.ui.track.children);
      const j = this.state.idx + this.state.offset;
      for (let d=-radius; d<=radius; d++){
        const s = slides[j + d];
        const img = s && s.querySelector('img.fx-img');
        if (img && !isLoaded(img)) loadImmediate(img);
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
        // True lazy-load: assign data-src; eager for clones/initial neighbors only
        const eager = (i === -1 || i === 0 || i === 1 || i === 2 || i === imgs.length);
        img.loading = eager ? 'eager' : 'lazy';
        if (eager) { try { img.fetchPriority = 'high'; } catch(_){} }
        const onLoad = () => {
          try {
            if (img.naturalHeight > img.naturalWidth * 1.05) {
              slide.classList.add('is-vertical');
              slide.style.setProperty('--fx-bg', `url("${src}")`);
            }
            markLoaded(img);
            if (this.opts.tight) {
              // Recompute widths for tight layout
              this.computeLayout();
              // Only animate re-centering if the loaded slide is near the current view
              const children = Array.from(this.ui.track.children);
              const j = this.state.idx + this.state.offset;
              const pos = children.indexOf(slide);
              const near = pos >= 0 && Math.abs(pos - j) <= 2;
              if (near) {
                if (this.state.animating) {
                  this.state.needResize = true;
                } else {
                  // Debounce to avoid multiple transforms from clustered loads
                  clearTimeout(this._layoutT);
                  this._layoutT = setTimeout(() => {
                    this.applyTransform(false);
                  }, 16);
                }
              }
            }
          } catch(_){ }
        };
        img.addEventListener('load', onLoad, { once: true });
        img.setAttribute('data-src', src);
        if (eager) { img.src = src; if (img.complete) onLoad(); }
        img.addEventListener('click', this.bound.openLightbox);
        slide.appendChild(img);
        return slide;
      };

      if (this.opts.loop && imgs.length > 1){
        const N = imgs.length;
        // Build prefix (copy of all), originals, and suffix (copy of all)
        const prefix = imgs.map((src,i) => make(src, i - N));
        const originals = imgs.map((src,i) => make(src, i));
        const suffix = imgs.map((src,i) => make(src, i + N));
        prefix.forEach(s => track.appendChild(s));
        originals.forEach(s => track.appendChild(s));
        suffix.forEach(s => track.appendChild(s));
        this.state.idx = 0; // logical index within [0..N-1]
        this.state.offset = N; // active absolute position sits in the middle block
      } else {
        const originals = imgs.map((src,i) => make(src,i));
        originals.forEach(s => track.appendChild(s));
        this.state.idx = 0; this.state.offset = 0;
      }

      this.updateClasses();
    }

    buildDots(){
      const { dots } = this.ui;
      dots.innerHTML = '';
      this.state.imgs.forEach((_, i) => {
        const b = document.createElement('button');
        b.className = 'fx-dot' + (i===0?' active':'')
        b.setAttribute('type','button');
        b.setAttribute('aria-label', 'Go to slide ' + (i+1));
        b.addEventListener('click', () => this.go(i, {jump:true}));
        dots.appendChild(b);
      });
    }

    bind(){
  const { prevBtn, nextBtn, playBtn } = this.ui;
  prevBtn.addEventListener('click', () => {
        this.state.userPaused = true;
        this.pause();
        this.bound.prev();
      });
      nextBtn.addEventListener('click', () => {
        this.state.userPaused = false;
        this.play();
        this.bound.next();
      });
      playBtn.addEventListener('click', this.bound.onPlayToggle);
      window.addEventListener('resize', this.bound.onResize, { passive:true });
      if ('ResizeObserver' in window) {
        this.ro = new ResizeObserver(() => this.onResize());
        this.ro.observe(this.ui.viewport);
      }
      this.root.addEventListener('keydown', this.bound.onKey);

      const { lightbox, lbClose, lbPrev, lbNext, lbInner } = this.ui;
      lbClose.addEventListener('click', this.bound.lbClose);
      lbPrev.addEventListener('click', this.bound.lbPrev);
      lbNext.addEventListener('click', this.bound.lbNext);
      lightbox.addEventListener('click', (e) => { if (e.target === lightbox) this.closeLightbox(); });
      lbInner.addEventListener('click', (e) => {
        const clickedImg = e.target.closest('.fx-lb-img');
        const clickedControl = e.target.closest('.fx-lb-prev, .fx-lb-next, .fx-lb-close');
        if (!clickedImg && !clickedControl) this.closeLightbox();
      });
    }

    observeVisibility(){
      if (!('IntersectionObserver' in window)) return;
      this.io = new IntersectionObserver(this.bound.onVis, { threshold: [this.opts.startVisibleRatio] });
      this.io.observe(this.ui.viewport);
    }

    onIntersect(entries){
      for (const entry of entries){
        if (entry.isIntersecting && entry.intersectionRatio >= this.opts.startVisibleRatio){
          if (this.opts.autoplay.enabled && !this.state.userPaused) this.play();
        } else {
          this._stopTimerOnly();
        }
      }
    }

    onKey(e){
      if (document.body.classList.contains('fx-lightbox-open')) return;
      if (e.key === 'ArrowRight'){ this.state.userPaused = false; this.play(); this.bound.next(); }
      else if (e.key === 'ArrowLeft'){ this.state.userPaused = true; this.pause(); this.bound.prev(); }
      else if (e.key === ' ' || e.code === 'Space'){ e.preventDefault(); this.toggleAutoplay(); }
      else if (e.key === 'Enter'){ this.openLightbox(this.state.idx); }
    }

    slideCount(){ return this.state.imgs.length; }

    baseFor(jAbs){
      const viewportW = this.ui.viewport.clientWidth;
      if (this.opts.tight && this.state.widths.length) {
        const before = this.state.prefix[jAbs] || 0;
        const curW = this.state.widths[jAbs] || 0;
        const center = before + curW / 2;
        return Math.round((viewportW / 2) - center);
      } else {
        const perView = viewportW < 900 ? this.opts.perViewMobile : this.opts.perViewDesktop;
        const slideW = viewportW / perView;
        const center = jAbs * slideW;
        return -Math.round(center);
      }
    }

    applyTransform(immediate){
      const { track } = this.ui;
      const setX = () => {
        const j = this.state.idx + this.state.offset;
        const base = Math.round(this.baseFor(j)); // integer to avoid sub-pixel jitter
        track.style.transform = `translateX(${base}px)`;
      };
      if (immediate){
        track.style.transition = 'none';
        setX();
      } else {
        // Ensure transition is applied before transform to avoid skips
        track.style.transition = `transform ${DUR}ms ${ease}`;
        requestAnimationFrame(setX);
      }
      const viewportW = this.ui.viewport.clientWidth;
      const perView = (this.opts.tight && this.state.widths.length) ? 3 : (viewportW < 900 ? this.opts.perViewMobile : this.opts.perViewDesktop);
      this.updateClasses(perView);
    }

    onResize(){
      clearTimeout(this._resizeT);
      this._resizeT = setTimeout(() => {
        if (this.state.animating){ this.state.needResize = true; return; }
        if (this.opts.tight) {
          this.computeLayout();
          this.applyTransform(true);
        } else {
          this.applyTransform(true);
        }
      }, 80);
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
      const dots = this.ui.dots.children;
      for (let i=0;i<dots.length;i++){ dots[i].classList.toggle('active', i===this.state.idx); }
    }

    go(targetIdx, meta={}){
      if (!this.state.ready) return;
      const N = this.slideCount();
      if (!N) return;
      const { via, jump } = meta;

  // Always add a subtle outgoing crossfade to soften the change
  this.crossfadeHint(true);

      const before = this.state.idx;
      let next = targetIdx;
      if (this.opts.loop){
        if (next < 0) next = N-1;
        if (next >= N) next = 0;
      } else {
        next = Math.max(0, Math.min(N-1, next));
      }

      if (before === next && !jump) return;

      // With triple-list rendering, we no longer need edge clone jump logic

      // Normalize absolute position into middle block BEFORE transition to avoid post-anim snap
      if (this.opts.loop) {
        this.state.offset = N; // keep anchored in center block
      }
      this.state.idx = next;
      this.applyTransform(false);
      // Warm up neighbors at the target index to prevent blanks as the slide settles
      this.ensureNeighborsLoaded(2);
      const activeSlide = this.ui.track.children[this.state.idx + this.state.offset];
      const inImg = activeSlide && activeSlide.querySelector('img.fx-img');
      if (inImg) {
        inImg.classList.add('fade-in');
        requestAnimationFrame(() => inImg.classList.add('fading'));
        setTimeout(() => { inImg.classList.remove('fade-in','fading'); }, FADE + 40);
      }
      this.schedule();
      this.preloadAhead();
      // Track animation end to avoid resize-induced jitter
      const { track } = this.ui;
      this.state.animating = true;
      const onEnd = () => {
        track.removeEventListener('transitionend', onEnd);
        // No snap-back: we already moved to the exact destination
        this.state.animating = false;
        if (this.state.needResize){ this.state.needResize = false; this.onResize(); }
      };
      track.addEventListener('transitionend', onEnd);
      // Fallback in case transitionend is missed (e.g., tab switch) to prevent stuck animating state
      clearTimeout(this._animFallbackT);
      this._animFallbackT = setTimeout(() => { if (this.state.animating) onEnd(); }, DUR + 120);
    }

    crossfadeHint(via){
      if (!via) return;
      const activeSlide = this.ui.track.children[this.state.idx + this.state.offset];
  if (!activeSlide) return;
  // Skip crossfade on portrait-isolated slides to reduce paint cost
  if (activeSlide.classList.contains('is-vertical')) return;
      const img = activeSlide.querySelector('img.fx-img');
      if (!img) return;
      const clone = img.cloneNode(true);
      clone.classList.add('fade-out');
      activeSlide.appendChild(clone);
      requestAnimationFrame(() => {
        clone.classList.add('fading');
        setTimeout(() => clone.remove(), FADE + 100);
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
      updatePreloads([this.state.imgs[(this.state.idx+1)%N], this.state.imgs[(this.state.idx+2)%N]]);
    }

    schedule(){
      if (!this.opts.autoplay.enabled) return;
      clearTimeout(this.state.timer);
      if (!this.state.playing || this.state.userPaused) return;
      this.state.timer = setTimeout(() => this.go(this.state.idx + 1, {via:'next'}), this.opts.autoplay.delay);
    }

    _stopTimerOnly(){ clearTimeout(this.state.timer); }
    play(){
      this.state.playing = true;
      this.ui.playBtn.title = 'Pause';
      this.ui.playBtn.setAttribute('aria-label','Pause autoplay');
      this.ui.playBtn.innerHTML = PAUSE_SVG;
      this.schedule();
    }
    pause(){
      this.state.playing = false;
      clearTimeout(this.state.timer);
      this.ui.playBtn.title = 'Play';
      this.ui.playBtn.setAttribute('aria-label','Play autoplay');
      this.ui.playBtn.innerHTML = PLAY_SVG;
    }
    toggleAutoplay(){
      if (this.state.playing && !this.state.userPaused){
        this.state.userPaused = true;
        this.pause();
      } else {
        this.state.userPaused = false;
        this.play();
      }
    }

    applyAspect(){
      if (this.opts.aspect === '4x5' || this.opts.aspect === '4:5'){
        this.root.classList.add('fx-aspect-4x5');
      }
    }

    computeLayout(){
      if (!this.opts.tight) return;
      const H = Math.max(1, this.ui.viewport.clientHeight);
      const maxW = this.ui.viewport.clientWidth;
      const children = Array.from(this.ui.track.children);
      const widths = [];
      for (const slide of children){
        const img = slide.querySelector('img');
        let w = 0;
        if (img && img.naturalWidth && img.naturalHeight){
          const r = img.naturalWidth / img.naturalHeight;
          w = H * r;
        } else {
          w = maxW / 3;
        }
        const minCol = Math.min(220, Math.max(160, maxW / 6));
        const iw = Math.max(minCol, Math.min(Math.ceil(maxW), Math.round(w)));
        slide.style.width = iw + 'px';
        widths.push(iw);
      }
      const prefix = [0];
      for (let i=1;i<widths.length;i++) prefix[i] = prefix[i-1] + widths[i-1];
      this.state.widths = widths;
      this.state.prefix = prefix;
    }

    openLightboxFrom(e){
      const slide = e.currentTarget.closest('.fx-slide');
      const idx = Number(slide.getAttribute('data-i'));
      this.openLightbox(idx);
    }

    openLightbox(idx){
      this.pause();
      document.body.classList.add('fx-lightbox-open');
      try {
        const navbar = document.querySelector('.navbar');
        if (navbar) navbar.classList.add('lb-force-transparent');
      } catch(_){}
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
      try {
        const navbar = document.querySelector('.navbar');
        if (navbar) navbar.classList.remove('lb-force-transparent');
        window.dispatchEvent(new Event('scroll'));
      } catch(_){}
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
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  document.addEventListener('visibilitychange', () => {
    const nodes = document.querySelectorAll('.fx-carousel');
    nodes.forEach(node => {
      const inst = node.__fx; if (!inst) return;
      if (document.hidden) inst._stopTimerOnly(); else {
        const rect = inst.ui.viewport.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
        const ratio = visible / Math.max(1, rect.height);
        if (ratio >= inst.opts.startVisibleRatio && inst.opts.autoplay.enabled && !inst.state.userPaused) inst.play();
      }
    });
  });

  window.FXCarousel = FXCarousel;
})();