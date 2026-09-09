import { expect, test } from '@playwright/test';

test.describe('provider journey', () => {
  test('moves from the cinematic story into five explorable portals', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/experience');

    await expect(page.getByRole('heading', { name: /We start with the job/i })).toBeVisible();
    await expect(page.locator('[data-story-scene]')).toHaveCount(11);

    const storyNavigation = page.getByRole('navigation', { name: 'Company story chapters' });
    await expect(storyNavigation).toBeVisible();
    await storyNavigation.getByRole('link', { name: /05 CLINICAL SERVICES/i }).click();
    await expect(page.locator('#scene-clinical')).toBeInViewport();

    const arrival = page.getByRole('heading', { name: /Choose where you want to go/i });
    await arrival.scrollIntoViewIfNeeded();
    await expect(arrival).toBeVisible();
    await expect(page.getByRole('link', { name: /History/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Network/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Resources/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Provider Q&A/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Agreement/i })).toBeVisible();

    await page.getByRole('link', { name: /Resources/i }).click();
    await expect(page).toHaveURL(/\/experience\/resources$/);
    await page.getByRole('button', { name: /Dental/i }).click();
    await expect(page.getByText('ACTIVE RESOURCE PATH')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dental' })).toBeVisible();
    await page.getByRole('link', { name: /Continue to pricing proposal/i }).click();
    await expect(page).toHaveURL(/\/experience\/agreement\?specialty=Dental$/);
    await expect(page.getByText(/OCCU-MED FORMS \/ DENTAL/i)).toBeVisible();
    await expect(page.getByText('Provider Fee Proposal').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('portal destinations expose the Nasdaq-style history, network, resources, and questions', async ({ page }) => {
    await page.goto('/experience/history');
    await expect(page.getByText('1979', { exact: true }).first()).toBeVisible();
    await page.getByRole('button', { name: /^ENTER/i }).click();
    await expect(page.getByRole('button', { name: /1976 The research starts/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /TODAY One connected provider network/i })).toBeVisible();
    await page.getByRole('button', { name: /2016 Infrastructure spans/i }).click();
    await expect(page.getByRole('heading', { name: /Infrastructure spans more than 36 countries/i })).toBeVisible();

    await page.goto('/experience/network');
    await expect(page.getByText('23,544', { exact: true }).first()).toBeVisible();
    await page.getByRole('button', { name: 'International' }).click();
    await expect(page.getByText('866', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('South Africa', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Density/i }).click();
    await expect(page.getByRole('button', { name: /Density/i })).not.toHaveAttribute('data-active');

    await page.goto('/experience/questions');
    await page.getByRole('button', { name: /Billing & relationship/i }).click();
    await page.getByRole('button', { name: /What information reaches the employer/i }).click();
    await expect(page.getByRole('heading', { name: /What information reaches the employer/i })).toBeVisible();
    await expect(page.getByText(/confidential medical detail remains handled/i)).toBeVisible();
  });

  test('serves the stateside provider guide from the resource library', async ({ request }) => {
    const response = await request.get('/api/provider-resources/stateside-guide');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toBe('application/pdf');
    expect((await response.body()).byteLength).toBeGreaterThan(1000);
  });

  test('has no horizontal overflow on the complete experience', async ({ page }) => {
    await page.goto('/experience');
    await page.getByRole('heading', { name: /Choose where you want to go/i }).scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
});
