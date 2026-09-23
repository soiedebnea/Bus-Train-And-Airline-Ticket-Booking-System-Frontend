// transports.js — step 4: timetable of one operator's scheduled services.

const operatorId = getQueryParam('operator');
const country = getQueryParam('country');
const countryName = getQueryParam('countryName') || country;
const mode = getQueryParam('mode');
const operatorName = getQueryParam('operatorName') || 'Company';

const pageTitle = document.getElementById('pageTitle');
const resultsList = document.getElementById('resultsList');
const filterBtn = document.getElementById('filterBtn');

if (!operatorId) {
  document.querySelector('main .wrap').innerHTML = `
    <div class="empty-state">No company selected. <a href="index.html">Start over.</a></div>`;
} else {
  renderBreadcrumb('breadcrumb', [
    { label: 'Country', href: 'index.html' },
    { label: countryName, href: `mode.html?${qs({ country, countryName })}` },
    { label: MODE_LABELS[mode] || mode, href: `operators.html?${qs({ country, countryName, mode })}` },
    { label: operatorName },
  ]);
  pageTitle.textContent = `${operatorName} — scheduled ${mode === 'train' ? 'services' : 'departures'}`;
  loadResults();
}

function renderResults(transports) {
  if (!transports.length) {
    resultsList.innerHTML = `<div class="empty-state">No scheduled services match that search.</div>`;
    return;
  }

  resultsList.innerHTML = transports.map((t) => {
    const avail = t.availableSeats;
    const seatsClass = avail === 0 ? 'low' : (avail <= 5 ? 'low' : 'ok');
    const seatsLabel = avail === 0 ? 'Full' : `${avail} left`;
    const disabled = avail === 0 ? 'style="opacity:.45;pointer-events:none;"' : '';

    return `
      <div class="board-row">
        <span>
          <div class="op-name">${t.serviceName}</div>
          <div class="op-number">${t.serviceNumber} · ${formatDate(t.journeyDate)}</div>
        </span>
        <span class="route-cell">${t.source}<span class="arrow">→</span>${t.destination}</span>
        <span class="time-cell">${t.departureTime}<span class="label">departs</span></span>
        <span class="time-cell">${t.arrivalTime}<span class="label">arrives</span></span>
        <span class="price-cell">${formatMoney(t.price, t.currency)}</span>
        <span class="seats-cell ${seatsClass}">${seatsLabel}</span>
        <a class="btn btn-amber" ${disabled} href="seats.html?${qs({
          transport_id: t._id, country, countryName, mode, operatorName,
        })}">Select seat</a>
      </div>`;
  }).join('');
}

async function loadResults() {
  resultsList.innerHTML = `<div class="empty-state">Loading timetable…</div>`;
  try {
    const transports = await api.getTransports({
      operator: operatorId,
      source: document.getElementById('source').value,
      destination: document.getElementById('destination').value,
      date: document.getElementById('date').value,
    });
    renderResults(transports);
  } catch (err) {
    resultsList.innerHTML = `<div class="empty-state">Could not load results: ${err.message}</div>`;
  }
}

filterBtn.addEventListener('click', loadResults);