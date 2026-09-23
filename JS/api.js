// api.js
// Small fetch wrapper shared by every page, plus UI helpers used across
// the country -> mode -> operator -> transport -> seat -> ticket flow.
// Change API_BASE if your backend runs somewhere other than localhost:5000.

const API_BASE = 'http://localhost:5000/api';

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  let body = null;
  try {
    body = await res.json();
  } catch (_) {
    // no JSON body - leave as null
  }

  if (!res.ok) {
    const message = (body && body.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
}

const api = {
  getCountries: () => apiRequest('/countries'),

  getOperators: (params = {}) => apiRequest(`/operators${toQuery(params)}`),
  getOperator: (id) => apiRequest(`/operators/${id}`),
  addOperator: (data) => apiRequest('/operators', { method: 'POST', body: JSON.stringify(data) }),
  deleteOperator: (id) => apiRequest(`/operators/${id}`, { method: 'DELETE' }),

  getTransports: (params = {}) => apiRequest(`/transports${toQuery(params)}`),
  getTransport: (id) => apiRequest(`/transports/${id}`),
  getSeats: (transportId) => apiRequest(`/transports/${transportId}/seats`),
  addTransport: (data) => apiRequest('/transports', { method: 'POST', body: JSON.stringify(data) }),
  deleteTransport: (id) => apiRequest(`/transports/${id}`, { method: 'DELETE' }),

  bookTicket: (data) => apiRequest('/tickets/book', { method: 'POST', body: JSON.stringify(data) }),
  getTicket: (pnr) => apiRequest(`/tickets/${pnr}`),
  cancelTicket: (pnr) => apiRequest(`/tickets/${pnr}/cancel`, { method: 'POST' }),
};

function toQuery(params) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString();
  return query ? `?${query}` : '';
}

// ---- tiny helpers ----

const MODE_LABELS = { airline: 'Airline', bus: 'Bus', train: 'Train' };
const MODE_ICONS = { airline: '✈️', bus: '🚌', train: '🚆' };

function showToast(message, isError = false) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3200);
}

function qs(params) {
  return new URLSearchParams(params).toString();
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function formatMoney(value, currency) {
  return `${currency || ''} ${Number(value).toLocaleString()}`.trim();
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

// Renders the "Country > Mode > Company > ..." breadcrumb used on every
// step-2-and-later page. `steps` is an array of { label, href } - the last
// entry (no href) is rendered as the current step.
function renderBreadcrumb(containerId, steps) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = steps.map((step, i) => {
    const isLast = i === steps.length - 1;
    const piece = step.href && !isLast
      ? `<a href="${step.href}">${step.label}</a>`
      : `<span class="${isLast ? 'current' : ''}">${step.label}</span>`;
    return i === 0 ? piece : `<span class="sep">›</span>${piece}`;
  }).join('');
}