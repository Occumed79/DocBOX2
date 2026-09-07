import { expect, test } from '@playwright/test';

test.describe('provider experience', () => {
  test('cinematic story reaches the practical onboarding flow', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto('/experience');
    await expect(page.getByRole('heading', { name: /Before the network/i })).toBeVisible();
    await expect(page.locator('[data-spatial-archive-canvas]')).toHaveCount(1);
    await expect(page.locator('[data-spatial-values-canvas]')).toHaveCount(1);

    const archive = page.locator('[data-spatial-archive]');
    await archive.scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: /The company starts/i })).toBeVisible();

    const valuesHeading = page.getByRole('heading', { name: /Six values/i });
    await valuesHeading.scrollIntoViewIfNeeded();
    await expect(valuesHeading).toBeVisible();
    await page.getByRole('button', { name: 'Integrity', exact: true }).click();
    await expect(page.locator('[data-spatial-values-canvas]')).toBeVisible();

    const provider = page.locator('#provider-details');
    await provider.scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: 'Show us what your facility does.' })).toBeVisible();
    await page.getByRole('button', { name: 'Dental', exact: true }).click();
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
    await expect(director.getByRole('button', { name: 'Method seed', exact: true })).toBeVisible();
    await director.getByRole('button', { name: 'Method seed', exact: true }).click();
    await expect(page.locator('[data-spatial-archive-canvas]')).toBeVisible();

    await director.getByRole('button', { name: 'Values' }).click();
    await director.getByRole('button', { name: 'Integrity', exact: true }).click();
    await expect(page.locator('[data-spatial-values-canvas]')).toBeVisible();
  });

  test('reduced motion removes spatial canvases without removing the story or provider flow', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/experience');

    await expect(page.getByRole('heading', { name: /Before the network/i })).toBeVisible();
    await expect(page.locator('[data-spatial-archive-canvas]')).toBeHidden();
    await expect(page.locator('[data-spatial-values-canvas]')).toBeHidden();

    const archive = page.locator('[data-spatial-archive]');
    await archive.scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: /The company starts/i })).toBeVisible();

    const provider = page.locator('#provider-details');
    await provider.scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: 'Show us what your facility does.' })).toBeVisible();
    await expect(page.getByText('Provider Fee Proposal').first()).toBeVisible();
  });
});
