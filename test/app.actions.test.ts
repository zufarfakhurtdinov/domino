import { commitDrop } from "../src/app/actions";
import { DOMINO_WIDTH, HALF_HEIGHT, HALF_WIDTH, SNAP_GAP } from "../src/core/geometry";
import type { BoardState } from "../src/core/types";
import { DEFAULT_BOARD_METRICS } from "../src/view/metrics";
import { content, domino } from "./core.fixtures";

describe("app actions", () => {
  it("commits a dragged connected group when the drop does not snap", () => {
    const draggedStart = { x: HALF_WIDTH, y: SNAP_GAP };
    const linkedStart = { x: 0, y: 0 };
    const draggedDestination = { x: DOMINO_WIDTH, y: HALF_HEIGHT };
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

    expect(
      commitDrop(
        state,
        "dragged",
        { ...draggedDestination, rotation: 0 },
        [],
        DEFAULT_BOARD_METRICS,
      ).dominoes,
    ).toEqual([
      domino({ id: "dragged", ...draggedDestination }),
      domino({ id: "linked", x: linkedStart.x + delta.x, y: linkedStart.y + delta.y, rotation: 90 }),
    ]);
  });

  it("commits a snapped connected group without changing relative positions", () => {
    const draggedStart = { x: HALF_WIDTH, y: SNAP_GAP };
    const linkedStart = { x: 0, y: DOMINO_WIDTH + SNAP_GAP };
    const dropPosition = {
      x: HALF_HEIGHT + SNAP_GAP + 4,
      y: 3,
    };
    const snappedPosition = {
      x: HALF_HEIGHT + SNAP_GAP,
      y: 0,
    };
    const previewDelta = {
      x: dropPosition.x - draggedStart.x,
      y: dropPosition.y - draggedStart.y,
    };
    const snapDelta = {
      x: snappedPosition.x - dropPosition.x,
      y: snappedPosition.y - dropPosition.y,
    };
    const state: BoardState = {
      dominoes: [
        domino({ id: "dragged", a: content("cat_en"), ...draggedStart }),
        domino({ id: "linked", ...linkedStart, rotation: 90 }),
        domino({ id: "target", a: content("cat_img", "image"), x: 0, y: 0, rotation: 90 }),
      ],
      links: [{ dominoId1: "dragged", half1: "a", dominoId2: "linked", half2: "a" }],
    };

    const next = commitDrop(
      state,
      "dragged",
      { ...dropPosition, rotation: 0 },
      [{ a: "cat_en", b: "cat_img" }],
      DEFAULT_BOARD_METRICS,
    );

    expect(next.dominoes).toEqual([
      domino({ id: "dragged", a: content("cat_en"), ...snappedPosition }),
      domino({
        id: "linked",
        x: linkedStart.x + previewDelta.x + snapDelta.x,
        y: linkedStart.y + previewDelta.y + snapDelta.y,
        rotation: 90,
      }),
      domino({ id: "target", a: content("cat_img", "image"), x: 0, y: 0, rotation: 90 }),
    ]);
    expect(next.links).toContainEqual({
      dominoId1: "dragged",
      half1: "a",
      dominoId2: "target",
      half2: "a",
    });
  });
});
