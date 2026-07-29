document.addEventListener('DOMContentLoaded', () => {
  const year = document.querySelectorAll('[data-current-year]');
  year.forEach((node) => { node.textContent = new Date().getFullYear(); });

  const menuButton = document.querySelector('.menu-button');
  const drawer = document.querySelector('.mobile-drawer');
  const drawerLinks = drawer ? [...drawer.querySelectorAll('a')] : [];
  const closeMenu = (restoreFocus = false) => {
    if (!menuButton || !drawer) return;
    drawer.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('menu-open');
    if (restoreFocus) menuButton.focus();
  };

  if (menuButton && drawer) {
    menuButton.addEventListener('click', () => {
      const open = !drawer.classList.contains('open');
      drawer.classList.toggle('open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('menu-open', open);
      if (open) window.setTimeout(() => drawerLinks[0]?.focus(), 0);
    });
    drawerLinks.forEach((link) => link.addEventListener('click', () => closeMenu(false)));
    window.addEventListener('resize', () => { if (window.innerWidth > 1100) closeMenu(); });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && drawer?.classList.contains('open')) closeMenu(true);
    if (event.key === 'Tab' && drawer?.classList.contains('open') && drawerLinks.length) {
      const first = drawerLinks[0];
      const last = drawerLinks[drawerLinks.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const featureImages = [...document.querySelectorAll('[data-feature-image]')];
  const featureDotsWrap = document.querySelector('.feature-dots');
  const featureToggle = document.querySelector('[data-feature-toggle]');
  const featureCounter = document.querySelector('[data-feature-counter]');
  const featureStatus = document.querySelector('[data-feature-status]');
  const fallbackFavorites = {
    openingTrio: featureImages.map((image) => ({ src: image.getAttribute('src'), alt: image.alt, category: 'featured' })),
    pool: []
  };
  const favorites = window.BEN_FUSCO_FAVORITES || fallbackFavorites;
  const isAllowedFeaturedImage = (item) => {
    const source = decodeURIComponent(item?.src || '');
    return source && !/\/Portraits\/Syd\//i.test(source) && !/\bSydney\b/i.test(item?.alt || '');
  };
  const uniquePool = [...new Map((favorites.pool || []).map((item) => [item.src, item])).values()]
    .filter((item) => isAllowedFeaturedImage(item) && !(favorites.openingTrio || []).some((opening) => opening.src === item.src));
  const shuffle = (items) => {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  };
  const balanceFavorites = (items) => {
    const buckets = items.reduce((groups, item) => {
      const category = item.category || 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
      return groups;
    }, {});
    Object.keys(buckets).forEach((category) => { buckets[category] = shuffle(buckets[category]); });
    const categoryOrder = shuffle(Object.keys(buckets));
    const balanced = [];
    while (balanced.length < items.length) {
      categoryOrder.forEach((category) => {
        const next = buckets[category]?.shift();
        if (next) balanced.push(next);
      });
    }
    return balanced;
  };
  const orderKey = 'ben-fusco-feature-order-v3';
  const orderLifetime = 8 * 60 * 60 * 1000;
  const createSessionOrder = () => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(orderKey) || '{}');
      const savedItems = (saved.sources || []).map((src) => uniquePool.find((item) => item.src === src)).filter(Boolean);
      const stillCurrent = Number.isFinite(saved.createdAt) && Date.now() - saved.createdAt < orderLifetime;
      if (stillCurrent && savedItems.length === uniquePool.length) return savedItems;
    } catch (_) { /* Use a fresh shuffle if storage is unavailable or invalid. */ }
    const newOrder = balanceFavorites(uniquePool);
    try {
      window.localStorage.setItem(orderKey, JSON.stringify({
        createdAt: Date.now(),
        sources: newOrder.map((item) => item.src)
      }));
    } catch (_) { /* Optional enhancement. */ }
    return newOrder;
  };
  const shuffledFavorites = createSessionOrder();
  const openingTrio = (favorites.openingTrio || fallbackFavorites.openingTrio).filter(isAllowedFeaturedImage).slice(0, 3);
  const allFeatureItems = [...openingTrio, ...shuffledFavorites];
  const desktopFeatureGroups = [openingTrio];
  for (let index = 0; index < shuffledFavorites.length; index += 3) {
    const group = shuffledFavorites.slice(index, index + 3);
    if (group.length === 3) desktopFeatureGroups.push(group);
  }
  const mobileFeatureGroups = allFeatureItems.map((item) => [item]);
  const mobileFeatureQuery = window.matchMedia('(max-width: 760px)');
  let featureGroups = mobileFeatureQuery.matches ? mobileFeatureGroups : desktopFeatureGroups;
  let featureDots = [];
  let featureIndex = 0;
  let featurePaused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let featureTimer = null;
  const showFeature = (index) => {
    if (!featureImages.length) return;
    featureIndex = (index + featureGroups.length) % featureGroups.length;
    featureImages.forEach((image, imageIndex) => {
      const nextImage = featureGroups[featureIndex][imageIndex];
      if (!nextImage) return;
      image.src = nextImage.src;
      image.alt = nextImage.alt;
    });
    featureDots.forEach((dot, dotIndex) => {
      dot.setAttribute('aria-current', String(dotIndex === featureIndex));
    });
    const unit = mobileFeatureQuery.matches ? 'image' : 'set';
    if (featureStatus) featureStatus.textContent = `Showing featured ${unit} ${featureIndex + 1} of ${featureGroups.length}.`;
    if (featureCounter) featureCounter.textContent = `${featureIndex + 1} / ${featureGroups.length}`;
    const nextGroup = featureGroups[(featureIndex + 1) % featureGroups.length];
    nextGroup.forEach((item) => {
      const preload = new Image();
      preload.src = item.src;
    });
  };
  const stopFeatureTimer = () => {
    window.clearInterval(featureTimer);
    featureTimer = null;
  };
  const startFeatureTimer = () => {
    stopFeatureTimer();
    if (!featurePaused && featureImages.length) featureTimer = window.setInterval(() => showFeature(featureIndex + 1), 6500);
  };
  const moveFeature = (index) => {
    showFeature(index);
    startFeatureTimer();
  };
  const renderFeatureDots = () => {
    featureDots.forEach((dot) => dot.remove());
    featureDots = [];
    if (featureCounter) featureCounter.hidden = !mobileFeatureQuery.matches;
    if (!featureDotsWrap || !featureToggle || mobileFeatureQuery.matches) return;
    featureGroups.forEach((_, dotIndex) => {
      const dot = document.createElement('button');
      dot.className = 'feature-dot';
      dot.type = 'button';
      dot.dataset.featureDot = '';
      dot.setAttribute('aria-current', String(dotIndex === featureIndex));
      dot.setAttribute('aria-label', `Featured set ${dotIndex + 1} of ${featureGroups.length}`);
      dot.addEventListener('click', () => moveFeature(dotIndex));
      featureDotsWrap.insertBefore(dot, featureCounter || featureToggle);
      featureDots.push(dot);
    });
  };
  document.querySelector('[data-feature-prev]')?.addEventListener('click', () => moveFeature(featureIndex - 1));
  document.querySelector('[data-feature-next]')?.addEventListener('click', () => moveFeature(featureIndex + 1));
  renderFeatureDots();
  showFeature(0);
  const syncFeatureMode = () => {
    featureGroups = mobileFeatureQuery.matches ? mobileFeatureGroups : desktopFeatureGroups;
    featureIndex = 0;
    renderFeatureDots();
    showFeature(0);
    startFeatureTimer();
  };
  if (mobileFeatureQuery.addEventListener) mobileFeatureQuery.addEventListener('change', syncFeatureMode);
  else mobileFeatureQuery.addListener(syncFeatureMode);
  if (featureToggle) {
    featureToggle.textContent = featurePaused ? 'Play' : 'Pause';
    featureToggle.setAttribute('aria-pressed', String(featurePaused));
    featureToggle.setAttribute('aria-label', featurePaused ? 'Play featured gallery' : 'Pause featured gallery');
  }
  featureToggle?.addEventListener('click', () => {
    featurePaused = !featurePaused;
    featureToggle.textContent = featurePaused ? 'Play' : 'Pause';
    featureToggle.setAttribute('aria-pressed', String(featurePaused));
    featureToggle.setAttribute('aria-label', featurePaused ? 'Play featured gallery' : 'Pause featured gallery');
    startFeatureTimer();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopFeatureTimer();
    else startFeatureTimer();
  });
  startFeatureTimer();

  const shufflePortfolioEntries = (entries) => {
    const shuffled = entries.slice();
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  };

  const mixPortfolioCategory = (category, getSeries) => {
    const figures = [...document.querySelectorAll(`.portfolio-item[data-category~="${category}"]`)];
    if (figures.length < 2) return;

    const grouped = new Map();
    figures.forEach((figure) => {
      const image = figure.querySelector('img');
      if (!image) return;
      const entry = { src: image.getAttribute('src'), alt: image.alt };
      const series = getSeries(entry.src || '');
      if (!grouped.has(series)) grouped.set(series, []);
      grouped.get(series).push(entry);
    });

    const queues = shufflePortfolioEntries(
      [...grouped.entries()].map(([series, entries]) => ({
        series,
        entries: shufflePortfolioEntries(entries)
      }))
    );
    const mixed = [];
    let previousSeries = '';
    while (queues.some((queue) => queue.entries.length)) {
      const differentSeries = queues.filter((queue) => queue.entries.length && queue.series !== previousSeries);
      const candidates = differentSeries.length ? differentSeries : queues.filter((queue) => queue.entries.length);
      const mostRemaining = Math.max(...candidates.map((queue) => queue.entries.length));
      const balancedCandidates = candidates.filter((queue) => queue.entries.length === mostRemaining);
      const selected = balancedCandidates[Math.floor(Math.random() * balancedCandidates.length)];
      mixed.push(selected.entries.shift());
      previousSeries = selected.series;
    }

    figures.forEach((figure, index) => {
      const image = figure.querySelector('img');
      const entry = mixed[index];
      if (!image || !entry) return;
      image.setAttribute('src', entry.src);
      image.alt = entry.alt;
    });
  };

  mixPortfolioCategory('events', (src) => /events-0[1-5]\.jpg$/i.test(src) ? 'nightlife' : 'concert');
  mixPortfolioCategory('portraits', (src) => {
    const number = Number(src.match(/portraits-(\d+)\.jpg$/i)?.[1]);
    if ([1, 2].includes(number)) return 'green-dress';
    if ([4, 6, 7].includes(number)) return 'jordan';
    if ([9, 10].includes(number)) return 'fishing';
    return `single-${number}`;
  });

  const filterButtons = [...document.querySelectorAll('.filter-btn')];
  const portfolioItems = [...document.querySelectorAll('.portfolio-item')];
  const emptyGallery = document.querySelector('.empty-gallery');
  const loadWrap = document.querySelector('.load-wrap');
  const loadButton = document.querySelector('[data-load-more]');
  let activeFilter = 'all';
  let visibleLimit = 9;

  const applyPortfolioState = () => {
    let matchingCount = 0;
    portfolioItems.forEach((item) => {
      const categories = (item.dataset.category || '').split(' ');
      const matches = activeFilter === 'all' || categories.includes(activeFilter);
      if (matches) matchingCount += 1;
      const paged = matches && matchingCount > visibleLimit;
      item.hidden = !matches;
      item.classList.toggle('is-paged', paged);
    });
    if (emptyGallery) emptyGallery.hidden = matchingCount !== 0;
    if (loadWrap) loadWrap.hidden = matchingCount <= visibleLimit;
  };

  const setFilter = (filter, updateUrl = true) => {
    activeFilter = filter;
    visibleLimit = 9;
    filterButtons.forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    applyPortfolioState();
    if (updateUrl && window.history?.replaceState) {
      const url = new URL(window.location.href);
      if (filter === 'all') url.searchParams.delete('filter');
      else url.searchParams.set('filter', filter);
      window.history.replaceState({}, '', url);
    }
  };

  if (filterButtons.length && portfolioItems.length) {
    filterButtons.forEach((button) => button.addEventListener('click', () => setFilter(button.dataset.filter)));
    const requested = new URLSearchParams(window.location.search).get('filter');
    const validFilter = filterButtons.some((button) => button.dataset.filter === requested) ? requested : 'all';
    setFilter(validFilter, false);
  }
  loadButton?.addEventListener('click', () => {
    visibleLimit += 9;
    applyPortfolioState();
  });

  if (portfolioItems.length) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Portfolio image preview');
    lightbox.innerHTML = '<button class="lightbox-close" type="button" aria-label="Close image preview">×</button><button class="lightbox-nav lightbox-prev" type="button" aria-label="Previous portfolio image">‹</button><figure class="lightbox-figure"><img alt=""><figcaption class="lightbox-caption"></figcaption><span class="lightbox-count" aria-live="polite"></span></figure><button class="lightbox-nav lightbox-next" type="button" aria-label="Next portfolio image">›</button>';
    document.body.appendChild(lightbox);
    const lightboxImage = lightbox.querySelector('img');
    const lightboxCaption = lightbox.querySelector('.lightbox-caption');
    const lightboxCount = lightbox.querySelector('.lightbox-count');
    const closeButton = lightbox.querySelector('.lightbox-close');
    const previousButton = lightbox.querySelector('.lightbox-prev');
    const nextButton = lightbox.querySelector('.lightbox-next');
    const initialPreview = portfolioItems[0]?.querySelector('img');
    if (initialPreview) {
      lightboxImage.src = initialPreview.currentSrc || initialPreview.src;
      lightboxImage.alt = initialPreview.alt;
    }
    let previousFocus = null;
    let currentItem = null;
    let touchStartX = 0;
    const availableItems = () => portfolioItems.filter((item) => !item.hidden && !item.classList.contains('is-paged'));
    const showLightboxItem = (item) => {
      const source = item?.querySelector('img');
      if (!source) return;
      currentItem = item;
      lightboxImage.src = source.currentSrc || source.src;
      lightboxImage.alt = source.alt;
      lightboxCaption.textContent = source.alt;
      const items = availableItems();
      const index = items.indexOf(item);
      lightboxCount.textContent = `${index + 1} / ${items.length}`;
      const multiple = items.length > 1;
      previousButton.hidden = !multiple;
      nextButton.hidden = !multiple;
    };
    const moveLightbox = (direction) => {
      const items = availableItems();
      const index = items.indexOf(currentItem);
      if (index < 0 || items.length < 2) return;
      showLightboxItem(items[(index + direction + items.length) % items.length]);
    };
    const closeLightbox = () => {
      lightbox.classList.remove('open');
      document.body.classList.remove('menu-open');
      previousFocus?.focus();
    };
    portfolioItems.forEach((item) => {
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.setAttribute('aria-label', `Open ${item.querySelector('img')?.alt || 'portfolio image'}`);
      const open = () => {
        const source = item.querySelector('img');
        if (!source) return;
        previousFocus = item;
        showLightboxItem(item);
        lightbox.classList.add('open');
        document.body.classList.add('menu-open');
        closeButton.focus();
      };
      item.addEventListener('click', open);
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      });
    });
    closeButton.addEventListener('click', closeLightbox);
    previousButton.addEventListener('click', () => moveLightbox(-1));
    nextButton.addEventListener('click', () => moveLightbox(1));
    lightbox.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
    lightbox.addEventListener('touchstart', (event) => { touchStartX = event.changedTouches[0]?.clientX || 0; }, { passive: true });
    lightbox.addEventListener('touchend', (event) => {
      const distance = (event.changedTouches[0]?.clientX || 0) - touchStartX;
      if (Math.abs(distance) > 55) moveLightbox(distance > 0 ? -1 : 1);
    }, { passive: true });
    document.addEventListener('keydown', (event) => {
      if (!lightbox.classList.contains('open')) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') moveLightbox(-1);
      if (event.key === 'ArrowRight') moveLightbox(1);
      if (event.key === 'Tab') {
        const controls = [closeButton, previousButton, nextButton].filter((button) => !button.hidden);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  const serviceMaps = document.querySelectorAll('[data-service-map]');
  if (serviceMaps.length) {
    const center = [45.3977, -75.8348];
    const radiusMetres = 10000;

    if (!window.L) {
      serviceMaps.forEach((mapElement) => {
        mapElement.innerHTML = '<a class="map-fallback" href="https://www.openstreetmap.org/#map=10/45.3977/-75.8348">View the Ottawa and Gatineau service area map</a>';
      });
    } else {
      serviceMaps.forEach((mapElement) => {
        const map = window.L.map(mapElement, {
          scrollWheelZoom: false,
          zoomControl: true
        }).setView(center, 10);

        window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          crossOrigin: true,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        const radius = window.L.circle(center, {
          radius: radiusMetres,
          color: '#9b5f5d',
          weight: 2,
          opacity: 0.95,
          fillColor: '#9b5f5d',
          fillOpacity: 0.18
        }).addTo(map);

        window.L.circleMarker(center, {
          radius: 5,
          color: '#ffffff',
          weight: 2,
          fillColor: '#151515',
          fillOpacity: 1
        }).addTo(map).bindPopup('<strong>Approximate service area</strong><br>Serving Gatineau, Ottawa, Aylmer, and surrounding areas.');

        map.fitBounds(radius.getBounds(), { padding: [24, 24] });
        window.setTimeout(() => map.invalidateSize(), 0);
      });
    }
  }

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        // The website remains fully usable when offline caching is unavailable.
      });
    }, { once: true });
  }
});
