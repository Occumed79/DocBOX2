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

test('capture reference experience worlds for visual QA', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Visual capture runs once on desktop.');

  await page.goto('/experience');
  await page.setViewportSize({ width: 1440, height: 1000 });

  const origin = page.locator('#origin');
  await expect(origin).toBeVisible();
  await origin.screenshot({ path: testInfo.outputPath('01-origin.png') });

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

  const network = page.getByRole('region', { name: 'Occu-Med global network explorer' });
  await network.scrollIntoViewIfNeeded();
  await network.getByRole('button', { name: 'services', exact: true }).click();
  await page.waitForTimeout(250);
  await network.screenshot({ path: testInfo.outputPath('07-network-explorer.png') });

  const values = page.getByRole('region', { name: 'Occu-Med values interaction playground' });
  await values.scrollIntoViewIfNeeded();
  await values.getByRole('button', { name: /Quality$/ }).click();
  await page.waitForTimeout(250);
  await values.screenshot({ path: testInfo.outputPath('08-values-quality.png') });

  const gateway = page.locator('#partner-gateway');
  await gateway.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await gateway.screenshot({ path: testInfo.outputPath('09-partner-gateway.png') });

  const provider = page.locator('#provider-details');
  await provider.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await provider.screenshot({ path: testInfo.outputPath('10-provider-onboarding.png') });
});
