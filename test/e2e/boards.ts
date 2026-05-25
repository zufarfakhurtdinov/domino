import type { Page } from "@playwright/test";
import {
  DOMINO_WIDTH,
  HALF_WIDTH,
  SNAP_GAP,
  getTransformOrigin,
} from "../../src/core/geometry";
import type { BoardState, Domino, Point } from "../../src/core/types";

export const defaultDragDominoId = "one-two-a";
export const defaultLinkedDragDominoId = "four-five";
export const defaultLinkedTargetDominoId = "one-five";

export async function openBoard(page: Page): Promise<void> {
  await page.goto("/domino/");
  await page.waitForFunction(
    () => typeof window.__DOMINO_TEST__?.getState === "function",
  );
}

export function getDomino(state: BoardState, dominoId: string): Domino {
  const domino = state.dominoes.find((entry) => entry.id === dominoId);
  if (!domino) {
    throw new Error(`Missing domino ${dominoId}`);
  }

  return domino;
}

export function getDefaultFiveSnapPosition(state: BoardState): Point {
  const target = getDomino(state, defaultLinkedTargetDominoId);
  return {
    x: target.x + DOMINO_WIDTH + SNAP_GAP,
    y: target.y - HALF_WIDTH,
  };
}

export async function linkDefaultFivePair(page: Page): Promise<void> {
  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  const dragged = getDomino(state, defaultLinkedDragDominoId);
  const snapPosition = getDefaultFiveSnapPosition(state);

  await page.evaluate(
    ({ dominoId, visualState }) => {
      window.__DOMINO_TEST__.drop(dominoId, visualState);
    },
    {
      dominoId: dragged.id,
      visualState: {
        ...getTransformOrigin({ ...dragged, ...snapPosition }),
        rotation: dragged.rotation,
      },
    },
  );
}
