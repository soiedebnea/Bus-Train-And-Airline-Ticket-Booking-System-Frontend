// seats.js — loads the seat map for a transport and lets the rider pick one.

const transportId = getQueryParam('transport_id');
const country = getQueryParam('country');
const countryName = getQueryParam('countryName') || country;
const mode = getQueryParam('mode');
const operatorName = getQueryParam('operatorName') || 'Company';

const seatGrid = document.getElementById('seatGrid');
const routeLabel = document.getElementById('routeLabel');
const journeyMeta = document.getElementById('journeyMeta');
const chosenSeatLabel = document.getElementById('chosenSeatLabel');
const chosenFare = document.getElementById('chosenFare');
const continueBtn = document.getElementById('continueBtn');

let transport = null;
let chosenSeatNumber = null;

if (!transportId) {
  routeLabel.textContent = 'No transport selected';
  journeyMeta.textContent = 'Go back and search for a departure first.';
} else {
  init();
}

async function init() {
  try {
    transport = await api.getTransport(transportId);
    const seats = await api.getSeats(transportId);

    renderBreadcrumb('breadcrumb', [
      { label: 'Country', href: 'index.html' },
      { label: countryName, href: `mode.html?${qs({ country, countryName })}` },
      { label: MODE_LABELS[mode] || mode, href: `operators.html?${qs({ country, countryName, mode })}` },
      { label: operatorName, href: `transports.html?${qs({ operator: transport.operator._id || transport.operator, country, countryName, mode, operatorName })}` },
      { label: 'Seat' },
    ]);

    routeLabel.textContent = `${transport.source} → ${transport.destination}`;
    journeyMeta.textContent =
      `${transport.serviceName} (${transport.serviceNumber}) · ${formatDate(transport.journeyDate)} · ` +
      `departs ${transport.departureTime} · ${formatMoney(transport.price, transport.currency)} per seat`;

    renderSeats(seats, transport.mode);
  } catch (err) {
    routeLabel.textContent = 'Could not load seats';
    journeyMeta.textContent = err.message;
  }
}

function renderSeats(seats, transportMode) {
  const isWide = transportMode === 'airline';
  seatGrid.className = 'seat-grid' + (isWide ? ' wide-cabin' : '');
  const groupSize = isWide ? 3 : 2;

  seatGrid.innerHTML = '';
  seats.forEach((seat, index) => {
    if (index > 0 && index % groupSize === 0) {
      const gap = document.createElement('div');
      gap.className = 'aisle-gap';
      seatGrid.appendChild(gap);
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'seat' + (seat.isBooked ? ' seat-taken' : '');
    btn.textContent = seat.seatNumber;
    btn.disabled = !!seat.isBooked;
    btn.addEventListener('click', () => selectSeat(seat, btn));
    seatGrid.appendChild(btn);
  });
}

function selectSeat(seat, btn) {
  document.querySelectorAll('.seat.seat-chosen').forEach((el) => el.classList.remove('seat-chosen'));
  btn.classList.add('seat-chosen');
  chosenSeatNumber = seat.seatNumber;

  chosenSeatLabel.textContent = seat.seatNumber;
  chosenFare.textContent = formatMoney(transport.price, transport.currency);
  continueBtn.disabled = false;
}

continueBtn.addEventListener('click', () => {
  if (!chosenSeatNumber) return;
  const params = qs({
    transport_id: transportId, seat_number: chosenSeatNumber,
    country, countryName, mode, operatorName,
  });
  window.location.href = `booking.html?${params}`;
});