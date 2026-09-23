# Pioneer Health — Self-Service Kiosk (training prototype)

A lightweight health kiosk. Patients check in at the kiosk, get a queue ticket, or
raise an emergency; staff watch the queue and emergency feed live on a dashboard.

> Training exercise — modelled on the Pioneer Health Lovable prototype.

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router
- **Backend:** Express + Node.js
- **Database:** SQLite + Prisma
- **Tests:** Vitest (unit) + Playwright (e2e)

## Structure

```
training-health/
├── client/           React + Vite frontend
│   ├── src/pages/    KioskHome, ServiceCheckIn, TicketConfirmation, Emergency, Dashboard, Mobile
│   ├── src/lib/      api client + shared constants
│   └── e2e/          Playwright specs
├── server/           Express API
│   ├── src/          index.js (routes), services.js (metadata)
│   └── prisma/       schema.prisma, seed.js
└── netlify.toml      frontend deploy config
```

## Getting started

```bash
# from training-health/
npm run install:all     # installs root + server + client deps
npm run db:setup        # prisma generate + db push + seed (creates server/prisma/dev.db)
npm run dev             # runs Express (:4000) + Vite (:5173) together
```

Open http://localhost:5173 (kiosk) and http://localhost:5173/dashboard (staff).

## Routes

| Route                 | Page                                            |
| --------------------- | ----------------------------------------------- |
| `/`                   | Kiosk home — service selection + emergency CTA  |
| `/service/:service`   | Check-in form (consultation/medication/records/virtual) |
| `/ticket/:code`       | Ticket confirmation (live position, auto-polls) |
| `/emergency`          | Emergency request                               |
| `/dashboard`          | Live staff dashboard                            |
| `/mobile`             | Mobile companion (marketing view)               |

## API

| Method | Endpoint                          | Purpose                       |
| ------ | --------------------------------- | ----------------------------- |
| GET    | `/api/services`                   | Service metadata              |
| POST   | `/api/tickets`                    | Create a check-in ticket      |
| GET    | `/api/tickets`                    | Live queue                    |
| GET    | `/api/tickets/:code`              | Single ticket + position      |
| POST   | `/api/tickets/call-next/:service` | Call next waiting patient     |
| PATCH  | `/api/tickets/:code`              | Update ticket status          |
| POST   | `/api/emergencies`                | Raise an emergency            |
| GET    | `/api/emergencies`                | Active emergency feed         |
| GET    | `/api/stats`                      | Dashboard tiles               |

## Tests

```bash
npm test          # Vitest unit tests (client)
npm run test:e2e  # Playwright e2e (requires `npm run dev` running)
```

## Deploying

- **Frontend → Netlify:** `netlify.toml` builds `client/` and publishes `dist/`.
  Set `VITE_API_URL` in Netlify to your deployed backend URL.
- **Backend → Render / Railway / Fly:** deploy `server/`. Netlify cannot host the
  long-running Express + SQLite process, so the API lives on a small always-on host.
- **Local demo:** `npm run dev` runs the whole stack on one machine — best for the
  training walkthrough.
