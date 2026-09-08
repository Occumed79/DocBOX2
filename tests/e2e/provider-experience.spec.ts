import { expect, test } from '@playwright/test';

test.describe('provider journey', () => {
  test('moves from the cinematic story into five explorable portals', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/experience');

    await expect(page.getByRole('heading', { name: /Before the network/i })).toBeVisible();
    await expect(page.locator('[data-scene]')).toHaveCount(12);

    const arrival = page.getByRole('heading', { name: /Your facility can become/i });
    await arrival.scrollIntoViewIfNeeded();
    await expect(arrival).toBeVisible();
    await expect(page.getByRole('link', { name: /Company history/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Explore the network/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Provider resources/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Provider Q&A/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Service agreement/i })).toBeVisible();

    await page.getByRole('link', { name: /Provider resources/i }).click();
    await expect(page).toHaveURL(/\/experience\/resources$/);
    await page.getByRole('button', { name: /Open guidance/i }).nth(1).click();
    await expect(page.getByText('ACTIVE RESOURCE PATH')).toBeVisible();

    await page.getByRole('navigation', { name: 'Provider portals' }).getByRole('link', { name: 'Agreement' }).click();
    await expect(page).toHaveURL(/\/experience\/agreement$/);
    await expect(page.getByText('Provider Fee Proposal').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('portal destinations expose real history, network, resources, and questions', async ({ page }) => {
    await page.goto('/experience/history');
    await expect(page.getByText('1976', { exact: true })).toBeVisible();
    await expect(page.getByText('TODAY', { exact: true })).toBeVisible();

    await page.goto('/experience/network');
    await expect(page.getByText('23,544', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'International' }).click();
    await expect(page.getByText('866', { exact: true })).toBeVisible();
    await expect(page.getByText('South Africa', { exact: true })).toBeVisible();

    await page.goto('/experience/questions');
    await expect(page.getByRole('button', { name: /What is Occu-Med’s role/i })).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('button', { name: /How should we invoice/i }).click();
    await expect(page.getByText(/accepted fee schedule/i)).toBeVisible();
  });

  test('serves the stateside provider guide from the resource library', async ({ request }) => {
    const response = await request.get('/api/provider-resources/stateside-guide');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toBe('application/pdf');
    expect((await response.body()).byteLength).toBeGreaterThan(1000);
  });

  test('has no horizontal overflow on the complete experience', async ({ page }) => {
    await page.goto('/experience');
    await page.getByRole('heading', { name: /Your facility can become/i }).scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
});
