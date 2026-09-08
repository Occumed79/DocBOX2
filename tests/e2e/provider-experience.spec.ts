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
    await archive.getByRole('button', { name: 'All', exact: true }).click();
    await archive.getByPlaceholder(/1976, Honolulu/i).fill('Honolulu');
    await expect(archive.getByText('1979', { exact: true }).first()).toBeVisible();
    await archive.getByRole('button', { name: 'Clear archive search' }).click();

    const method = page.getByRole('region', { name: 'Research assembles into the Occu-Med method' });
    await method.scrollIntoViewIfNeeded();
    await expect(method.getByRole('heading', { name: /assembles itself/i })).toBeVisible();

    const atlas = page.getByRole('region', { name: 'Occu-Med referral operations atlas' });
    await atlas.scrollIntoViewIfNeeded();
    await expect(atlas.getByRole('heading', { name: /living system/i })).toBeVisible();
    await atlas.getByRole('button', { name: 'EVIDENCE', exact: true }).click();
    const stageRail = atlas.getByLabel('Referral stages');
    await stageRail.getByRole('button', { name: /07 Review/ }).click();
    await expect(atlas.getByText(/Job information × medical evidence/i).first()).toBeVisible();
    await atlas.getByRole('button', { name: 'Dental readiness', exact: true }).click();

    const tunnel = page.getByRole('region', { name: 'Referral case expands into clinical service objects' });
    await tunnel.scrollIntoViewIfNeeded();
    await expect(tunnel.getByRole('heading', { name: /medical world unfolds/i })).toBeVisible();

    const clinical = page.getByRole('region', { name: 'Clinical capability database' });
    await clinical.scrollIntoViewIfNeeded();
    await clinical.getByRole('button', { name: /DEN-03 Dental readiness/i }).click();
    await expect(clinical.getByText(/Bitewings/).first()).toBeVisible();
    await clinical.getByRole('button', { name: 'PROTOCOL SCAN', exact: true }).click();

    const clinicalNetwork = page.getByRole('region', { name: 'Clinical service objects become the global provider network' });
    await clinicalNetwork.scrollIntoViewIfNeeded();
    await expect(clinicalNetwork.getByRole('heading', { name: /becomes infrastructure/i })).toBeVisible();

    const network = page.getByRole('region', { name: 'Occu-Med global network explorer' });
    await network.scrollIntoViewIfNeeded();
    await expect(network.getByText('15,000+', { exact: true }).first()).toBeVisible();
    await network.getByRole('button', { name: 'services', exact: true }).click();
    await network.getByRole('button', { name: 'Dental', exact: true }).click();
    await expect(network.getByText(/Dental-readiness examinations/i)).toBeVisible();
    await network.getByRole('button', { name: 'programs', exact: true }).click();
    await network.getByRole('button', { name: 'Deployment', exact: true }).click();
    await expect(network.getByText(/Medical-readiness coordination/i)).toBeVisible();

    const networkValues = page.getByRole('region', { name: 'Global network collapses into Occu-Med operating values' });
    await networkValues.scrollIntoViewIfNeeded();
    await expect(networkValues.getByRole('heading', { name: /behavior survives it/i })).toBeVisible();

    const values = page.getByRole('region', { name: 'Occu-Med values interaction playground' });
    await values.scrollIntoViewIfNeeded();
    await values.getByRole('button', { name: /Quality$/ }).click();
    await expect(values.getByText('MOVE THE INSPECTION LENS')).toBeVisible();
    await values.getByRole('button', { name: /Diligence$/ }).click();
    await values.getByRole('button', { name: /01 REPORT/ }).click();
    await expect(values.getByText('3 REQUIRED PIECES REMAIN')).toBeVisible();

    const gateway = page.getByRole('region', { name: 'Occu-Med values converge into the provider partner gateway' });
    await gateway.scrollIntoViewIfNeeded();
    await expect(gateway.getByRole('heading', { name: /open node/i })).toBeVisible();

    const provider = page.locator('#provider-details');
    await provider.scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: 'Show us what your facility does.' })).toBeVisible();
    await page.getByRole('button', { name: 'Dental', exact: true }).click();
    await expect(page.getByText('Comprehensive dental evaluation')).toBeVisible();
    await expect(page.getByText('Provider Fee Proposal').first()).toBeVisible();

    const pricing = page.getByRole('region', { name: 'Occu-Med provider pricing proposal workflow' });
    await pricing.scrollIntoViewIfNeeded();
    await pricing.getByRole('button', { name: /Open pricing workspace/i }).click();
    await expect(pricing.getByRole('heading', { name: 'Provider Fee Proposal', exact: true }).first()).toBeVisible();
    await expect(pricing.getByLabel('Provider / Facility Name')).toBeVisible();
    await expect(pricing.getByLabel('Email')).toBeVisible();
    await expect(pricing.getByDisplayValue('Comprehensive dental evaluation').first()).toBeVisible();

    const submit = page.getByRole('region', { name: 'Submit provider pricing proposal' });
    await submit.scrollIntoViewIfNeeded();
    await expect(submit.getByRole('button', { name: /Submit pricing proposal/i })).toBeVisible();

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
    await atlas.getByLabel('Referral stages').getByRole('button', { name: /04 Exam/ }).click();
    await expect(atlas.getByText(/04 \/ Provider/)).toBeVisible();
  });

  test('reduced motion preserves all interactive content', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/experience');

    await expect(page.getByRole('heading', { name: /Enter the system/i })).toBeVisible();
    const archive = page.getByRole('region', { name: 'Occu-Med history exhibition' });
    await archive.scrollIntoViewIfNeeded();
    await expect(archive.getByRole('heading', { name: /Walk through the research/i })).toBeVisible();

    const method = page.getByRole('region', { name: 'Research assembles into the Occu-Med method' });
    await method.scrollIntoViewIfNeeded();
    await expect(method.getByRole('heading', { name: /assembles itself/i })).toBeVisible();

    const gateway = page.getByRole('region', { name: 'Occu-Med values converge into the provider partner gateway' });
    await gateway.scrollIntoViewIfNeeded();
    await expect(gateway.getByRole('heading', { name: /open node/i })).toBeVisible();

    const provider = page.locator('#provider-details');
    await provider.scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: 'Show us what your facility does.' })).toBeVisible();
    await expect(page.getByText('Provider Fee Proposal').first()).toBeVisible();
  });
});
