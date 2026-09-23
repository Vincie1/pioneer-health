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
