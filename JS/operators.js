// operators.js — step 3: list the airline/bus/train companies for this
// country + mode, each showing how many scheduled services it has.

const country = getQueryParam('country');
const countryName = getQueryParam('countryName') || country;
const mode = getQueryParam('mode');

const pageTitle = document.getElementById('pageTitle');
const pageLede = document.getElementById('pageLede');
const operatorGrid = document.getElementById('operatorGrid');

if (!country || !mode) {
  document.querySelector('main .wrap').innerHTML = `
    <div class="empty-state">Missing country or mode. <a href="index.html">Start over.</a></div>`;
} else {
  init();
}

async function init() {
  renderBreadcrumb('breadcrumb', [
    { label: 'Country', href: 'index.html' },
    { label: countryName, href: `mode.html?${qs({ country, countryName })}` },
    { label: MODE_LABELS[mode] || mode },
  ]);

  pageTitle.textContent = `${MODE_LABELS[mode] || mode} companies in ${countryName}`;
  pageLede.textContent = mode === 'train'
    ? 'Pick a rail operator to see its named services.'
    : `Pick a ${mode === 'airline' ? 'carrier' : 'bus company'} to see its scheduled departures.`;

  try {
    const operators = await api.getOperators({ country, mode });
    if (!operators.length) {
      operatorGrid.innerHTML = `<div class="empty-state">No ${mode} companies found for ${countryName} yet.</div>`;
      return;
    }

    // Fetch each operator's service count in parallel.
    const withCounts = await Promise.all(operators.map(async (op) => {
      try {
        const transports = await api.getTransports({ operator: op._id });
        return { ...op, serviceCount: transports.length };
      } catch (_) {
        return { ...op, serviceCount: 0 };
      }
    }));

    operatorGrid.innerHTML = withCounts.map((op) => `
      <a class="select-card operator-card" href="transports.html?${qs({ operator: op._id, country, countryName, mode, operatorName: op.name })}">
        <span>
          <span class="title">${op.name}</span>
          <span class="count">${op.serviceCount} scheduled ${op.serviceCount === 1 ? 'service' : 'services'}</span>
        </span>
        <span class="go">›</span>
      </a>
    `).join('');
  } catch (err) {
    operatorGrid.innerHTML = `<div class="empty-state">Could not load companies: ${err.message}</div>`;
  }
}