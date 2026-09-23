# Airline, Bus & Train Ticket Booking System — Frontend

A plain HTML, CSS, and JavaScript frontend — no build step, no framework,
no npm install. It walks the rider through: **country → mode of transport
(airline / bus / train) → company → scheduled service → seat → passenger
details → ticket**, talking to the companion MongoDB-backed API for
everything.

The visual style is a station-departure-board look: a deep navy "board"
with an amber split-flap accent, monospaced numerals for times/fares/seats,
and a paper-style ticket stub (complete with a perforated tear line) for
the booking preview and final ticket.

## Requirements

- The backend from the companion project running at `http://localhost:5000`,
  **seeded** with data (`npm run seed` — see its own README). Start that
  first.
- Any way to serve static files — browsers block some `fetch()` calls from
  a bare `file://` page. The simplest option:

```bash
cd frontend
python3 -m http.server 8080
```

Then open **http://localhost:8080/index.html**.

(Any static server works — `npx serve`, VS Code's "Live Server" extension,
nginx, etc. Nothing to install or compile.)

## Project structure

```
frontend/
├── index.html          Step 1 — choose a country
├── mode.html             Step 2 — choose airline / bus / train
├── operators.html         Step 3 — choose a company
├── transports.html         Step 4 — that company's scheduled services
├── seats.html               Step 5 — seat map
├── booking.html               Step 6 — passenger details + live ticket preview
├── ticket.html                 Look up a ticket by PNR, view it, cancel it
├── admin.html                   Add/remove companies and scheduled services
├── css/
│   └── style.css                 All shared styling
└── js/
    ├── api.js                      Fetch wrapper, breadcrumb, formatting helpers
    ├── country-select.js            index.html logic
    ├── mode-select.js                mode.html logic
    ├── operators.js                   operators.html logic
    ├── transports.js                   transports.html logic
    ├── seats.js                          seats.html logic
    ├── booking.js                          booking.html logic
    ├── ticket.js                             ticket.html logic
    └── admin.js                                admin.html logic
```

## How the booking flow fits together

1. **Country** (`index.html`) — a grid of country cards (flag + name),
   loaded from `GET /api/countries`.
2. **Mode** (`mode.html?country=…`) — Airline / Bus / Train.
3. **Company** (`operators.html?country=…&mode=…`) — every real airline,
   bus company, or train operator seeded for that country and mode (e.g.
   Emirates, Green Line Paribahan, Amtrak), each showing how many
   scheduled services it has.
4. **Scheduled services** (`transports.html?operator=…`) — that company's
   timetable, filterable by route and date, with live seat availability.
5. **Seat** (`seats.html?transport_id=…`) — a seat map (3+3 for airlines,
   2+2 for bus/train); booked seats are greyed out, your pick highlights
   in amber.
6. **Passenger details** (`booking.html?...`) — a form on the left, a live
   ticket-stub preview on the right that fills in as you type. Submitting
   books the seat and redirects to the ticket page with a new PNR.
7. **Ticket** (`ticket.html?pnr=…`) — view any ticket by PNR and cancel a
   confirmed one (this releases the seat).

A breadcrumb at the top of steps 2–6 (`Country › Mode › Company › …`)
lets you jump back to any earlier step.

**Admin** (`admin.html`) is separate: pick a country and mode, then add a
new company or a new scheduled service for an existing company, or remove
either (a company can only be removed once it has no scheduled services;
a service can only be removed once it has no confirmed tickets).

## Pointing at a different backend

If your backend isn't on `localhost:5000`, change one line in `js/api.js`:

```js
const API_BASE = 'http://localhost:5000/api';
```

## Notes

- Fares are shown in each country's real currency code (BDT, INR, USD,
  GBP, EUR, JPY, AED), as set on the backend.
- There's no authentication — treat `admin.html` as a demo page rather
  than something to expose publicly as-is.
- If a country/mode combination has no companies yet, `operators.html`
  says so plainly — add one from the Admin page to fill it in.
