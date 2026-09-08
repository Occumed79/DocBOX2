import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';

async function captureStickyProgress(page: Page, region: Locator, progress: number, testInfo: TestInfo, name: string) {
  await region.scrollIntoViewIfNeeded();
  await region.evaluate((node, p) => {
    const rect = node.getBoundingClientRect();
    const top = window.scrollY + rect.top;
    const travel = Math.max(0, rect.height - window.innerHeight);
    window.scrollTo(0, top + travel * Number(p));
  }, progress);
  await page.waitForTimeout(320);
  await page.screenshot({ path: testInfo.outputPath(name) });
}

async function captureElementViewport(page: Page, region: Locator, progress: number, testInfo: TestInfo, name: string) {
  await region.scrollIntoViewIfNeeded();
  await region.evaluate((node, p) => {
    const rect = node.getBoundingClientRect();
    const top = window.scrollY + rect.top;
    const travel = Math.max(0, rect.height - window.innerHeight * .86);
    window.scrollTo(0, top + travel * Number(p));
  }, progress);
  await page.waitForTimeout(320);
  await page.screenshot({ path: testInfo.outputPath(name) });
}

test('capture reference experience worlds for visual QA', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Visual capture runs once on desktop.');
  test.setTimeout(120_000);

  await page.goto('/experience');
  await page.setViewportSize({ width: 1440, height: 1000 });

  const origin = page.locator('#origin');
  await expect(origin).toBeVisible();
  await captureStickyProgress(page, origin, .55, testInfo, '01-origin-threshold.png');

  const archive = page.getByRole('region', { name: 'Occu-Med history exhibition' });
  await archive.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await archive.screenshot({ path: testInfo.outputPath('02-archive.png') });

  const method = page.getByRole('region', { name: 'Research assembles into the Occu-Med method' });
  await captureStickyProgress(page, method, .72, testInfo, '03-method-assembler.png');

  const atlas = page.getByRole('region', { name: 'Occu-Med referral operations atlas' });
  await atlas.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await atlas.screenshot({ path: testInfo.outputPath('04-operations-atlas.png') });

  const tunnel = page.getByRole('region', { name: 'Referral case expands into clinical service objects' });
  await captureStickyProgress(page, tunnel, .68, testInfo, '05-case-tunnel.png');

  const clinical = page.getByRole('region', { name: 'Clinical capability database' });
  await clinical.scrollIntoViewIfNeeded();
  await clinical.getByRole('button', { name: /DEN-03 Dental readiness/i }).click();
  await page.waitForTimeout(250);
  await clinical.screenshot({ path: testInfo.outputPath('06-clinical-database.png') });

  const clinicalNetwork = page.getByRole('region', { name: 'Clinical service objects become the global provider network' });
  await captureStickyProgress(page, clinicalNetwork, .72, testInfo, '07-clinical-to-network.png');

  const network = page.getByRole('region', { name: 'Occu-Med global network explorer' });
  await network.scrollIntoViewIfNeeded();
  await network.getByRole('button', { name: 'services', exact: true }).click();
  await page.waitForTimeout(250);
  await network.screenshot({ path: testInfo.outputPath('08-network-explorer.png') });

  const networkValues = page.getByRole('region', { name: 'Global network collapses into Occu-Med operating values' });
  await captureStickyProgress(page, networkValues, .72, testInfo, '09-network-to-values.png');

  const values = page.getByRole('region', { name: 'Occu-Med values interaction playground' });
  await values.scrollIntoViewIfNeeded();
  await values.getByRole('button', { name: /Quality$/ }).click();
  await page.waitForTimeout(250);
  await values.screenshot({ path: testInfo.outputPath('10-values-quality.png') });

  const gateway = page.getByRole('region', { name: 'Occu-Med values converge into the provider partner gateway' });
  await captureStickyProgress(page, gateway, .42, testInfo, '11-gateway-operating-standard.png');
  await captureStickyProgress(page, gateway, .86, testInfo, '12-gateway-open-node.png');

  const provider = page.locator('#provider-details');
  await captureElementViewport(page, provider, 0, testInfo, '13-provider-entry.png');
  await captureElementViewport(page, provider, .26, testInfo, '14-provider-capabilities.png');

  const pricing = page.getByRole('region', { name: 'Occu-Med provider pricing proposal workflow' });
  await pricing.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: testInfo.outputPath('15-pricing-launch.png') });
  await pricing.getByRole('button', { name: /Open pricing workspace/i }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: testInfo.outputPath('16-pricing-workspace.png') });

  const preview = page.getByLabel('Provider Fee Proposal PDF preview');
  await preview.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await preview.screenshot({ path: testInfo.outputPath('17-fee-proposal-preview.png') });

  const submit = page.getByRole('region', { name: 'Submit provider pricing proposal' });
  await submit.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.screenshot({ path: testInfo.outputPath('18-submit-handoff.png') });
});
