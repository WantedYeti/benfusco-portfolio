// Menu toggle function
document.querySelectorAll('.folder-toggle').forEach(toggle => {
  const folderParent = toggle.parentElement;
  const submenu = folderParent.nextElementSibling;

  toggle.addEventListener('click', e => {
    e.preventDefault();
    const expanded = folderParent.getAttribute('aria-expanded') === 'true';
    folderParent.setAttribute('aria-expanded', !expanded);
    submenu.hidden = expanded;
  });

  toggle.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle.click();
    }
  });

  document.addEventListener('click', e => {
    if (!folderParent.contains(e.target)) {
      folderParent.setAttribute('aria-expanded', false);
      submenu.hidden = true;
    }
  });
});

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
  showSpinner();

  // Initialize the map
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
});

document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  const prevBtn = document.querySelector('.nav.prev');
  const nextBtn = document.querySelector('.nav.next');
  const playBtn = document.querySelector('.play');
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
    if (autoplay) {
      playBtn.classList.add('active');
      playBtn.querySelector('.play-icon').style.display = 'none';
      playBtn.querySelector('.pause-icon').style.display = 'inline-block';
    } else {
      playBtn.classList.remove('active');
      playBtn.querySelector('.play-icon').style.display = 'inline-block';
      playBtn.querySelector('.pause-icon').style.display = 'none';
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

  playBtn.addEventListener('click', () => {
    if (autoplay) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });

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

