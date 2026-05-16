import { expect, test } from "@playwright/test";

const modes = [
  { name: "svg", renderer: "svg" },
  { name: "dom", renderer: "dom" },
] as const;

for (const mode of modes) {
  test(`${mode.name} handles real rotate clicks`, async ({ page }) => {
    await page.goto(`/domino/?fixture=basic&renderer=${mode.renderer}`);

    await page.locator("[data-role='rotate-control'][data-control-domino-id='cat']").click();

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.dominoes.find((domino) => domino.id === "cat")?.rotation).toBe(90);
  });

  test(`${mode.name} handles real drag gestures`, async ({ page }) => {
    await page.goto(`/domino/?fixture=basic&renderer=${mode.renderer}`);
    await page.waitForFunction(() => typeof window.__DOMINO_TEST__?.getState === "function");

    const appBox = await page.locator("#app").boundingBox();
    expect(appBox).not.toBeNull();

    await page.mouse.move(appBox!.x + 100, appBox!.y + 81);
    await page.mouse.down();
    await page.mouse.move(appBox!.x + 200, appBox!.y + 160, { steps: 8 });
    await page.mouse.up();

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.dominoes.find((domino) => domino.id === "cat")).toMatchObject({
      x: 132,
      y: 111,
    });
  });

  test(`${mode.name} handles real detach clicks`, async ({ page }) => {
    await page.goto(`/domino/?fixture=linked&renderer=${mode.renderer}`);

    await page.locator("[data-role='detach-control']").click();

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.links).toEqual([]);
  });
}
