import { expect, test } from '@playwright/test';

test.describe('provider experience', () => {
  test('cinematic story reaches the practical onboarding flow', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto('/experience');
    await expect(page.getByRole('heading', { name: /Better occupational exams/i })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Provider experience navigation' })).toBeVisible();

    const archive = page.locator('[data-spatial-archive]');
    await archive.scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: /The company starts/i })).toBeVisible();

    const valuesHeading = page.getByRole('heading', { name: /Six values/i });
    await valuesHeading.scrollIntoViewIfNeeded();
    await expect(valuesHeading).toBeVisible();
    await page.getByRole('button', { name: /Integrity$/ }).click();
    await expect(page.getByAltText('Integrity core value')).toBeVisible();

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

  test('navigation gives visitors a direct path through the experience', async ({ page }) => {
    await page.goto('/experience');
    const navigation = page.getByRole('navigation', { name: 'Provider experience navigation' });

    await navigation.getByRole('link', { name: 'How referrals work' }).click();
    await expect(page).toHaveURL(/#process$/);
    await expect(page.getByRole('heading', { name: /Follow one referral/i })).toBeInViewport();

    await navigation.getByRole('link', { name: 'Join the network' }).click();
    await expect(page).toHaveURL(/#provider-details$/);
    await expect(page.getByRole('heading', { name: 'Show us what your facility does.' })).toBeInViewport();
  });

  test('reduced motion removes spatial canvases without removing the story or provider flow', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/experience');

    await expect(page.getByRole('heading', { name: /Better occupational exams/i })).toBeVisible();

    const archive = page.locator('[data-spatial-archive]');
    await archive.scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: /The company starts/i })).toBeVisible();

    const provider = page.locator('#provider-details');
    await provider.scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: 'Show us what your facility does.' })).toBeVisible();
    await expect(page.getByText('Provider Fee Proposal').first()).toBeVisible();
  });
});
