import { expect, test } from '@playwright/test';

async function collectPageErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  return errors;
}

test.describe('DOCBOX2 provider experience', () => {
  test('story uses the source-authored Oryzo-style sequence and hands off to five Zero Tech portals', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/experience');

    await expect(page.getByText('OCCU-MED / EST. 1979')).toBeVisible();
    await expect(page.getByText('Built', { exact: true })).toBeVisible();
    await expect(page.getByText('Around', { exact: true })).toBeVisible();
    await expect(page.getByText('The Job.', { exact: true })).toBeVisible();
    await expect(page.locator('[data-oryzo-scene]')).toHaveCount(11);

    const firstScene = page.locator('#story-1');
    await firstScene.scrollIntoViewIfNeeded();
    await expect(firstScene.getByRole('heading', { name: 'The job changed the question.' })).toBeVisible();
    await expect(firstScene.getByText(/California-funded research/i)).toBeVisible();

    const portals = page.locator('#provider-portals');
    await portals.scrollIntoViewIfNeeded();
    const portalNav = page.getByRole('navigation', { name: 'Provider world portals' });
    await expect(portalNav).toBeVisible();
    await expect(portalNav.getByRole('link', { name: /Company history/i })).toBeVisible();
    await expect(portalNav.getByRole('link', { name: /Explore the network/i })).toBeVisible();
    await expect(portalNav.getByRole('link', { name: /Provider resources/i })).toBeVisible();
    await expect(portalNav.getByRole('link', { name: /Provider Q&A/i })).toBeVisible();
    await expect(portalNav.getByRole('link', { name: /Service agreement/i })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('history is an isolated Nasdaq-style chronology with search and story detail', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/experience/history');

    await expect(page.getByRole('navigation', { name: 'Occu-Med history timeline' })).toBeVisible();
    await expect(page.getByText('1979', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('TODAY', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.getByRole('button', { name: 'SEARCH' }).click();
    const search = page.getByRole('textbox', { name: 'Search history' });
    await expect(search).toBeVisible();
    await search.fill('federal');
    await expect(page.getByRole('button', { name: /2007.*Federal mission support opens/i })).toBeVisible();
    await page.getByRole('button', { name: 'CLOSE ×' }).click();

    await page.getByRole('button', { name: /OPEN STORY/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: 'BACK TO TIMELINE' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('network keeps the Cesium atlas dominant and reports mapped-node counts accurately', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/experience/network');

    await expect(page.getByRole('heading', { name: 'Provider network.' })).toBeVisible();
    await expect(page.getByText('23,524', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/MAPPED NODES/)).toBeVisible();
    await expect(page.getByText(/DIRECTORY RECORDS/)).toHaveCount(0);

    const dental = page.getByRole('button', { name: /Dental.*3,141/i }).first();
    await dental.click();
    await expect(dental).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(/3,141 MAPPED NODES/)).toBeVisible();

    await page.getByRole('button', { name: /02.*Geography/i }).click();
    await expect(page.getByRole('button', { name: /Europe/i })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('resources follows the Lusion hierarchy with one selected specialty and a real resource surface', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/experience/resources');

    await expect(page.getByRole('heading', { name: /Step into a new world/i })).toBeVisible();
    const dental = page.getByRole('button', { name: /Dental/i }).first();
    await dental.scrollIntoViewIfNeeded();
    await dental.click();
    await expect(dental).toHaveAttribute('aria-pressed', 'true');

    await expect(page.getByText('Documents for Dental')).toHaveCount(1);
    await expect(page.getByText('Dental Readiness Checklist')).toHaveCount(1);
    const agreement = page.getByRole('link', { name: /Enter agreement portal/i });
    await expect(agreement).toHaveAttribute('href', /specialty=Dental&from=resources/);
    expect(errors).toEqual([]);
  });

  test('provider Q&A follows the Blue Corridors rail-field-drawer structure and source-grounded answers', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/experience/questions');

    await expect(page.getByText('REFERRAL LIFECYCLE')).toBeVisible();
    await expect(page.getByText('PORTAL 04 / KNOWLEDGE FIELD')).toBeVisible();
    await expect(page.getByText('LAYERS')).toBeVisible();

    await page.getByRole('button', { name: /04.*Return/i }).click();
    const privacyQuestion = page.getByRole('button', { name: /What medical information is shared with the employer/i });
    await privacyQuestion.click();
    await expect(privacyQuestion).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(/does not share the individual’s medical information with the employer/i)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('agreement is a single cinematic handoff into the real Forms pricing workflow', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/experience/agreement?specialty=Dental');

    await expect(page.getByRole('heading', { name: /Enter the forms workspace/i })).toBeVisible();
    const enter = page.getByRole('button', { name: /ENTER PORTAL/i });
    await enter.click();
    await expect(page.getByText('Provider Fee Proposal').first()).toBeVisible({ timeout: 12_000 });
    await expect(page.getByText('Comprehensive dental evaluation')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('serves the stateside provider guide from the resource library', async ({ request }) => {
    const response = await request.get('/api/provider-resources/stateside-guide');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toBe('application/pdf');
    expect((await response.body()).byteLength).toBeGreaterThan(1000);
  });

  test('experience routes do not introduce horizontal document overflow', async ({ page }) => {
    for (const path of ['/experience','/experience/history','/experience/network','/experience/resources','/experience/questions','/experience/agreement']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} horizontal overflow`).toBeLessThanOrEqual(3);
    }
  });
});
