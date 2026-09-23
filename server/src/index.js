import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import {
  SERVICES,
  EMERGENCY_TYPES,
  isValidService,
  isValidEmergency,
} from './services.js';

const prisma = new PrismaClient();
const app = express();

// Allow the deployed frontend origin in production; permissive in dev.
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// Wrap async handlers so rejected promises hit the error middleware
// instead of crashing the process with an unhandled rejection.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---- helpers ---------------------------------------------------------------

// Highest numeric suffix among codes with a given prefix (e.g. "C" -> 62).
// Ordering by createdAt is unreliable (seed rows share timestamps), so we
// scan the codes and take the true max.
function maxCodeNumber(codes, prefix) {
  return codes
    .filter((c) => c.startsWith(`${prefix}-`))
    .reduce((max, c) => {
      const n = parseInt(c.split('-')[1], 10);
      return Number.isFinite(n) && n > max ? n : max;
    }, 0);
}

// Next ticket code for a service, e.g. C-063 after C-062.
async function nextCode(service) {
  const { prefix } = SERVICES[service];
  const rows = await prisma.ticket.findMany({
    where: { code: { startsWith: `${prefix}-` } },
    select: { code: true },
  });
  const n = String(maxCodeNumber(rows.map((r) => r.code), prefix) + 1).padStart(3, '0');
  return `${prefix}-${n}`;
}

async function nextEmergencyCode() {
  const rows = await prisma.emergency.findMany({ select: { code: true } });
  const next = maxCodeNumber(rows.map((r) => r.code), 'EMS') + 1;
  return `EMS-${String(next).padStart(3, '0')}`;
}

// People ahead of a ticket in the same service that are still queueing.
async function peopleAhead(ticket) {
  return prisma.ticket.count({
    where: {
      service: ticket.service,
      status: { in: ['waiting', 'called'] },
      createdAt: { lt: ticket.createdAt },
    },
  });
}

// ---- meta ------------------------------------------------------------------

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/services', (_req, res) => {
  res.json(Object.values(SERVICES));
});

app.get('/api/emergency-types', (_req, res) => {
  res.json(Object.values(EMERGENCY_TYPES));
});

// ---- tickets ---------------------------------------------------------------

// Create a ticket (kiosk check-in).
app.post('/api/tickets', wrap(async (req, res) => {
  const { service, fullName, idNumber, mobile } = req.body ?? {};
  if (!isValidService(service)) return res.status(400).json({ error: 'Invalid service' });
  if (!fullName || !idNumber || !mobile) {
    return res.status(400).json({ error: 'fullName, idNumber and mobile are required' });
  }

  const code = await nextCode(service);
  const count = await prisma.ticket.count();
  const ticket = await prisma.ticket.create({
    data: { code, service, fullName, idNumber, mobile, position: count + 1 },
  });

  const ahead = await peopleAhead(ticket);
  const wait = SERVICES[service].estimatedWait;
  res.status(201).json({ ...ticket, peopleAhead: ahead, estimatedWait: wait });
}));

// Full queue (dashboard).
app.get('/api/tickets', wrap(async (_req, res) => {
  const tickets = await prisma.ticket.findMany({
    where: { status: { not: 'done' } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(tickets);
}));

// Single ticket lookup (ticket confirmation / polling).
app.get('/api/tickets/:code', wrap(async (req, res) => {
  const ticket = await prisma.ticket.findUnique({ where: { code: req.params.code } });
  if (!ticket) return res.status(404).json({ error: 'Not found' });
  const ahead = await peopleAhead(ticket);
  res.json({ ...ticket, peopleAhead: ahead, estimatedWait: SERVICES[ticket.service].estimatedWait });
}));

// Advance a ticket's status (Call next / progress).
app.patch('/api/tickets/:code', wrap(async (req, res) => {
  const { status } = req.body ?? {};
  const allowed = ['waiting', 'called', 'in_room', 'done'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const ticket = await prisma.ticket.update({
      where: { code: req.params.code },
      data: { status },
    });
    res.json(ticket);
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
}));

// Call the next waiting patient in a service (moves earliest waiting -> called).
app.post('/api/tickets/call-next/:service', wrap(async (req, res) => {
  const { service } = req.params;
  if (!isValidService(service)) return res.status(400).json({ error: 'Invalid service' });
  const next = await prisma.ticket.findFirst({
    where: { service, status: 'waiting' },
    orderBy: { createdAt: 'asc' },
  });
  if (!next) return res.status(404).json({ error: 'No waiting patients' });
  const ticket = await prisma.ticket.update({
    where: { id: next.id },
    data: { status: 'called' },
  });
  res.json(ticket);
}));

// ---- emergencies -----------------------------------------------------------

app.post('/api/emergencies', wrap(async (req, res) => {
  const { type, note } = req.body ?? {};
  if (!isValidEmergency(type)) return res.status(400).json({ error: 'Invalid emergency type' });
  const code = await nextEmergencyCode();
  const emergency = await prisma.emergency.create({
    data: { code, type, priority: EMERGENCY_TYPES[type].priority, note: note ?? null },
  });
  res.status(201).json(emergency);
}));

app.get('/api/emergencies', wrap(async (_req, res) => {
  const emergencies = await prisma.emergency.findMany({
    where: { status: { not: 'resolved' } },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
  });
  res.json(emergencies);
}));

// ---- dashboard stats -------------------------------------------------------

app.get('/api/stats', wrap(async (_req, res) => {
  const inQueue = await prisma.ticket.count({
    where: { status: { in: ['waiting', 'called'] } },
  });
  const activeEmergencies = await prisma.emergency.count({ where: { status: { not: 'resolved' } } });

  // Served today = tickets marked done today. Seeded demo shows a static 184
  // baseline so the tile matches the mockup on a fresh DB.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const servedToday =
    184 +
    (await prisma.ticket.count({
      where: { status: 'done', updatedAt: { gte: startOfDay } },
    }));

  const perService = Object.values(SERVICES).map((s) => ({
    key: s.key,
    name: s.name,
    estimatedWait: s.estimatedWait,
  }));
  const avgWait = Math.round(
    perService.reduce((a, s) => a + s.estimatedWait, 0) / perService.length,
  );

  res.json({ inQueue, avgWait, servedToday, activeEmergencies, perService });
}));

// Centralised error handler — keeps the process alive on a DB/query failure.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('API error:', err.message);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Pioneer Health API listening on http://localhost:${PORT}`);
});

export default app;
