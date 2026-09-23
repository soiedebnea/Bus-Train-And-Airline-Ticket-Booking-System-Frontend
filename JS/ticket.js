// ticket.js — look up a ticket by PNR, render it as a stub, allow cancellation.

const lookupForm = document.getElementById('lookupForm');
const pnrInput = document.getElementById('pnrInput');
const ticketArea = document.getElementById('ticketArea');

function renderTicket(ticket) {
  const { transport, passenger, seatNumber, pnr, status, totalFare, currency } = ticket;
  const operatorName = transport.operator && transport.operator.name ? transport.operator.name : transport.serviceName;

  ticketArea.innerHTML = `
    <div class="ticket-stub">
      <div class="stub-top">
        <div class="stub-route">${transport.source}<span class="arrow"> → </span>${transport.destination}</div>
        <div class="stub-meta">${operatorName} · ${transport.serviceName} (${transport.serviceNumber}) · ${(transport.mode || '').toUpperCase()} · departs ${transport.departureTime}, arrives ${transport.arrivalTime}</div>
      </div>
      <div class="stub-grid">
        <div class="stub-field"><div class="k">Passenger</div><div class="v">${passenger.name}</div></div>
        <div class="stub-field"><div class="k">Seat</div><div class="v">${seatNumber}</div></div>
        <div class="stub-field"><div class="k">Date</div><div class="v">${formatDate(transport.journeyDate)}</div></div>
      </div>
      <div class="stub-perf"></div>
      <div class="stub-bottom">
        <div class="pnr-block">
          <div class="k">PNR</div>
          <div class="pnr">${pnr}</div>
          <span class="status-pill ${status}">${status}</span>
        </div>
        <div class="fare-block">
          <div class="k">Fare paid</div>
          <div class="amount">${formatMoney(totalFare, currency)}</div>
        </div>
      </div>
    </div>

    <div style="margin-top:20px; display:flex; gap:10px;">
      ${status === 'confirmed'
        ? `<button class="btn-danger" id="cancelBtn">Cancel this ticket</button>`
        : `<span class="hint">This ticket was cancelled and the seat has been released.</span>`}
    </div>
  `;

  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', async () => {
      if (!confirm(`Cancel ticket ${pnr}? This can't be undone.`)) return;
      cancelBtn.disabled = true;
      cancelBtn.textContent = 'Cancelling…';
      try {
        const updated = await api.cancelTicket(pnr);
        showToast('Ticket cancelled. Seat released.');
        renderTicket(updated);
      } catch (err) {
        showToast(err.message, true);
        cancelBtn.disabled = false;
        cancelBtn.textContent = 'Cancel this ticket';
      }
    });
  }
}

async function lookup(pnr) {
  ticketArea.innerHTML = `<div class="empty-state">Looking up ${pnr}…</div>`;
  try {
    const ticket = await api.getTicket(pnr);
    renderTicket(ticket);
  } catch (err) {
    ticketArea.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

lookupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const pnr = pnrInput.value.trim().toUpperCase();
  if (!pnr) return;
  lookup(pnr);
});

const initialPnr = getQueryParam('pnr');
if (initialPnr) {
  pnrInput.value = initialPnr;
  lookup(initialPnr);
} else {
  ticketArea.innerHTML = `<div class="empty-state">Enter a PNR above to view a ticket.</div>`;
}