import { PrismaClient } from '@prisma/client';
import { SERVICES } from '../src/services.js';

const prisma = new PrismaClient();

// Seed reproduces the mockup dashboard state:
// waiting patients (C-061 Thandi, M-024 Sipho, R-018 Lerato, V-009 Johan,
// C-062 Naledi, M-025 Ayanda) + one active stroke emergency (EMS-042).
const seedTickets = [
  { code: 'C-061', service: 'consultation', fullName: 'Thandi M.', status: 'waiting', priority: 'medium', minsAgo: 4 },
  { code: 'M-024', service: 'medication', fullName: 'Sipho D.', status: 'called', priority: 'low', minsAgo: 7 },
  { code: 'R-018', service: 'records', fullName: 'Lerato K.', status: 'waiting', priority: 'low', minsAgo: 9 },
  { code: 'V-009', service: 'virtual', fullName: 'Johan P.', status: 'in_room', priority: 'medium', minsAgo: 2 },
  { code: 'C-062', service: 'consultation', fullName: 'Naledi S.', status: 'waiting', priority: 'critical', minsAgo: 12 },
  { code: 'M-025', service: 'medication', fullName: 'Ayanda Z.', status: 'waiting', priority: 'medium', minsAgo: 1 },
];

async function main() {
  await prisma.emergency.deleteMany();
  await prisma.ticket.deleteMany();

  let pos = 1;
  for (const t of seedTickets) {
    await prisma.ticket.create({
      data: {
        code: t.code,
        service: t.service,
        fullName: t.fullName,
        idNumber: '—',
        mobile: '—',
        status: t.status,
        priority: t.priority,
        position: pos++,
        createdAt: new Date(Date.now() - t.minsAgo * 60_000),
      },
    });
  }

  await prisma.emergency.create({
    data: {
      code: 'EMS-042',
      type: 'stroke',
      priority: 1,
      status: 'dispatched',
      note: 'EMS-042 dispatched from kiosk · ETA 11 min · Trauma bay 2 prepared',
      dispatchStatus: 'en_route',
      paramedic: 'Naidoo',
      unit: 'EMS-A3',
      etaMinutes: 11,
      destinationBay: 2,
      createdAt: new Date(Date.now() - 3 * 60_000),
    },
  });

  // A fresh, unassigned call so a paramedic can demo "Accept & respond".
  await prisma.emergency.create({
    data: {
      code: 'EMS-043',
      type: 'cardiac',
      priority: 1,
      status: 'active',
      note: 'Mobile SOS · chest pain · GPS + health passport attached',
      origin: 'mobile',
      dispatchStatus: 'unassigned',
      createdAt: new Date(Date.now() - 1 * 60_000),
    },
  });

  const services = Object.keys(SERVICES).length;
  console.log(`Seeded ${seedTickets.length} tickets across ${services} services + 2 emergencies.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
