import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';

// Seed only when the database is empty. This runs on every deploy build, so it
// must NOT wipe real data on the persistent disk — it seeds a fresh DB once and
// leaves an existing one untouched.
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.ticket.count().catch(() => 0);
  if (count > 0) {
    console.log(`DB already has ${count} tickets — skipping seed.`);
    return;
  }
  console.log('Empty DB — seeding demo data.');
  execSync('node prisma/seed.js', { stdio: 'inherit' });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
