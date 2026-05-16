import type { BoardState } from "../src/core/types";
import { createBoardView } from "../src/view/board-view";
import { DEFAULT_BOARD_METRICS } from "../src/view/metrics";
import { board, content, domino } from "./core.fixtures";

describe("board view", () => {
  it("builds renderer view data for dominoes, links, and snap highlight", () => {
    const state: BoardState = {
      dominoes: [
        domino({ id: "dragged", a: content("cat_en"), x: 100, y: 17 }),
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
        snappedPosition: { x: 100, y: 17 },
        distance: 0,
      },
    );

    expect(view.rect).toEqual({ width: 800, height: 600 });
    expect(view.dominoes).toHaveLength(2);
    expect(view.dominoes[0]).toMatchObject({
      id: "dragged",
      x: 100,
      y: 17,
      rotation: 0,
      width: 200,
      height: 100,
      rotateControl: {
        center: { x: 200, y: 0 },
        fill: "#2563eb",
      },
    });
    expect(view.linkControls).toEqual([
      {
        link: { dominoId1: "dragged", half1: "a", dominoId2: "target", half2: "a" },
        center: { x: 100, y: 58.5 },
      },
    ]);
    expect(view.snapHighlight).toMatchObject({
      x: 100,
      y: 17,
      rotation: 0,
      width: 192,
      height: 92,
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
