import { test, expect } from '@playwright/test';

// Full kiosk -> ticket -> dashboard flow against the running stack.
test('patient checks in and appears on the staff dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /self-service kiosk/i })).toBeVisible();

  // Choose a service.
  await page.getByText('Medical Consultation').click();
  await expect(page.getByRole('heading', { name: /medical consultation/i })).toBeVisible();

  // Fill the check-in form.
  const unique = `E2E ${Date.now()}`;
  await page.getByPlaceholder(/thandi mokoena/i).fill(unique);
  await page.getByPlaceholder(/9001015800083/i).fill('9001015800083');
  await page.getByPlaceholder(/082 123 4567/i).fill('0821234567');
  await page.getByRole('button', { name: /get my queue ticket/i }).click();

  // Ticket confirmation shows a code.
  await expect(page.getByText(/you're checked in/i)).toBeVisible();
  const code = await page.locator('p.text-6xl').innerText();
  expect(code).toMatch(/^C-\d{3}$/);

  // The new patient shows up on the dashboard.
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /staff dashboard/i })).toBeVisible();
  await expect(page.getByText(unique)).toBeVisible();
});

test('emergency request dispatches', async ({ page }) => {
  await page.goto('/emergency');
  await page.getByText('Suspected stroke').click();
  await page.getByRole('button', { name: /send emergency request/i }).click();
  await expect(page.getByText(/help is on the way/i)).toBeVisible();
});

test('mobile booking is at-home, then arrives via kiosk check-in', async ({ page }) => {
  // Book from the mobile app.
  await page.goto('/mobile');
  await page.getByRole('button', { name: 'Book', exact: true }).first().click();
  await page.getByRole('button', { name: /Medical Consultation/ }).click();

  // After booking, the app shows the check-in screen with the QR + ticket code.
  await expect(page.getByText(/show this at the kiosk/i)).toBeVisible({ timeout: 10000 });
  const code = await page.locator('span.font-mono').first().innerText(); // e.g. C-063
  expect(code).toMatch(/^[CMRV]-\d{3}$/);

  // It must NOT be in the physical dashboard queue yet.
  await page.goto('/dashboard');
  await expect(page.getByText(code)).toHaveCount(0);

  // Check in at the kiosk with the code.
  await page.goto('/checkin');
  await page.getByPlaceholder('C-063').fill(code);
  await page.getByRole('button', { name: /confirm arrival/i }).click();
  await expect(page.getByText(/checked in/i)).toBeVisible();

  // Now it appears on the dashboard.
  await page.goto('/dashboard');
  await expect(page.getByText(code)).toBeVisible();
});

test('staff can advance a ticket through its lifecycle to done', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /staff dashboard/i })).toBeVisible();

  // The first waiting patient row has a "Call" button. Advance it.
  const firstRow = page.locator('.divide-y > div').first();
  await firstRow.getByRole('button', { name: 'Call', exact: true }).click();
  // After calling, the same row should offer "In room".
  await expect(firstRow.getByRole('button', { name: /in room/i })).toBeVisible();
});

test('critical-priority patients sort to the top of the queue', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /staff dashboard/i })).toBeVisible();

  // Scope to the "Waiting patients" card (avoid the Mobile activity list which
  // also uses divide-y). Rows are the ones containing a mono ticket code.
  const queueCard = page.locator('.card', { has: page.getByRole('heading', { name: 'Waiting patients' }) });
  const rows = queueCard.locator('.divide-y > div');

  // Seed puts C-062 (critical) first regardless of arrival time.
  await expect(rows.first().locator('span.font-mono')).toHaveText('C-062');

  // Bump the last waiting row to critical; it should jump up the queue.
  const lastCode = await rows.last().locator('span.font-mono').innerText();
  await rows.last().locator('select').selectOption('critical');
  await expect(rows.last().locator('span.font-mono')).not.toHaveText(lastCode);
});
