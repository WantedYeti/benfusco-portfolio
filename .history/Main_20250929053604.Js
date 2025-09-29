// (Removed legacy .folder-toggle code – not used by current markup)

function toggleMenu() {
  const menu = document.getElementById('menu');
  const menuToggle = document.querySelector('.menu-toggle');
  const isOpen = menu.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', isOpen);
}

// Spinner show/hide
function showSpinner() {
  const spinner = document.querySelector('.spinner');
  if (spinner) spinner.style.display = 'block';
}

function hideSpinner() {
  const spinner = document.querySelector('.spinner');
  if (spinner) spinner.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  // Setup hamburger menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', toggleMenu);
  }

  // Show spinner before map loads
  // Show spinner before map loads (only if present)
  if (document.getElementById('map')) {
    showSpinner();
    // Initialize map only if Leaflet (L) is available
    if (typeof L !== 'undefined') {
      const map = L.map('map');
      const centerCoords = [45.3977, -75.8348];
      map.setView(centerCoords, 11);

      // Add tile layer and hide spinner when tiles load
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap'
      }).addTo(map);

      tileLayer.on('load', () => {
        hideSpinner();
      });

      // Add marker and circle
      L.marker(centerCoords).addTo(map)
        .bindPopup('Ben Fusco Photography – Gatineau, QC')
        .openPopup();

      L.circle(centerCoords, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.2,
        radius: 10000
      }).addTo(map);
    } else {
      console.warn('Leaflet (L) not found — map will not initialize.');
      hideSpinner();
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Instagram slider / generic small slider initialization
  const sliderRoot = document.querySelector('.ig-slider');
  if (!sliderRoot) return;

  const slides = sliderRoot.querySelectorAll('.ig-slide');
  const dots = sliderRoot.querySelectorAll('.ig-dot');
  const prevBtn = sliderRoot.querySelector('.nav.prev');
  const nextBtn = sliderRoot.querySelector('.nav.next');
  const playBtn = document.getElementById('igPlayBtn');
  let currentIndex = 0;
  let autoplay = null;

  function updateSlider(index) {
    // Infinite loop: wrap index
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    currentIndex = index;

    slides.forEach((slide, i) => {
      slide.classList.remove('active', 'prev', 'next');
    });
    const total = slides.length;
    slides[index].classList.add('active');
    slides[(index - 1 + total) % total].classList.add('prev');
    slides[(index + 1) % total].classList.add('next');

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });

    // Play button icon
    if (playBtn) {
      if (autoplay) {
        playBtn.classList.add('active');
        const playI = playBtn.querySelector('.play-icon');
        const pauseI = playBtn.querySelector('.pause-icon');
        if (playI) playI.style.display = 'none';
        if (pauseI) pauseI.style.display = 'inline-block';
      } else {
        playBtn.classList.remove('active');
        const playI = playBtn.querySelector('.play-icon');
        const pauseI = playBtn.querySelector('.pause-icon');
        if (playI) playI.style.display = 'inline-block';
        if (pauseI) pauseI.style.display = 'none';
      }
    }
  }

  function nextSlide() {
    updateSlider(currentIndex + 1);
  }

  function prevSlide() {
    updateSlider(currentIndex - 1);
  }

  function goToSlide(i) {
    updateSlider(i);
  }

  function startAutoplay() {
    if (autoplay) clearInterval(autoplay);
    autoplay = setInterval(nextSlide, 4000);
    updateSlider(currentIndex);
  }

  function stopAutoplay() {
    if (autoplay) clearInterval(autoplay);
    autoplay = null;
    updateSlider(currentIndex);
  }

  if (playBtn) {
    playBtn.addEventListener('click', () => {
    if (autoplay) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
    });
  }

  nextBtn.addEventListener('click', () => {
    nextSlide();
    stopAutoplay();
  });
  prevBtn.addEventListener('click', () => {
    prevSlide();
    stopAutoplay();
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goToSlide(i);
      stopAutoplay();
    });
  });

  // Initialize
  updateSlider(currentIndex);
  startAutoplay(); // <-- Add this line to start the slideshow automatically
});

const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.getElementById('menu');
const navOverlay = document.querySelector('.nav-overlay');

function closeMenu() {
  if (mobileNav) mobileNav.classList.remove('open');
}

if (menuToggle && mobileNav) {
  menuToggle.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', mobileNav.classList.contains('open'));
  });
}

if (navOverlay) {
  navOverlay.addEventListener('click', closeMenu);
}

// Optional: close menu when a link is clicked
if (mobileNav) {
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

document.querySelectorAll('.folder-parent').forEach(parent => {
  parent.addEventListener('click', function(e) {
    e.stopPropagation();
    document.querySelectorAll('.folder-parent').forEach(p => {
      if (p !== parent) p.classList.remove('open');
    });
    parent.classList.toggle('open');
  });
});
document.addEventListener('click', () => {
  document.querySelectorAll('.folder-parent').forEach(p => p.classList.remove('open'));
});

// Mobile dropdown toggle for Portfolio
document.querySelectorAll('.mobile-nav .folder-parent > span').forEach(span => {
  span.addEventListener('click', function(e) {
    e.stopPropagation();
    const parent = this.parentElement;
    parent.classList.toggle('open');
    // Optionally close other open dropdowns
    document.querySelectorAll('.mobile-nav .folder-parent').forEach(p => {
      if (p !== parent) p.classList.remove('open');
    });
  });
});

// Select the navigation bar (present on homepage). Guard on pages without it.
const navbar = document.querySelector('.navbar');

// Function to toggle the 'scrolled' class
function handleScroll() {
  if (!navbar) return; // not all pages have the sticky navbar markup
  // If any lightbox is open, don't change state
  if (document.body.classList.contains('lightbox-open') || document.body.classList.contains('fx-lightbox-open')) return;
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const heroHeight = hero.offsetHeight;
  if (window.scrollY > heroHeight) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

}

// Add scroll event listener only when navbar exists
if (navbar) {
  window.addEventListener('scroll', handleScroll);
}


// Runtime safeguard: ensure homepage heading reads "Photo Gallery"
document.addEventListener('DOMContentLoaded', () => {
  try {
    const section = document.querySelector('.portraits-section');
    if (!section) return;

    // Ensure there is exactly one H2 and it says "Photo Gallery"
    const headings = Array.from(section.querySelectorAll('h2'));
    const desiredId = 'photo-gallery-heading';
    if (headings.length === 0) {
      const h2 = document.createElement('h2');
      h2.id = desiredId;
      h2.className = 'section-title';
      h2.textContent = 'Photo Gallery';
      section.prepend(h2);
    } else {
      // First heading becomes the canonical one
      const first = headings[0];
      first.textContent = 'Photo Gallery';
      if (!first.id) first.id = desiredId; else first.id = desiredId; // normalize id
      first.classList.add('section-title');

      // Remove any extra headings with conflicting text (e.g., old "Portfolio")
      headings.slice(1).forEach(h => {
        if (h.textContent.trim().toLowerCase() !== 'photo gallery') {
          h.remove();
        }
      });
    }

    // Keep aria-labelledby accurate
    section.setAttribute('aria-labelledby', desiredId);
  } catch (err) {
    console.warn('Heading safeguard failed:', err);
  }
});

// Desktop dropdown toggles (click to open)
document.addEventListener('DOMContentLoaded', () => {
  // support both the homepage .navbar and inner-page .desktop-nav structures
  const dropdownLinks = document.querySelectorAll('.navbar .folder-parent > a, .desktop-nav .folder-parent > a');
  dropdownLinks.forEach(link => {
    const parent = link.closest('.folder-parent');
    if (!parent) return;
    link.setAttribute('aria-haspopup', 'true');
    link.setAttribute('aria-expanded', 'false');

    // Click toggles open; prevent default navigation to '#'
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = parent.classList.toggle('open');
      link.setAttribute('aria-expanded', String(isOpen));
      // close other dropdowns
      document.querySelectorAll('.folder-parent').forEach(p => { if (p !== parent) { p.classList.remove('open'); const a=p.querySelector(':scope > a'); if (a) a.setAttribute('aria-expanded','false'); } });
    });

    // Keyboard: Space/Enter toggle; Escape closes
    link.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        link.click();
      } else if (e.key === 'Escape') {
        parent.classList.remove('open');
        link.setAttribute('aria-expanded','false');
      }
    });
  });

  // Clicking anywhere else closes any open dropdown
  document.addEventListener('click', (e) => {
    document.querySelectorAll('.folder-parent.open').forEach(p => {
      if (!p.contains(e.target)) {
        p.classList.remove('open');
        const a = p.querySelector(':scope > a');
        if (a) a.setAttribute('aria-expanded','false');
      }
    });
  });
});

