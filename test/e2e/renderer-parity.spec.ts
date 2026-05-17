import { expect, test } from "@playwright/test";
import { HALF_HEIGHT, HALF_WIDTH, SNAP_GAP } from "../../src/core/geometry";

const modes = [
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
    const stateBefore = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    const cat = stateBefore.dominoes.find((domino) => domino.id === "cat");
    expect(cat).toBeDefined();
    const dragPosition = { x: cat!.x + HALF_WIDTH, y: cat!.y + HALF_HEIGHT };
    await page.evaluate((position) => {
      window.__DOMINO_TEST__.drop("cat", { ...position, rotation: 0 });
    }, dragPosition);

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.dominoes.find((domino) => domino.id === "cat")).toMatchObject(dragPosition);
  });

  test(`${mode.name} snaps a domino through the shared workflow`, async ({ page }) => {
    await page.goto(`/domino/?fixture=snap&renderer=${mode.renderer}`);
    await page.waitForFunction(() => typeof window.__DOMINO_TEST__?.drop === "function");
    const stateBefore = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    const target = stateBefore.dominoes.find((domino) => domino.id === "target");
    expect(target).toBeDefined();
    const snappedPosition = {
      x: target!.x + HALF_HEIGHT + SNAP_GAP,
      y: target!.y,
    };
    await page.evaluate((position) => {
      window.__DOMINO_TEST__.drop("dragged", {
        x: position.x + 6,
        y: position.y + 4,
        rotation: 0,
      });
    }, snappedPosition);

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.dominoes.find((domino) => domino.id === "dragged")).toMatchObject(snappedPosition);
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
