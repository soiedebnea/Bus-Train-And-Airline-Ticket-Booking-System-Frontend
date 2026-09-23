// booking.js — passenger form, live ticket-stub preview, and final booking call.

const transportId = getQueryParam('transport_id');
const seatNumber = getQueryParam('seat_number');
const country = getQueryParam('country');
const countryName = getQueryParam('countryName') || country;
const mode = getQueryParam('mode');
const operatorName = getQueryParam('operatorName') || 'Company';

const routeLabel = document.getElementById('routeLabel');
const bookingForm = document.getElementById('bookingForm');
const formError = document.getElementById('formError');
const confirmBtn = document.getElementById('confirmBtn');

const previewRoute = document.getElementById('previewRoute');
const previewMeta = document.getElementById('previewMeta');
const previewName = document.getElementById('previewName');
const previewSeat = document.getElementById('previewSeat');
const previewDate = document.getElementById('previewDate');
const previewFare = document.getElementById('previewFare');

let transport = null;

if (!transportId || !seatNumber) {
  routeLabel.textContent = 'Missing seat selection';
  previewMeta.textContent = 'Go back and pick a seat first.';
  confirmBtn.disabled = true;
} else {
  init();
}

async function init() {
  try {
    transport = await api.getTransport(transportId);

    renderBreadcrumb('breadcrumb', [
      { label: 'Country', href: 'index.html' },
      { label: countryName, href: `mode.html?${qs({ country, countryName })}` },
      { label: MODE_LABELS[mode] || mode, href: `operators.html?${qs({ country, countryName, mode })}` },
      { label: operatorName, href: `transports.html?${qs({ operator: transport.operator._id || transport.operator, country, countryName, mode, operatorName })}` },
      { label: 'Passenger details' },
    ]);

    routeLabel.textContent = `${transport.source} → ${transport.destination}`;
    previewRoute.innerHTML = `${transport.source}<span class="arrow"> → </span>${transport.destination}`;
    previewMeta.textContent = `${transport.serviceName} (${transport.serviceNumber}) · departs ${transport.departureTime}`;
    previewSeat.textContent = seatNumber;
    previewDate.textContent = formatDate(transport.journeyDate);
    previewFare.textContent = formatMoney(transport.price, transport.currency);
  } catch (err) {
    routeLabel.textContent = 'Could not load journey';
    previewMeta.textContent = err.message;
    confirmBtn.disabled = true;
  }
}

document.getElementById('name').addEventListener('input', (e) => {
  previewName.textContent = e.target.value.trim() || '—';
});

bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.textContent = '';

  const formData = new FormData(bookingForm);
  const passenger = {
    name: formData.get('name').trim(),
    age: Number(formData.get('age')),
    gender: formData.get('gender'),
    email: formData.get('email').trim(),
    phone: formData.get('phone').trim(),
  };

  if (!passenger.name || !passenger.age || !passenger.gender) {
    formError.textContent = 'Please fill in name, age and gender.';
    return;
  }

  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Booking…';

  try {
    const ticket = await api.bookTicket({
      transport_id: transportId,
      seat_number: seatNumber,
      passenger,
    });
    window.location.href = `ticket.html?pnr=${ticket.pnr}`;
  } catch (err) {
    formError.textContent = err.message;
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm booking';
  }
});