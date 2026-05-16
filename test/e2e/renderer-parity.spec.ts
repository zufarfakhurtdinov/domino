import { expect, test } from "@playwright/test";

const modes = [
  { name: "konva", renderer: "konva" },
  { name: "svg", renderer: "svg" },
  { name: "dom", renderer: "dom" },
] as const;

for (const mode of modes) {
  test(`${mode.name} rotates a domino through the shared workflow`, async ({ page }) => {
    await page.goto(`/domino/?fixture=basic&renderer=${mode.renderer}`);

    const appBox = await page.locator("#app").boundingBox();
    expect(appBox).not.toBeNull();

    await page.mouse.click(appBox!.x + 278, appBox!.y + 50);

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.dominoes.find((domino) => domino.id === "cat")?.rotation).toBe(90);
  });

  test(`${mode.name} drags a domino through the shared workflow`, async ({ page }) => {
    await page.goto(`/domino/?fixture=basic&renderer=${mode.renderer}`);

    const appBox = await page.locator("#app").boundingBox();
    expect(appBox).not.toBeNull();

    await page.mouse.move(appBox!.x + 164, appBox!.y + 70);
    await page.mouse.down();
    await page.mouse.move(appBox!.x + 296, appBox!.y + 146, { steps: 8 });
    await page.mouse.up();

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.dominoes.find((domino) => domino.id === "cat")).toMatchObject({ x: 1, y: 1 });
  });

  test(`${mode.name} snaps a domino through the shared workflow`, async ({ page }) => {
    await page.goto(`/domino/?fixture=snap&renderer=${mode.renderer}`);

    const appBox = await page.locator("#app").boundingBox();
    expect(appBox).not.toBeNull();

    await page.mouse.move(appBox!.x + 494, appBox!.y + 70);
    await page.mouse.down();
    await page.mouse.move(appBox!.x + 250, appBox!.y + 70, { steps: 10 });
    await page.mouse.up();

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.dominoes.find((domino) => domino.id === "dragged")).toMatchObject({ x: 1, y: 0 });
    expect(state.links).toEqual([
      { dominoId1: "dragged", half1: "a", dominoId2: "target", half2: "a" },
    ]);
  });

  test(`${mode.name} detaches a linked pair through the shared workflow`, async ({ page }) => {
    await page.goto(`/domino/?fixture=linked&renderer=${mode.renderer}`);

    const appBox = await page.locator("#app").boundingBox();
    expect(appBox).not.toBeNull();

    await page.mouse.click(appBox!.x + 164, appBox!.y + 70);

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.links).toEqual([]);
  });
}
