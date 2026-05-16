import { expect, test } from "@playwright/test";

const modes = [
  { name: "konva", renderer: "konva" },
  { name: "svg", renderer: "svg" },
  { name: "dom", renderer: "dom" },
] as const;

for (const mode of modes) {
  test(`${mode.name} rotates a domino through the shared workflow`, async ({ page }) => {
    await page.goto(`/domino/?fixture=basic&renderer=${mode.renderer}`);
    await page.waitForFunction(() => typeof window.__DOMINO_TEST__?.rotate === "function");
    await page.evaluate(() => {
      window.__DOMINO_TEST__.rotate("cat");
    });

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.dominoes.find((domino) => domino.id === "cat")?.rotation).toBe(90);
  });

  test(`${mode.name} drags a domino through the shared workflow`, async ({ page }) => {
    await page.goto(`/domino/?fixture=basic&renderer=${mode.renderer}`);
    await page.waitForFunction(() => typeof window.__DOMINO_TEST__?.drop === "function");
    await page.evaluate(() => {
      window.__DOMINO_TEST__.drop("cat", { x: 164, y: 164, rotation: 0 });
    });

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.dominoes.find((domino) => domino.id === "cat")).toMatchObject({ x: 164, y: 164 });
  });

  test(`${mode.name} snaps a domino through the shared workflow`, async ({ page }) => {
    await page.goto(`/domino/?fixture=snap&renderer=${mode.renderer}`);
    await page.waitForFunction(() => typeof window.__DOMINO_TEST__?.drop === "function");
    await page.evaluate(() => {
      window.__DOMINO_TEST__.drop("dragged", { x: 170, y: 32, rotation: 0 });
    });

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.dominoes.find((domino) => domino.id === "dragged")).toMatchObject({ x: 132, y: 49 });
    expect(state.links).toEqual([
      { dominoId1: "dragged", half1: "a", dominoId2: "target", half2: "a" },
    ]);
  });

  test(`${mode.name} detaches a linked pair through the shared workflow`, async ({ page }) => {
    await page.goto(`/domino/?fixture=linked&renderer=${mode.renderer}`);
    await page.waitForFunction(() => typeof window.__DOMINO_TEST__?.detachFirstLink === "function");
    await page.evaluate(() => {
      window.__DOMINO_TEST__.detachFirstLink();
    });

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.links).toEqual([]);
  });
}
