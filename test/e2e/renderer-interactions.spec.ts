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
import {
  defaultDragDominoId,
  defaultLinkedDragDominoId,
  defaultLinkedTargetDominoId,
  getDefaultFiveSnapPosition,
  getDomino,
  linkDefaultFivePair,
  openBoard,
} from "./boards";

const dragDelta = { x: 40, y: 40 };

test("rotates an unlinked domino when the domino is clicked", async ({ page }) => {
  await openBoard(page);
  const stateBefore = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  const domino = getDomino(stateBefore, defaultDragDominoId);
  const localClickPoint = { x: 25, y: 75 };
  const clickPoint = {
    x: domino.x + localClickPoint.x,
    y: domino.y + localClickPoint.y,
  };

  await page.locator(`[data-domino-id='${defaultDragDominoId}']`).click({ position: localClickPoint });

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.find((entry) => entry.id === defaultDragDominoId)).toEqual(
    rotateAroundPivot(domino, clickPoint),
  );
});

test("rotates a linked group when one of its dominoes is clicked", async ({ page }) => {
  await openBoard(page);
  await linkDefaultFivePair(page);
  const stateBefore = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  const dragged = getDomino(stateBefore, defaultLinkedDragDominoId);
  const target = getDomino(stateBefore, defaultLinkedTargetDominoId);
  const localClickPoint = { x: 25, y: 75 };
  const clickPoint = {
    x: dragged.x + localClickPoint.x,
    y: dragged.y + localClickPoint.y,
  };

  await page.locator(`[data-domino-id='${defaultLinkedDragDominoId}']`).click({ position: localClickPoint });

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.find((domino) => domino.id === defaultLinkedDragDominoId)).toEqual(
    rotateAroundPivot(dragged, clickPoint),
  );
  expect(state.dominoes.find((domino) => domino.id === defaultLinkedTargetDominoId)).toEqual(
    rotateAroundPivot(target, clickPoint),
  );
  expect(state.links).toEqual([
    {
      dominoId1: defaultLinkedDragDominoId,
      half1: "b",
      dominoId2: defaultLinkedTargetDominoId,
      half2: "b",
    },
  ]);
});

test("does not render rotate controls", async ({ page }) => {
  await openBoard(page);

  await expect(page.locator("[data-role='rotate-control']")).toHaveCount(0);
});

test("handles real drag gestures", async ({ page }) => {
  await openBoard(page);

  const appBox = await page.locator("#app").boundingBox();
  expect(appBox).not.toBeNull();
  const stateBefore = await page.evaluate(() =>
    window.__DOMINO_TEST__.getState(),
  );
  const domino = getDomino(stateBefore, defaultDragDominoId);

  await page.mouse.move(
    appBox!.x + domino.x + HALF_WIDTH / 2,
    appBox!.y + domino.y + HALF_HEIGHT / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    appBox!.x + domino.x + dragDelta.x + HALF_WIDTH / 2,
    appBox!.y + domino.y + dragDelta.y + HALF_HEIGHT / 2,
    { steps: 8 },
  );
  await page.mouse.up();

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.find((entry) => entry.id === defaultDragDominoId)).toMatchObject({
    x: domino.x + dragDelta.x,
    y: domino.y + dragDelta.y,
    rotation: domino.rotation,
  });
});

test("handles real detach clicks", async ({ page }) => {
  await openBoard(page);
  await linkDefaultFivePair(page);

  await page.locator("[data-role='detach-control']").click();

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.links).toEqual([]);
});

test("dom snap highlight is inset inside the final rotated drop position", async ({ page }) => {
  await openBoard(page);

  const stateBefore = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  const dragged = getDomino(stateBefore, defaultLinkedDragDominoId);
  const candidate = findSnapCandidate(
    {
      ...stateBefore,
      dominoes: stateBefore.dominoes.map((domino) =>
        domino.id === defaultLinkedDragDominoId
          ? { ...domino, ...getDefaultFiveSnapPosition(stateBefore) }
          : domino,
      ),
    },
    defaultLinkedDragDominoId,
    { threshold: 10 },
  );
  expect(candidate).not.toBeNull();

  const appBox = await page.locator("#app").boundingBox();
  const draggedBox = await page.locator(`[data-domino-id='${defaultLinkedDragDominoId}']`).boundingBox();
  expect(appBox).not.toBeNull();
  expect(draggedBox).not.toBeNull();
  const start = {
    x: draggedBox!.x + draggedBox!.width / 2,
    y: draggedBox!.y + draggedBox!.height / 2,
  };
  const transform = getTransformOrigin(dragged);
  const pointerOffset = {
    x: start.x - appBox!.x - transform.x,
    y: start.y - appBox!.y - transform.y,
  };
  const previewPosition = {
    x: candidate!.snappedPosition.x + 6,
    y: candidate!.snappedPosition.y + 4,
  };
  const previewTransform = getTransformOrigin({
    ...dragged,
    ...previewPosition,
  });

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(
    appBox!.x + previewTransform.x + pointerOffset.x,
    appBox!.y + previewTransform.y + pointerOffset.y,
    { steps: 8 },
  );

  await expect(page.locator(".snap-highlight")).toBeVisible();
  const highlightBox = await page.locator(".snap-highlight").boundingBox();
  expect(highlightBox).not.toBeNull();

  await page.mouse.up();

  const finalBox = await page
    .locator(`[data-domino-id='${defaultLinkedDragDominoId}']`)
    .boundingBox();
  expect(finalBox).not.toBeNull();
  expect(highlightBox!.x - finalBox!.x).toBeCloseTo(4, 0);
  expect(highlightBox!.y - finalBox!.y).toBeCloseTo(4, 0);
  expect(
    finalBox!.x + finalBox!.width - (highlightBox!.x + highlightBox!.width),
  ).toBeCloseTo(4, 0);
  expect(
    finalBox!.y + finalBox!.height - (highlightBox!.y + highlightBox!.height),
  ).toBeCloseTo(4, 0);
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
