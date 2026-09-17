import { expect, test } from '@playwright/test';

test.only('final hub separates the astronaut base scene from the interactive portal overlay', async ({ page }) => {
  await page.goto('/experience');

  const hub = page.locator('#provider-portals');
  await hub.scrollIntoViewIfNeeded();

  await expect(hub).toHaveAttribute('data-scene-role', 'astronaut-portal-hub');
  await expect(hub.locator('[data-astronaut-base]')).toHaveCount(1);
  await expect(hub.locator('[data-central-light]')).toHaveCount(1);

  const portalOverlay = hub.locator('[data-portal-overlay]');
  await expect(portalOverlay).toHaveCount(1);
  await expect(portalOverlay.getByRole('link')).toHaveCount(5);
});
