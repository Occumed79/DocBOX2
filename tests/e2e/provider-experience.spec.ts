import { expect, test } from '@playwright/test';

test.describe('provider journey', () => {
  test('moves from the Oryzo-style story into the Zero-style portal world', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/experience');

    await expect(page.getByRole('heading', { name: /Occupational medicine.*built around the job/i })).toBeVisible();
    await expect(page.locator('[data-story-scene]')).toHaveCount(11);
    await page.locator('#scene-clinical').scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: /Different services\. One coordinated case/i })).toBeVisible();

    const arrival = page.getByRole('heading', { name: /Where do you want to go/i });
    await arrival.scrollIntoViewIfNeeded();
    await expect(arrival).toBeVisible();
    await expect(page.getByRole('button', { name: /History/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Network/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Resources/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Provider Q&A/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Agreement/i })).toBeVisible();

    await page.getByRole('button', { name: /Resources/i }).click();
    await expect(page).toHaveURL(/\/experience\/resources$/);
    await page.getByRole('button', { name: /Dental/i }).click();
    await expect(page.getByText('ACTIVE RESOURCE PATH')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dental' })).toBeVisible();
    await page.getByRole('link', { name: /Continue to pricing proposal/i }).click();
    await expect(page).toHaveURL(/\/experience\/agreement\?specialty=Dental$/);
    await page.locator('#proposal').scrollIntoViewIfNeeded();
    await expect(page.getByText(/OCCU-MED FORMS \/ DENTAL/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Provider Fee Proposal' }).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('serves the Nasdaq history exhibition and Blue Corridors provider explorers', async ({ page }) => {
    await page.goto('/experience/history');
    await expect(page.getByText('1979', { exact: true }).first()).toBeVisible();
    await page.getByRole('button', { name: /^ENTER/i }).click();
    await expect(page.getByRole('button', { name: /1976 The research starts/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /TODAY One connected provider network/i })).toBeVisible();
    await page.getByRole('button', { name: /2016 Infrastructure spans/i }).click();
    await expect(page.getByRole('heading', { name: /Infrastructure spans more than 36 countries/i })).toBeVisible();

    await page.goto('/experience/network');
    await expect(page.getByRole('heading', { name: 'Explore' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Provider Types' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Services' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Geography' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Coverage' })).toBeVisible();
    await expect(page.getByText(/anonymized active directory records/i)).toBeVisible();
    await page.getByRole('button', { name: 'Geography' }).click();
    await expect(page.getByRole('button', { name: 'Reset map' })).toBeVisible();
    await expect(page.getByText('Provider points', { exact: true })).toBeVisible();
    await expect(page.getByText('Coverage field', { exact: true })).toBeVisible();
    await expect(page.getByText('Network routes', { exact: true })).toBeVisible();

    await page.goto('/experience/questions');
    await expect(page.getByRole('heading', { name: /Four paths through the provider relationship/i })).toBeVisible();
    await page.getByRole('button', { name: /Billing & relationship/i }).first().click();
    await page.getByRole('button', { name: /What information reaches the employer/i }).click();
    await expect(page.getByRole('heading', { name: /What information reaches the employer/i })).toBeVisible();
    await expect(page.getByText(/Confidential medical detail remains handled/i)).toBeVisible();
  });

  test('parses the anonymized workbook for the provider explorer', async ({ request }) => {
    const response = await request.get('/api/provider-network');
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    expect(payload.total).toBeGreaterThan(1000);
    expect(Array.isArray(payload.categories)).toBeTruthy();
    expect(payload.categories.length).toBeGreaterThan(0);
  });

  test('serves the stateside provider guide from the resource library', async ({ request }) => {
    const response = await request.get('/api/provider-resources/stateside-guide');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toBe('application/pdf');
    expect((await response.body()).byteLength).toBeGreaterThan(1000);
  });

  test('has no horizontal overflow on the complete experience', async ({ page }) => {
    await page.goto('/experience');
    await page.getByRole('heading', { name: /Where do you want to go/i }).scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
});
