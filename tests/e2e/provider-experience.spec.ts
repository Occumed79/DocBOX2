import { expect, test } from '@playwright/test';

test.describe('provider experience', () => {
  test('cinematic story reaches the practical onboarding flow', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto('/experience');
    await expect(page.getByRole('heading', { name: /Before the network/i })).toBeVisible();
    await expect(page.locator('[data-spatial-archive-canvas]')).toHaveCount(1);

    const archive = page.locator('[data-spatial-archive]');
    await archive.scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: /The company starts/i })).toBeVisible();

    const provider = page.locator('#provider-details');
    await provider.scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: 'Show us what your facility does.' })).toBeVisible();
    await page.getByRole('button', { name: 'Dental' }).click();
    await expect(page.getByText('Comprehensive dental evaluation')).toBeVisible();
    await expect(page.getByText('Provider Fee Proposal').first()).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    expect(errors).toEqual([]);
  });

  test('director mode exposes real scene controls', async ({ page }) => {
    await page.goto('/experience?director=1');
    const director = page.getByRole('complementary', { name: 'Experience director mode' });
    await expect(director).toBeVisible();
    await expect(director.getByText('DIRECTOR MODE')).toBeVisible();
    await director.getByRole('button', { name: 'Archive' }).click();
    await expect(page.getByRole('heading', { name: /The company starts/i })).toBeVisible();
    await expect(director.getByText('Archive', { exact: true }).first()).toBeVisible();
  });
});
