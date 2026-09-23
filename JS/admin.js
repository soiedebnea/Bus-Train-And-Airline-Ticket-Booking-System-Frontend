// admin.js — manage companies (operators) and their scheduled services.

const countrySelect = document.getElementById('countrySelect');
const modeSelect = document.getElementById('modeSelect');

const addOperatorForm = document.getElementById('addOperatorForm');
const operatorError = document.getElementById('operatorError');
const operatorTableBody = document.getElementById('operatorTableBody');

const addTransportForm = document.getElementById('addTransportForm');
const transportError = document.getElementById('transportError');
const transportTableBody = document.getElementById('transportTableBody');
const serviceOperatorSelect = document.getElementById('serviceOperator');

const companiesTab = document.getElementById('companiesTab');
const servicesTab = document.getElementById('servicesTab');

let countries = [];
let currentOperators = [];

// ---- tabs ----
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    companiesTab.style.display = tab === 'companies' ? '' : 'none';
    servicesTab.style.display = tab === 'services' ? '' : 'none';
  });
});

// ---- init ----
async function init() {
  try {
    countries = await api.getCountries();
    countrySelect.innerHTML = countries.map((c) => `<option value="${c.code}">${c.flag} ${c.name}</option>`).join('');
  } catch (err) {
    countrySelect.innerHTML = `<option>Could not load countries</option>`;
  }
  await refreshAll();
}

countrySelect.addEventListener('change', refreshAll);
modeSelect.addEventListener('change', refreshAll);

async function refreshAll() {
  await loadOperators();
  await loadTransports();
}

// ---- companies ----

async function loadOperators() {
  const country = countrySelect.value;
  const mode = modeSelect.value;
  operatorTableBody.innerHTML = `<tr><td colspan="4">Loading…</td></tr>`;
  try {
    currentOperators = await api.getOperators({ country, mode });
    if (!currentOperators.length) {
      operatorTableBody.innerHTML = `<tr><td colspan="4">No companies yet for this country/mode.</td></tr>`;
    } else {
      operatorTableBody.innerHTML = currentOperators.map((op) => `
        <tr>
          <td>${op.name}</td>
          <td>${op.mode}</td>
          <td>${op.countryCode}</td>
          <td><button class="btn-ghost" data-op-id="${op._id}">Remove</button></td>
        </tr>
      `).join('');
      operatorTableBody.querySelectorAll('button[data-op-id]').forEach((btn) => {
        btn.addEventListener('click', () => removeOperator(btn.dataset.opId));
      });
    }
  } catch (err) {
    operatorTableBody.innerHTML = `<tr><td colspan="4">${err.message}</td></tr>`;
  }

  // keep the "add service" dropdown in sync with this country/mode's companies
  serviceOperatorSelect.innerHTML = currentOperators.length
    ? currentOperators.map((op) => `<option value="${op._id}">${op.name}</option>`).join('')
    : `<option value="">No companies yet — add one first</option>`;
}

async function removeOperator(id) {
  if (!confirm('Remove this company? It must have no scheduled services left.')) return;
  try {
    await api.deleteOperator(id);
    showToast('Company removed.');
    await refreshAll();
  } catch (err) {
    showToast(err.message, true);
  }
}

addOperatorForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  operatorError.textContent = '';
  const name = document.getElementById('operatorName').value.trim();
  const description = document.getElementById('operatorDescription').value.trim();
  const country = countrySelect.value;
  const mode = modeSelect.value;

  if (!name || !country || !mode) {
    operatorError.textContent = 'Please fill in the company name.';
    return;
  }

  try {
    await api.addOperator({ name, mode, countryCode: country, description });
    showToast('Company added.');
    addOperatorForm.reset();
    await refreshAll();
  } catch (err) {
    operatorError.textContent = err.message;
  }
});

// ---- scheduled services ----

async function loadTransports() {
  const country = countrySelect.value;
  const mode = modeSelect.value;
  transportTableBody.innerHTML = `<tr><td colspan="7">Loading…</td></tr>`;
  try {
    const transports = await api.getTransports({ country, mode });
    if (!transports.length) {
      transportTableBody.innerHTML = `<tr><td colspan="7">No scheduled services yet for this country/mode.</td></tr>`;
      return;
    }
    transportTableBody.innerHTML = transports.map((t) => `
      <tr>
        <td>${t.operator && t.operator.name ? t.operator.name : ''}</td>
        <td>${t.serviceName}<br><span class="hint">${t.serviceNumber}</span></td>
        <td>${t.source} → ${t.destination}</td>
        <td>${formatDate(t.journeyDate)}</td>
        <td class="num">${t.availableSeats}/${t.totalSeats}</td>
        <td class="num">${formatMoney(t.price, t.currency)}</td>
        <td><button class="btn-ghost" data-tr-id="${t._id}">Remove</button></td>
      </tr>
    `).join('');
    transportTableBody.querySelectorAll('button[data-tr-id]').forEach((btn) => {
      btn.addEventListener('click', () => removeTransport(btn.dataset.trId));
    });
  } catch (err) {
    transportTableBody.innerHTML = `<tr><td colspan="7">${err.message}</td></tr>`;
  }
}

async function removeTransport(id) {
  if (!confirm('Remove this scheduled service from the timetable?')) return;
  try {
    await api.deleteTransport(id);
    showToast('Removed from timetable.');
    await loadTransports();
  } catch (err) {
    showToast(err.message, true);
  }
}

addTransportForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  transportError.textContent = '';

  const operatorId = serviceOperatorSelect.value;
  if (!operatorId) {
    transportError.textContent = 'Add a company for this country/mode first.';
    return;
  }

  const payload = {
    operatorId,
    serviceName: document.getElementById('serviceName').value.trim(),
    serviceNumber: document.getElementById('serviceNumber').value.trim(),
    source: document.getElementById('source').value.trim(),
    destination: document.getElementById('destination').value.trim(),
    journeyDate: document.getElementById('journeyDate').value,
    departureTime: document.getElementById('departureTime').value,
    arrivalTime: document.getElementById('arrivalTime').value,
    totalSeats: Number(document.getElementById('totalSeats').value),
    price: Number(document.getElementById('price').value),
    currency: document.getElementById('currency').value.trim().toUpperCase(),
  };

  for (const [key, value] of Object.entries(payload)) {
    if (!value) {
      transportError.textContent = 'Please fill in every field.';
      return;
    }
  }

  try {
    await api.addTransport(payload);
    showToast('Added to timetable.');
    addTransportForm.reset();
    await loadTransports();
  } catch (err) {
    transportError.textContent = err.message;
  }
});

init();