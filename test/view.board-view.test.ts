import { DOMINO_HEIGHT, DOMINO_WIDTH, HALF_HEIGHT, HALF_WIDTH, SNAP_GAP } from "../src/core/geometry";
import type { BoardState } from "../src/core/types";
import { createBoardView } from "../src/view/board-view";
import { DEFAULT_BOARD_METRICS } from "../src/view/metrics";
import { board, content, domino } from "./core.fixtures";

const sideCenteredPosition = {
  x: HALF_HEIGHT + SNAP_GAP,
  y: HALF_WIDTH / 2,
};
const snapHighlightInset = 8;

describe("board view", () => {
  it("builds renderer view data for dominoes, links, and snap highlight", () => {
    const state: BoardState = {
      dominoes: [
        domino({ id: "dragged", a: content("cat_en"), ...sideCenteredPosition }),
        domino({ id: "target", a: content("cat_img", "image"), x: 0, y: 0, rotation: 90 }),
      ],
      links: [{ dominoId1: "dragged", half1: "a", dominoId2: "target", half2: "a" }],
    };

    const view = createBoardView(
      state,
      { width: 800, height: 600, scale: 1 },
      DEFAULT_BOARD_METRICS,
      new Map([["dragged", "hover" as const]]),
      {
        draggedDominoId: "dragged",
        draggedHalf: "a",
        targetDominoId: "target",
        targetHalf: "a",
        snappedPosition: sideCenteredPosition,
        distance: 0,
      },
    );

    expect(view.rect).toEqual({ width: 800, height: 600 });
    expect(view.dominoes).toHaveLength(2);
    expect(view.dominoes[0]).toMatchObject({
      id: "dragged",
      x: sideCenteredPosition.x,
      y: sideCenteredPosition.y,
      rotation: 0,
      width: DOMINO_WIDTH,
      height: DOMINO_HEIGHT,
      rotateControl: {
        center: { x: DOMINO_WIDTH, y: 0 },
        fill: "#2563eb",
      },
    });
    expect(view.linkControls).toEqual([
      {
        link: { dominoId1: "dragged", half1: "a", dominoId2: "target", half2: "a" },
        center: { x: HALF_HEIGHT + SNAP_GAP / 2, y: HALF_WIDTH },
      },
    ]);
    expect(view.snapHighlight).toMatchObject({
      x: sideCenteredPosition.x,
      y: sideCenteredPosition.y,
      rotation: 0,
      width: DEFAULT_BOARD_METRICS.halfWidth * 2 - snapHighlightInset,
      height: DEFAULT_BOARD_METRICS.halfHeight - snapHighlightInset,
    });
  });

  it("omits the snap highlight when no candidate exists", () => {
    const view = createBoardView(
      board([domino({ id: "dragged", a: content("cat_en") })]),
      { width: 800, height: 600, scale: 1 },
      DEFAULT_BOARD_METRICS,
      new Map(),
      null,
    );

    expect(view.snapHighlight).toBeNull();
  });
});
