import { expect, test } from "@playwright/test";
import { HALF_HEIGHT, HALF_WIDTH } from "../../src/core/geometry";

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
    const stateBefore = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    const cat = stateBefore.dominoes.find((domino) => domino.id === "cat");
    expect(cat).toBeDefined();

    await page.mouse.move(appBox!.x + cat!.x + HALF_WIDTH / 2, appBox!.y + cat!.y + HALF_HEIGHT / 2);
    await page.mouse.down();
    await page.mouse.move(
      appBox!.x + cat!.x + HALF_WIDTH + HALF_WIDTH / 2,
      appBox!.y + cat!.y + HALF_HEIGHT + HALF_HEIGHT / 2,
      { steps: 8 },
    );
    await page.mouse.up();

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.dominoes.find((domino) => domino.id === "cat")).toMatchObject({
      x: cat!.x + HALF_WIDTH,
      y: cat!.y + HALF_HEIGHT,
    });
  });

  test(`${mode.name} handles real detach clicks`, async ({ page }) => {
    await page.goto(`/domino/?fixture=linked&renderer=${mode.renderer}`);

    await page.locator("[data-role='detach-control']").click();

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.links).toEqual([]);
  });
}
