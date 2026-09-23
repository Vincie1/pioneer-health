import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import {
  SERVICES,
  EMERGENCY_TYPES,
  MOCK_PATIENT,
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

// People ahead of a ticket in the same service that are physically present
// (arrived) and still queueing. At-home tickets don't occupy a queue slot.
async function peopleAhead(ticket) {
  return prisma.ticket.count({
    where: {
      service: ticket.service,
      arrivalStatus: 'arrived',
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

// Mocked logged-in mobile patient.
app.get('/api/patient', (_req, res) => res.json(MOCK_PATIENT));

// ---- tickets ---------------------------------------------------------------

// Create a ticket (kiosk check-in, or mobile booking from home).
app.post('/api/tickets', wrap(async (req, res) => {
  const { service, fullName, idNumber, mobile, origin } = req.body ?? {};
  if (!isValidService(service)) return res.status(400).json({ error: 'Invalid service' });
  if (!fullName || !idNumber || !mobile) {
    return res.status(400).json({ error: 'fullName, idNumber and mobile are required' });
  }

  // Kiosk check-ins are physically present; mobile bookings start at home
  // and only enter the physical queue once they scan in at the kiosk.
  const isMobile = origin === 'mobile';
  const code = await nextCode(service);
  const count = await prisma.ticket.count();
  const ticket = await prisma.ticket.create({
    data: {
      code,
      service,
      fullName,
      idNumber,
      mobile,
      origin: isMobile ? 'mobile' : 'kiosk',
      arrivalStatus: isMobile ? 'at_home' : 'arrived',
      position: count + 1,
    },
  });

  const ahead = await peopleAhead(ticket);
  const wait = SERVICES[service].estimatedWait;
  res.status(201).json({ ...ticket, peopleAhead: ahead, estimatedWait: wait });
}));

// Full queue (dashboard) — only patients who are physically present (arrived),
// sorted by triage priority (critical → medium → low), then arrival time.
const PRIORITY_RANK = { critical: 0, medium: 1, low: 2 };
app.get('/api/tickets', wrap(async (_req, res) => {
  const tickets = await prisma.ticket.findMany({
    where: { status: { not: 'done' }, arrivalStatus: 'arrived' },
    orderBy: { createdAt: 'asc' },
  });
  tickets.sort((a, b) => {
    const pa = PRIORITY_RANK[a.priority] ?? 1;
    const pb = PRIORITY_RANK[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    return new Date(a.createdAt) - new Date(b.createdAt);
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

// Update a ticket's status (lifecycle) and/or triage priority.
app.patch('/api/tickets/:code', wrap(async (req, res) => {
  const { status, priority } = req.body ?? {};
  const data = {};
  if (status !== undefined) {
    if (!['waiting', 'called', 'in_room', 'done'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    data.status = status;
  }
  if (priority !== undefined) {
    if (!['low', 'medium', 'critical'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }
    data.priority = priority;
  }
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Provide status and/or priority' });
  }
  try {
    const ticket = await prisma.ticket.update({ where: { code: req.params.code }, data });
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

// Scan-in at the kiosk: flip an at-home ticket to arrived so it enters the
// physical queue and becomes visible on the staff dashboard. This is what the
// kiosk "Check in" screen calls with the code from the patient's QR.
app.post('/api/tickets/:code/arrive', wrap(async (req, res) => {
  const ticket = await prisma.ticket.findUnique({ where: { code: req.params.code } });
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (ticket.arrivalStatus === 'arrived') {
    return res.status(200).json({ ...ticket, alreadyArrived: true });
  }
  const updated = await prisma.ticket.update({
    where: { code: req.params.code },
    data: { arrivalStatus: 'arrived', status: 'waiting' },
  });
  const ahead = await peopleAhead(updated);
  res.json({ ...updated, peopleAhead: ahead, estimatedWait: SERVICES[updated.service].estimatedWait });
}));

app.post('/api/emergencies', wrap(async (req, res) => {
  const { type, note, origin } = req.body ?? {};
  if (!isValidEmergency(type)) return res.status(400).json({ error: 'Invalid emergency type' });
  const code = await nextEmergencyCode();
  const emergency = await prisma.emergency.create({
    data: {
      code,
      type,
      priority: EMERGENCY_TYPES[type].priority,
      origin: origin === 'mobile' ? 'mobile' : 'kiosk',
      note: note ?? null,
    },
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

// Advance an emergency: active -> dispatched -> resolved.
app.patch('/api/emergencies/:code', wrap(async (req, res) => {
  const { status } = req.body ?? {};
  const allowed = ['active', 'dispatched', 'resolved'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const em = await prisma.emergency.update({
      where: { code: req.params.code },
      data: { status },
    });
    res.json(em);
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
}));

// ---- scripts (repeat prescriptions) ---------------------------------------

app.post('/api/scripts', wrap(async (req, res) => {
  const { patientName, medication } = req.body ?? {};
  if (!patientName || !medication) {
    return res.status(400).json({ error: 'patientName and medication are required' });
  }
  const script = await prisma.script.create({ data: { patientName, medication } });
  res.status(201).json(script);
}));

app.get('/api/scripts', wrap(async (req, res) => {
  const where = req.query.patient ? { patientName: String(req.query.patient) } : {};
  const scripts = await prisma.script.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(scripts);
}));

// Advance a script: requested -> ready -> collected.
app.patch('/api/scripts/:id', wrap(async (req, res) => {
  const { status } = req.body ?? {};
  const allowed = ['requested', 'ready', 'collected'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const script = await prisma.script.update({ where: { id: req.params.id }, data: { status } });
    res.json(script);
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
}));

// ---- nurse line ------------------------------------------------------------

app.post('/api/nurse-requests', wrap(async (req, res) => {
  const { patientName, reason } = req.body ?? {};
  if (!patientName) return res.status(400).json({ error: 'patientName is required' });
  const request = await prisma.nurseRequest.create({
    data: { patientName, reason: reason ?? null },
  });
  res.status(201).json(request);
}));

app.get('/api/nurse-requests', wrap(async (_req, res) => {
  const requests = await prisma.nurseRequest.findMany({
    where: { status: 'open' },
    orderBy: { createdAt: 'desc' },
  });
  res.json(requests);
}));

// Mark a nurse callback answered (removes it from the open list).
app.patch('/api/nurse-requests/:id', wrap(async (req, res) => {
  const { status } = req.body ?? {};
  const allowed = ['open', 'answered'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const r = await prisma.nurseRequest.update({ where: { id: req.params.id }, data: { status } });
    res.json(r);
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
}));

// ---- dashboard stats -------------------------------------------------------

app.get('/api/stats', wrap(async (_req, res) => {
  const inQueue = await prisma.ticket.count({
    where: { arrivalStatus: 'arrived', status: { in: ['waiting', 'called'] } },
  });
  const criticalWaiting = await prisma.ticket.count({
    where: { arrivalStatus: 'arrived', status: { in: ['waiting', 'called'] }, priority: 'critical' },
  });
  const atHome = await prisma.ticket.count({ where: { arrivalStatus: 'at_home' } });
  const activeEmergencies = await prisma.emergency.count({ where: { status: { not: 'resolved' } } });
  const openScripts = await prisma.script.count({ where: { status: 'requested' } });
  const openNurse = await prisma.nurseRequest.count({ where: { status: 'open' } });

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

  res.json({ inQueue, criticalWaiting, atHome, avgWait, servedToday, activeEmergencies, openScripts, openNurse, perService });
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
