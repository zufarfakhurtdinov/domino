import { expect, type Page, test } from "@playwright/test";
import {
  getDominoBounds,
  getRectCenter,
  getRotationSize,
  getTransformOrigin,
  HALF_HEIGHT,
  HALF_WIDTH,
  rotateClockwise,
  SNAP_GAP,
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

test("touch tap rotates an unlinked domino", async ({ page }) => {
  await openBoard(page);
  const appBox = await getAppBox(page);
  const stateBefore = await page.evaluate(() =>
    window.__DOMINO_TEST__.getState(),
  );
  const domino = getDomino(stateBefore, defaultDragDominoId);
  const localTapPoint = { x: 25, y: 75 };
  const tapPoint = { x: domino.x + localTapPoint.x, y: domino.y + localTapPoint.y };

  await touchTap(
    page,
    `[data-domino-id='${defaultDragDominoId}']`,
    toClientPoint(appBox, tapPoint),
  );

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.find((entry) => entry.id === defaultDragDominoId)).toEqual(
    rotateAroundPivot(domino, tapPoint),
  );
});

test("touch tap rotates a linked group", async ({ page }) => {
  await openBoard(page);
  await linkDefaultFivePair(page);
  const appBox = await getAppBox(page);
  const stateBefore = await page.evaluate(() =>
    window.__DOMINO_TEST__.getState(),
  );
  const dragged = getDomino(stateBefore, defaultLinkedDragDominoId);
  const target = getDomino(stateBefore, defaultLinkedTargetDominoId);
  const localTapPoint = { x: 25, y: 75 };
  const tapPoint = {
    x: dragged.x + localTapPoint.x,
    y: dragged.y + localTapPoint.y,
  };

  await touchTap(
    page,
    `[data-domino-id='${defaultLinkedDragDominoId}']`,
    toClientPoint(appBox, tapPoint),
  );

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.find((domino) => domino.id === defaultLinkedDragDominoId)).toEqual(
    rotateAroundPivot(dragged, tapPoint),
  );
  expect(state.dominoes.find((domino) => domino.id === defaultLinkedTargetDominoId)).toEqual(
    rotateAroundPivot(target, tapPoint),
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

test("touch drag moves without rotating", async ({ page }) => {
  await openBoard(page);
  const appBox = await getAppBox(page);
  const stateBefore = await page.evaluate(() =>
    window.__DOMINO_TEST__.getState(),
  );
  const domino = getDomino(stateBefore, defaultDragDominoId);
  const start = { x: domino.x + HALF_WIDTH / 2, y: domino.y + HALF_HEIGHT / 2 };
  const end = { x: start.x + dragDelta.x, y: start.y + dragDelta.y };

  await touchDrag(
    page,
    `[data-domino-id='${defaultDragDominoId}']`,
    ".board-dom",
    toClientPoint(appBox, start),
    toClientPoint(appBox, end),
  );

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.find((entry) => entry.id === defaultDragDominoId)).toMatchObject({
    x: domino.x + dragDelta.x,
    y: domino.y + dragDelta.y,
    rotation: domino.rotation,
  });
});

test("touch drag shows snap preview", async ({ page }) => {
  await openBoard(page);
  const appBox = await getAppBox(page);
  const stateBefore = await page.evaluate(() =>
    window.__DOMINO_TEST__.getState(),
  );
  const dragged = getDomino(stateBefore, defaultLinkedDragDominoId);
  const snappedPosition = getDefaultFiveSnapPosition(stateBefore);
  const snappedTransform = getTransformOrigin({
    ...dragged,
    ...snappedPosition,
  });
  const transform = getTransformOrigin(dragged);
  const start = {
    x: transform.x + HALF_WIDTH / 2,
    y: transform.y + HALF_HEIGHT / 2,
  };
  const end = {
    x: snappedTransform.x + 6 + HALF_WIDTH / 2,
    y: snappedTransform.y + 4 + HALF_HEIGHT / 2,
  };

  await touchDown(
    page,
    `[data-domino-id='${defaultLinkedDragDominoId}']`,
    toClientPoint(appBox, start),
  );
  await touchMove(page, ".board-dom", toClientPoint(appBox, end));

  expect(
    await page.evaluate(() => window.__DOMINO_TEST__.getSnapCandidate()),
  ).not.toBeNull();
  await expect(page.locator(".snap-highlight")).toBeVisible();

  await touchUp(page, toClientPoint(appBox, end));
});

test("touch drop commits snap", async ({ page }) => {
  await openBoard(page);
  const appBox = await getAppBox(page);
  const stateBefore = await page.evaluate(() =>
    window.__DOMINO_TEST__.getState(),
  );
  const dragged = getDomino(stateBefore, defaultLinkedDragDominoId);
  const snappedPosition = getDefaultFiveSnapPosition(stateBefore);
  const snappedTransform = getTransformOrigin({
    ...dragged,
    ...snappedPosition,
  });
  const transform = getTransformOrigin(dragged);
  const start = {
    x: transform.x + HALF_WIDTH / 2,
    y: transform.y + HALF_HEIGHT / 2,
  };
  const end = {
    x: snappedTransform.x + 6 + HALF_WIDTH / 2,
    y: snappedTransform.y + 4 + HALF_HEIGHT / 2,
  };

  await touchDrag(
    page,
    `[data-domino-id='${defaultLinkedDragDominoId}']`,
    ".board-dom",
    toClientPoint(appBox, start),
    toClientPoint(appBox, end),
  );

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(
    state.dominoes.find((domino) => domino.id === defaultLinkedDragDominoId),
  ).toMatchObject(snappedPosition);
  expect(state.links).toEqual([
    {
      dominoId1: defaultLinkedDragDominoId,
      half1: "b",
      dominoId2: defaultLinkedTargetDominoId,
      half2: "b",
    },
  ]);
});

test("tiny touch movement currently counts as drag", async ({ page }) => {
  await openBoard(page);
  const appBox = await getAppBox(page);
  const stateBefore = await page.evaluate(() =>
    window.__DOMINO_TEST__.getState(),
  );
  const domino = getDomino(stateBefore, defaultDragDominoId);
  const start = { x: domino.x + HALF_WIDTH / 2, y: domino.y + HALF_HEIGHT / 2 };
  const end = { x: start.x + 1, y: start.y + 1 };

  await touchDrag(
    page,
    `[data-domino-id='${defaultDragDominoId}']`,
    ".board-dom",
    toClientPoint(appBox, start),
    toClientPoint(appBox, end),
  );

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.find((entry) => entry.id === defaultDragDominoId)).toMatchObject({
    x: domino.x + 1,
    y: domino.y + 1,
    rotation: domino.rotation,
  });
});

async function getAppBox(page: Page) {
  const appBox = await page.locator("#app").boundingBox();
  expect(appBox).not.toBeNull();
  return appBox!;
}

function toClientPoint(
  appBox: { x: number; y: number },
  boardPoint: Point,
): Point {
  return {
    x: appBox.x + boardPoint.x,
    y: appBox.y + boardPoint.y,
  };
}

async function touchTap(
  page: Page,
  selector: string,
  point: Point,
): Promise<void> {
  await touchDown(page, selector, point);
  await touchUp(page, point);
}

async function touchDrag(
  page: Page,
  targetSelector: string,
  boardSelector: string,
  start: Point,
  end: Point,
): Promise<void> {
  await touchDown(page, targetSelector, start);
  await touchMove(page, boardSelector, end);
  await touchUp(page, end);
}

async function touchDown(
  page: Page,
  selector: string,
  point: Point,
): Promise<void> {
  await dispatchTouchPointer(page, selector, "pointerdown", point, 1);
}

async function touchMove(
  page: Page,
  selector: string,
  point: Point,
): Promise<void> {
  await dispatchTouchPointer(page, selector, "pointermove", point, 1);
}

async function touchUp(page: Page, point: Point): Promise<void> {
  await page.evaluate(
    (eventInit) => {
      window.dispatchEvent(new PointerEvent("pointerup", eventInit));
    },
    touchPointerEventInit(point, 0),
  );
}

async function dispatchTouchPointer(
  page: Page,
  selector: string,
  type: "pointerdown" | "pointermove",
  point: Point,
  buttons: number,
): Promise<void> {
  await page
    .locator(selector)
    .dispatchEvent(type, touchPointerEventInit(point, buttons));
}

function touchPointerEventInit(
  point: Point,
  buttons: number,
): PointerEventInit {
  return {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    pointerType: "touch",
    isPrimary: true,
    button: 0,
    buttons,
    clientX: point.x,
    clientY: point.y,
  };
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
