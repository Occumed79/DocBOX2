import { expect, test } from '@playwright/test';

test.describe('provider journey', () => {
  test('moves from the cinematic story into five explorable portals', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/experience');

    await expect(page.getByRole('heading', { name: /Before the network/i })).toBeVisible();
    await expect(page.locator('[data-cinematic-world]')).toHaveCount(1);
    await expect(page.locator('[data-scene]')).toHaveCount(12);

    const storyNavigation = page.getByRole('navigation', { name: 'Company story chapters' });
    await expect(storyNavigation).toBeVisible();
    await storyNavigation.getByRole('link', { name: /05 CLINICAL SERVICES/i }).click();
    await expect(page.locator('#story-5')).toBeInViewport();

    const arrival = page.getByRole('heading', { name: /Your facility can become/i });
    await arrival.scrollIntoViewIfNeeded();
    await expect(arrival).toBeVisible();
    const orbit = page.getByRole('navigation', { name: 'Provider portal orbit' });
    await expect(orbit).toBeVisible();
    await expect(orbit.getByRole('link', { name: /Company history/i })).toBeVisible();
    await expect(orbit.getByRole('link', { name: /Explore the network/i })).toBeVisible();
    await expect(orbit.getByRole('link', { name: /Provider resources/i })).toBeVisible();
    await expect(orbit.getByRole('link', { name: /Provider Q&A/i })).toBeVisible();
    await expect(orbit.getByRole('link', { name: /Service agreement/i })).toBeVisible();

    await orbit.getByRole('link', { name: /Provider resources/i }).click();
    await expect(page).toHaveURL(/\/experience\/resources$/);
    await expect(page.getByRole('heading', { name: /Fall into/i })).toBeVisible();
    await page.getByRole('button', { name: /Dental/i }).click();
    await expect(page.getByRole('button', { name: /Dental/i })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('link', { name: /Continue to pricing proposal/i }).click();
    await expect(page).toHaveURL(/\/experience\/agreement\?specialty=Dental$/);
    await expect(page.getByRole('heading', { name: /Define the relationship/i })).toBeVisible();
    await expect(page.getByText(/OCCU-MED FORMS \/ DENTAL/i)).toBeVisible();
    await expect(page.getByText('Provider Fee Proposal').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('history uses the spatial anniversary archive and source-corrected origin', async ({ page }) => {
    await page.goto('/experience/history');
    await expect(page.getByRole('heading', { name: /History you move through/i })).toBeVisible();
    await expect(page.getByText('1976', { exact: true })).toHaveCount(0);
    await expect(page.getByText('1979', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'History eras' })).toBeVisible();
    await page.getByRole('button', { name: '2017' }).first().click();
    await expect(page.getByText(/Infrastructure becomes global/i)).toBeVisible();
  });

  test('network exposes interactive layers and accessible aggregate detail', async ({ page }) => {
    await page.goto('/experience/network');
    await expect(page.getByRole('heading', { name: /Follow the network/i })).toBeVisible();
    await expect(page.getByText('23,544', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Dental · 3,143/i })).toBeVisible();
    await page.getByRole('button', { name: /Dental · 3,143/i }).click();
    await expect(page.getByRole('button', { name: /Dental · 3,143/i })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('South Africa', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset view' })).toBeVisible();
  });

  test('provider field guide supports lifecycle navigation, filters, and confidentiality guidance', async ({ page }) => {
    await page.goto('/experience/questions');
    await expect(page.getByRole('heading', { name: /Follow a referral/i })).toBeVisible();
    await page.getByRole('button', { name: /04 \/ RETURN/i }).click();
    await page.getByRole('button', { name: /What information reaches the employer/i }).click();
    await expect(page.getByText(/Confidential medical details/i)).toBeVisible();
    await page.getByLabel('Search provider guidance').fill('invoice');
    await expect(page.getByText(/answers shown/i)).toBeVisible();
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
