import { expect, test } from "@playwright/test";
import { findSnapCandidate } from "../../src/core/snapping";
import {
  getDominoBounds,
  getRectCenter,
  getRotationSize,
  getTransformOrigin,
  HALF_HEIGHT,
  HALF_WIDTH,
  rotateClockwise,
} from "../../src/core/geometry";
import type { Domino, Point } from "../../src/core/types";

const modes = [
  { name: "svg", renderer: "svg" },
  { name: "dom", renderer: "dom" },
] as const;

for (const mode of modes) {
  test(`${mode.name} rotates an unlinked domino when the domino is clicked`, async ({ page }) => {
    await page.goto(`/domino/?fixture=basic&renderer=${mode.renderer}`);
    await page.waitForFunction(() => typeof window.__DOMINO_TEST__?.getState === "function");
    const stateBefore = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    const cat = stateBefore.dominoes.find((domino) => domino.id === "cat");
    expect(cat).toBeDefined();
    const localClickPoint = { x: 25, y: 75 };
    const clickPoint = { x: cat!.x + localClickPoint.x, y: cat!.y + localClickPoint.y };

    await page.locator("[data-domino-id='cat']").click({ position: localClickPoint });

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.dominoes.find((domino) => domino.id === "cat")).toEqual(
      rotateAroundPivot(cat!, clickPoint),
    );
  });

  test(`${mode.name} rotates a linked group when one of its dominoes is clicked`, async ({ page }) => {
    await page.goto(`/domino/?fixture=linked&renderer=${mode.renderer}`);
    await page.waitForFunction(() => typeof window.__DOMINO_TEST__?.getState === "function");
    const stateBefore = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    const dragged = stateBefore.dominoes.find((domino) => domino.id === "dragged");
    const target = stateBefore.dominoes.find((domino) => domino.id === "target");
    expect(dragged).toBeDefined();
    expect(target).toBeDefined();
    const localClickPoint = { x: 25, y: 75 };
    const clickPoint = { x: dragged!.x + localClickPoint.x, y: dragged!.y + localClickPoint.y };

    await page.locator("[data-domino-id='dragged']").click({ position: localClickPoint });

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

  test(`${mode.name} does not render rotate controls`, async ({ page }) => {
    await page.goto(`/domino/?fixture=basic&renderer=${mode.renderer}`);
    await page.waitForFunction(() => typeof window.__DOMINO_TEST__?.getState === "function");

    await expect(page.locator("[data-role='rotate-control']")).toHaveCount(0);
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
      rotation: cat!.rotation,
    });
  });

  test(`${mode.name} handles real detach clicks`, async ({ page }) => {
    await page.goto(`/domino/?fixture=linked&renderer=${mode.renderer}`);

    await page.locator("[data-role='detach-control']").click();

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.links).toEqual([]);
  });
}

test("dom snap highlight is inset inside the final rotated drop position", async ({ page }) => {
  await page.goto("/domino/?fixture=snap&renderer=dom");
  await page.waitForFunction(
    () =>
      typeof window.__DOMINO_TEST__?.drop === "function" &&
      typeof window.__DOMINO_TEST__?.rotate === "function",
  );
  await page.evaluate(() => {
    window.__DOMINO_TEST__.drop("target", { x: 300, y: 300, rotation: 90 });
    window.__DOMINO_TEST__.rotate("dragged");
    window.__DOMINO_TEST__.rotate("dragged");
  });

  const stateBefore = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  const dragged = stateBefore.dominoes.find((domino) => domino.id === "dragged");
  expect(dragged).toBeDefined();
  const candidate = findSnapCandidate(stateBefore, "dragged", { threshold: 10 });
  expect(candidate).not.toBeNull();

  const appBox = await page.locator("#app").boundingBox();
  const draggedBox = await page.locator("[data-domino-id='dragged']").boundingBox();
  expect(appBox).not.toBeNull();
  expect(draggedBox).not.toBeNull();
  const startLocalPoint = { x: 50, y: 50 };
  const start = {
    x: appBox!.x + getTransformOrigin(dragged!).x - startLocalPoint.x,
    y: appBox!.y + getTransformOrigin(dragged!).y - startLocalPoint.y,
  };
  const previewPosition = {
    x: candidate!.snappedPosition.x + 6,
    y: candidate!.snappedPosition.y + 4,
  };
  const previewTransform = getTransformOrigin({ ...dragged!, ...previewPosition });

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(
    appBox!.x + previewTransform.x - startLocalPoint.x,
    appBox!.y + previewTransform.y - startLocalPoint.y,
    { steps: 8 },
  );

  await expect(page.locator(".snap-highlight")).toBeVisible();
  const highlightBox = await page.locator(".snap-highlight").boundingBox();
  expect(highlightBox).not.toBeNull();

  await page.mouse.up();

  const finalBox = await page.locator("[data-domino-id='dragged']").boundingBox();
  expect(finalBox).not.toBeNull();
  expect(highlightBox!.x - finalBox!.x).toBeCloseTo(4, 0);
  expect(highlightBox!.y - finalBox!.y).toBeCloseTo(4, 0);
  expect(finalBox!.x + finalBox!.width - (highlightBox!.x + highlightBox!.width)).toBeCloseTo(4, 0);
  expect(finalBox!.y + finalBox!.height - (highlightBox!.y + highlightBox!.height)).toBeCloseTo(4, 0);
});

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
