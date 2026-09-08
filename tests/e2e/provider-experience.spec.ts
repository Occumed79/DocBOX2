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
    await page.getByRole('button', { name: /Dental/i }).click();
    await expect(page.getByRole('heading', { name: 'Dental' })).toBeVisible();

    await page.getByRole('link', { name: /Service agreement/i }).click();
    await expect(page.getByText('Provider Fee Proposal').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('has no horizontal overflow on the complete experience', async ({ page }) => {
    await page.goto('/experience');
    const agreement = page.locator('#agreement');
    await agreement.scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
});
