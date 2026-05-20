import { expect, type Page, test } from "@playwright/test";
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
  { name: "svg", renderer: "svg", board: ".board-svg" },
  { name: "dom", renderer: "dom", board: ".board-dom" },
] as const;

for (const mode of modes) {
  test(`${mode.name} touch tap rotates an unlinked domino`, async ({ page }) => {
    await page.goto(`/domino/?fixture=basic&renderer=${mode.renderer}`);
    await page.waitForFunction(() => typeof window.__DOMINO_TEST__?.getState === "function");
    const appBox = await getAppBox(page);
    const stateBefore = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    const cat = stateBefore.dominoes.find((domino) => domino.id === "cat");
    expect(cat).toBeDefined();
    const localTapPoint = { x: 25, y: 75 };
    const tapPoint = { x: cat!.x + localTapPoint.x, y: cat!.y + localTapPoint.y };

    await touchTap(page, `[data-domino-id='cat']`, toClientPoint(appBox, tapPoint));

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.dominoes.find((domino) => domino.id === "cat")).toEqual(
      rotateAroundPivot(cat!, tapPoint),
    );
  });

  test(`${mode.name} touch tap rotates a linked group`, async ({ page }) => {
    await page.goto(`/domino/?fixture=linked&renderer=${mode.renderer}`);
    await page.waitForFunction(() => typeof window.__DOMINO_TEST__?.getState === "function");
    const appBox = await getAppBox(page);
    const stateBefore = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    const dragged = stateBefore.dominoes.find((domino) => domino.id === "dragged");
    const target = stateBefore.dominoes.find((domino) => domino.id === "target");
    expect(dragged).toBeDefined();
    expect(target).toBeDefined();
    const localTapPoint = { x: 25, y: 75 };
    const tapPoint = { x: dragged!.x + localTapPoint.x, y: dragged!.y + localTapPoint.y };

    await touchTap(page, `[data-domino-id='dragged']`, toClientPoint(appBox, tapPoint));

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.dominoes.find((domino) => domino.id === "dragged")).toEqual(
      rotateAroundPivot(dragged!, tapPoint),
    );
    expect(state.dominoes.find((domino) => domino.id === "target")).toEqual(
      rotateAroundPivot(target!, tapPoint),
    );
    expect(state.links).toEqual([
      { dominoId1: "dragged", half1: "a", dominoId2: "target", half2: "a" },
    ]);
  });

  test(`${mode.name} touch drag moves without rotating`, async ({ page }) => {
    await page.goto(`/domino/?fixture=basic&renderer=${mode.renderer}`);
    await page.waitForFunction(() => typeof window.__DOMINO_TEST__?.getState === "function");
    const appBox = await getAppBox(page);
    const stateBefore = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    const cat = stateBefore.dominoes.find((domino) => domino.id === "cat");
    expect(cat).toBeDefined();
    const start = { x: cat!.x + HALF_WIDTH / 2, y: cat!.y + HALF_HEIGHT / 2 };
    const end = { x: start.x + HALF_WIDTH, y: start.y + HALF_HEIGHT };

    await touchDrag(page, `[data-domino-id='cat']`, mode.board, toClientPoint(appBox, start), toClientPoint(appBox, end));

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.dominoes.find((domino) => domino.id === "cat")).toMatchObject({
      x: cat!.x + HALF_WIDTH,
      y: cat!.y + HALF_HEIGHT,
      rotation: cat!.rotation,
    });
  });

  test(`${mode.name} touch drag shows snap preview`, async ({ page }) => {
    await page.goto(`/domino/?fixture=snap&renderer=${mode.renderer}`);
    await page.waitForFunction(() => typeof window.__DOMINO_TEST__?.getState === "function");
    const appBox = await getAppBox(page);
    const stateBefore = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    const dragged = stateBefore.dominoes.find((domino) => domino.id === "dragged");
    const target = stateBefore.dominoes.find((domino) => domino.id === "target");
    expect(dragged).toBeDefined();
    expect(target).toBeDefined();
    const snappedPosition = {
      x: target!.x + HALF_HEIGHT + SNAP_GAP,
      y: target!.y,
    };
    const start = { x: dragged!.x + HALF_WIDTH / 2, y: dragged!.y + HALF_HEIGHT / 2 };
    const end = {
      x: snappedPosition.x + 6 + HALF_WIDTH / 2,
      y: snappedPosition.y + 4 + HALF_HEIGHT / 2,
    };

    await touchDown(page, `[data-domino-id='dragged']`, toClientPoint(appBox, start));
    await touchMove(page, mode.board, toClientPoint(appBox, end));

    expect(await page.evaluate(() => window.__DOMINO_TEST__.getSnapCandidate())).not.toBeNull();
    await expect(page.locator(".snap-highlight")).toBeVisible();

    await touchUp(page, toClientPoint(appBox, end));
  });

  test(`${mode.name} touch drop commits snap`, async ({ page }) => {
    await page.goto(`/domino/?fixture=snap&renderer=${mode.renderer}`);
    await page.waitForFunction(() => typeof window.__DOMINO_TEST__?.getState === "function");
    const appBox = await getAppBox(page);
    const stateBefore = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    const dragged = stateBefore.dominoes.find((domino) => domino.id === "dragged");
    const target = stateBefore.dominoes.find((domino) => domino.id === "target");
    expect(dragged).toBeDefined();
    expect(target).toBeDefined();
    const snappedPosition = {
      x: target!.x + HALF_HEIGHT + SNAP_GAP,
      y: target!.y,
    };
    const start = { x: dragged!.x + HALF_WIDTH / 2, y: dragged!.y + HALF_HEIGHT / 2 };
    const end = {
      x: snappedPosition.x + 6 + HALF_WIDTH / 2,
      y: snappedPosition.y + 4 + HALF_HEIGHT / 2,
    };

    await touchDrag(
      page,
      `[data-domino-id='dragged']`,
      mode.board,
      toClientPoint(appBox, start),
      toClientPoint(appBox, end),
    );

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.dominoes.find((domino) => domino.id === "dragged")).toMatchObject(snappedPosition);
    expect(state.links).toEqual([
      { dominoId1: "dragged", half1: "a", dominoId2: "target", half2: "a" },
    ]);
  });

  test(`${mode.name} tiny touch movement currently counts as drag`, async ({ page }) => {
    await page.goto(`/domino/?fixture=basic&renderer=${mode.renderer}`);
    await page.waitForFunction(() => typeof window.__DOMINO_TEST__?.getState === "function");
    const appBox = await getAppBox(page);
    const stateBefore = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    const cat = stateBefore.dominoes.find((domino) => domino.id === "cat");
    expect(cat).toBeDefined();
    const start = { x: cat!.x + HALF_WIDTH / 2, y: cat!.y + HALF_HEIGHT / 2 };
    const end = { x: start.x + 1, y: start.y + 1 };

    await touchDrag(page, `[data-domino-id='cat']`, mode.board, toClientPoint(appBox, start), toClientPoint(appBox, end));

    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    expect(state.dominoes.find((domino) => domino.id === "cat")).toMatchObject({
      x: cat!.x + 1,
      y: cat!.y + 1,
      rotation: cat!.rotation,
    });
  });
}

async function getAppBox(page: Page) {
  const appBox = await page.locator("#app").boundingBox();
  expect(appBox).not.toBeNull();
  return appBox!;
}

function toClientPoint(appBox: { x: number; y: number }, boardPoint: Point): Point {
  return {
    x: appBox.x + boardPoint.x,
    y: appBox.y + boardPoint.y,
  };
}

async function touchTap(page: Page, selector: string, point: Point): Promise<void> {
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

async function touchDown(page: Page, selector: string, point: Point): Promise<void> {
  await dispatchTouchPointer(page, selector, "pointerdown", point, 1);
}

async function touchMove(page: Page, selector: string, point: Point): Promise<void> {
  await dispatchTouchPointer(page, selector, "pointermove", point, 1);
}

async function touchUp(page: Page, point: Point): Promise<void> {
  await page.evaluate((eventInit) => {
    window.dispatchEvent(new PointerEvent("pointerup", eventInit));
  }, touchPointerEventInit(point, 0));
}

async function dispatchTouchPointer(
  page: Page,
  selector: string,
  type: "pointerdown" | "pointermove",
  point: Point,
  buttons: number,
): Promise<void> {
  await page.locator(selector).dispatchEvent(type, touchPointerEventInit(point, buttons));
}

function touchPointerEventInit(point: Point, buttons: number): PointerEventInit {
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
