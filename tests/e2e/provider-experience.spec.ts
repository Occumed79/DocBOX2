import { expect, test } from '@playwright/test';

test.describe('provider experience', () => {
  test('reference experience reaches the practical onboarding flow', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto('/experience');
    await expect(page.getByRole('heading', { name: /Enter the system/i })).toBeVisible();

    const archive = page.getByRole('region', { name: 'Occu-Med history exhibition' });
    await archive.scrollIntoViewIfNeeded();
    await expect(archive.getByRole('heading', { name: /Walk through the research/i })).toBeVisible();
    await archive.getByRole('button', { name: 'Method', exact: true }).click();
    await expect(archive.getByText('EXAMQA', { exact: true }).first()).toBeVisible();

    const atlas = page.getByRole('region', { name: 'Occu-Med referral operations atlas' });
    await atlas.scrollIntoViewIfNeeded();
    await expect(atlas.getByRole('heading', { name: /living system/i })).toBeVisible();
    await atlas.getByRole('button', { name: 'EVIDENCE', exact: true }).click();
    await atlas.getByRole('button', { name: '07 Review', exact: true }).click();
    await expect(atlas.getByText(/Job information × medical evidence/i).first()).toBeVisible();
    await atlas.getByRole('button', { name: 'Dental readiness', exact: true }).click();

    const clinical = page.getByRole('region', { name: 'Clinical capability database' });
    await clinical.scrollIntoViewIfNeeded();
    await clinical.getByRole('button', { name: /DEN-03 Dental readiness/i }).click();
    await expect(clinical.getByText('Bitewings', { exact: true }).first()).toBeVisible();
    await clinical.getByRole('button', { name: 'PROTOCOL SCAN', exact: true }).click();

    const network = page.getByRole('region', { name: 'Occu-Med global network explorer' });
    await network.scrollIntoViewIfNeeded();
    await expect(network.getByText('15,000+', { exact: true }).first()).toBeVisible();
    await network.getByRole('button', { name: 'services', exact: true }).click();
    await network.getByRole('button', { name: 'Dental', exact: true }).click();
    await expect(network.getByText(/Dental-readiness examinations/i)).toBeVisible();

    const provider = page.locator('#provider-details');
    await provider.scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: 'Show us what your facility does.' })).toBeVisible();
    await page.getByRole('button', { name: 'Dental', exact: true }).click();
    await expect(page.getByText('Comprehensive dental evaluation')).toBeVisible();
    await expect(page.getByText('Provider Fee Proposal').first()).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(4);
    expect(errors).toEqual([]);
  });

  test('archive and operations worlds expose exploration controls', async ({ page }) => {
    await page.goto('/experience');

    const archive = page.getByRole('region', { name: 'Occu-Med history exhibition' });
    await archive.scrollIntoViewIfNeeded();
    await archive.getByRole('button', { name: 'Scale', exact: true }).click();
    await expect(archive.getByText('2006', { exact: true }).first()).toBeVisible();
    await archive.getByRole('button', { name: 'Next archive object' }).click();

    const atlas = page.getByRole('region', { name: 'Occu-Med referral operations atlas' });
    await atlas.scrollIntoViewIfNeeded();
    await atlas.getByRole('button', { name: 'Laboratory case', exact: true }).click();
    await atlas.getByRole('button', { name: '04 Exam', exact: true }).click();
    await expect(atlas.getByText('Provider', { exact: true }).first()).toBeVisible();
  });

  test('reduced motion preserves all interactive content', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/experience');

    await expect(page.getByRole('heading', { name: /Enter the system/i })).toBeVisible();
    const archive = page.getByRole('region', { name: 'Occu-Med history exhibition' });
    await archive.scrollIntoViewIfNeeded();
    await expect(archive.getByRole('heading', { name: /Walk through the research/i })).toBeVisible();

    const provider = page.locator('#provider-details');
    await provider.scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: 'Show us what your facility does.' })).toBeVisible();
    await expect(page.getByText('Provider Fee Proposal').first()).toBeVisible();
  });
});
