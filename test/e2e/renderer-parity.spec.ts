import { expect, test } from "@playwright/test";
import {
  getDominoBounds,
  getRectCenter,
  getRotationSize,
  HALF_HEIGHT,
  HALF_WIDTH,
  rotateClockwise,
  SNAP_GAP,
} from "../../src/core/geometry";
import type { Domino, Point } from "../../src/core/types";

const modes = [
  { name: "svg", renderer: "svg" },
  { name: "dom", renderer: "dom" },
] as const;

for (const mode of modes) {
  test(`${mode.name} rotates a domino through the shared workflow`, async ({ page }) => {
    await page.goto(`/domino/?fixture=basic&renderer=${mode.renderer}`);
    await page.waitForFunction(() => typeof window.__DOMINO_TEST__?.rotate === "function");
    const stateBefore = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    const cat = stateBefore.dominoes.find((domino) => domino.id === "cat");
    expect(cat).toBeDefined();
    const clickPoint = { x: cat!.x + 25, y: cat!.y + 75 };
    await page.evaluate((pivot) => {
      window.__DOMINO_TEST__.rotate("cat", pivot);
    }, clickPoint);

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.dominoes.find((domino) => domino.id === "cat")).toEqual(
      rotateAroundPivot(cat!, clickPoint),
    );
  });

  test(`${mode.name} rotates a linked group through the shared workflow`, async ({ page }) => {
    await page.goto(`/domino/?fixture=linked&renderer=${mode.renderer}`);
    await page.waitForFunction(() => typeof window.__DOMINO_TEST__?.rotate === "function");
    const stateBefore = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    const dragged = stateBefore.dominoes.find((domino) => domino.id === "dragged");
    const target = stateBefore.dominoes.find((domino) => domino.id === "target");
    expect(dragged).toBeDefined();
    expect(target).toBeDefined();
    const clickPoint = { x: dragged!.x + 25, y: dragged!.y + 75 };
    await page.evaluate((pivot) => {
      window.__DOMINO_TEST__.rotate("dragged", pivot);
    }, clickPoint);

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.dominoes.find((domino) => domino.id === "dragged")).toEqual(
      rotateAroundPivot(dragged!, clickPoint),
    );
    expect(state.dominoes.find((domino) => domino.id === "target")).toEqual(
      rotateAroundPivot(target!, clickPoint),
    );
    expect(state.links).toEqual([
      { dominoId1: "dragged", half1: "a", dominoId2: "target", half2: "a" },
    ]);
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
      y: target!.y + HALF_WIDTH / 2,
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

function rotateAroundPivot(dominoToRotate: Domino, pivot: Point): Domino {
  const center = getRectCenter(getDominoBounds(dominoToRotate));
  const nextRotation = rotateClockwise(dominoToRotate.rotation);
  const nextSize = getRotationSize(nextRotation);
  const nextCenter = {
    x: pivot.x - (center.y - pivot.y),
    y: pivot.y + (center.x - pivot.x),
  };

  return {
    ...dominoToRotate,
    x: nextCenter.x - nextSize.width / 2,
    y: nextCenter.y - nextSize.height / 2,
    rotation: nextRotation,
  };
}
