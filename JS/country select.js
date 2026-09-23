// country-select.js — step 1: load and render country cards.

const countryGrid = document.getElementById('countryGrid');

async function loadCountries() {
  try {
    const countries = await api.getCountries();
    if (!countries.length) {
      countryGrid.innerHTML = `<div class="empty-state">No countries available yet. Add some from the Admin page.</div>`;
      return;
    }
    countryGrid.innerHTML = countries.map((c) => `
      <a class="select-card" href="mode.html?country=${c.code}&countryName=${encodeURIComponent(c.name)}">
        <span class="flag">${c.flag}</span>
        <span class="title">${c.name}</span>
        <span class="subtitle">${c.code}</span>
      </a>
    `).join('');
  } catch (err) {
    countryGrid.innerHTML = `<div class="empty-state">Could not load countries: ${err.message}</div>`;
  }
}

loadCountries();