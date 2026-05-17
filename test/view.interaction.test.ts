import { DOMINO_WIDTH, HALF_HEIGHT, HALF_WIDTH, SNAP_GAP } from "../src/core/geometry";
import type { BoardState, Pair } from "../src/core/types";
import { DEFAULT_BOARD_METRICS } from "../src/view/metrics";
import { derivePreviewResult } from "../src/view/interaction";
import { board, content, domino } from "./core.fixtures";

const pairs: Pair[] = [{ a: "cat_en", b: "cat_img" }];
const nearSideCenteredSnap = {
  x: HALF_HEIGHT + SNAP_GAP - 0.8,
  y: HALF_WIDTH / 3,
};
const sideCenteredSnap = {
  x: HALF_HEIGHT + SNAP_GAP,
  y: 0,
};

describe("view interaction", () => {
  it("derives a preview state and snap candidate from the visual drag state", () => {
    const state = board([
      domino({ id: "dragged", a: content("cat_en"), ...nearSideCenteredSnap }),
      domino({ id: "target", a: content("cat_img", "image"), x: 0, y: 0, rotation: 90 }),
    ]);

    const result = derivePreviewResult(
      state,
      "dragged",
      { ...nearSideCenteredSnap, rotation: 0 },
      pairs,
      0.5,
      DEFAULT_BOARD_METRICS,
    );

    expect(result.previewState.dominoes.find((entry) => entry.id === "dragged")?.x).toBe(
      nearSideCenteredSnap.x,
    );
    expect(result.previewState.dominoes.find((entry) => entry.id === "dragged")?.y).toBe(
      nearSideCenteredSnap.y,
    );
    expect(result.candidate).toMatchObject({
      draggedDominoId: "dragged",
      draggedHalf: "a",
      targetDominoId: "target",
      targetHalf: "a",
      snappedPosition: sideCenteredSnap,
    });
    expect(result.candidate?.distance).toBeCloseTo(
      Math.hypot(nearSideCenteredSnap.x - sideCenteredSnap.x, nearSideCenteredSnap.y - sideCenteredSnap.y),
      3,
    );
  });

  it("moves the whole connected group in preview state", () => {
    const draggedStart = { x: HALF_WIDTH, y: SNAP_GAP };
    const linkedStart = { x: 0, y: 0 };
    const draggedDestination = { x: DOMINO_WIDTH, y: HALF_WIDTH };
    const delta = {
      x: draggedDestination.x - draggedStart.x,
      y: draggedDestination.y - draggedStart.y,
    };
    const state: BoardState = {
      dominoes: [
        domino({ id: "dragged", ...draggedStart }),
        domino({ id: "linked", ...linkedStart, rotation: 90 }),
      ],
      links: [{ dominoId1: "dragged", half1: "a", dominoId2: "linked", half2: "a" }],
    };

    const result = derivePreviewResult(
      state,
      "dragged",
      { ...draggedDestination, rotation: 0 },
      [],
      0.5,
      DEFAULT_BOARD_METRICS,
    );

    expect(result.previewState.dominoes).toEqual([
      domino({ id: "dragged", ...draggedDestination }),
      domino({ id: "linked", x: linkedStart.x + delta.x, y: linkedStart.y + delta.y, rotation: 90 }),
    ]);
    expect(result.candidate).toBeNull();
  });
});
