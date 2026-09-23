import { chromium } from '@playwright/test';

const shots = [
  { path: '/', file: 'kiosk-home.png' },
  { path: '/service/consultation', file: 'service-checkin.png' },
  { path: '/emergency', file: 'emergency.png' },
  { path: '/dashboard', file: 'dashboard.png' },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
for (const s of shots) {
  await page.goto(`http://localhost:5173${s.path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `/tmp/${s.file}`, fullPage: true });
  console.log('shot', s.file);
}
await browser.close();
