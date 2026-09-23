// mode-select.js — step 2: wires up the airline/bus/train cards for this country.

const country = getQueryParam('country');
const countryName = getQueryParam('countryName') || country;

if (!country) {
  document.querySelector('main .wrap').innerHTML = `
    <div class="empty-state">No country selected. <a href="index.html">Go back and pick one.</a></div>`;
} else {
  renderBreadcrumb('breadcrumb', [
    { label: 'Country', href: 'index.html' },
    { label: countryName },
  ]);

  document.querySelectorAll('#modeGrid .select-card').forEach((card) => {
    const mode = card.dataset.mode;
    card.href = `operators.html?${qs({ country, countryName, mode })}`;
  });
}