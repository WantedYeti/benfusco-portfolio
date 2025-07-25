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

