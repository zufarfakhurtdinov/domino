import { applySnap } from "../src/core/snapping";
import type { Link, SnapCandidate } from "../src/core/types";
import { board, content, domino } from "./core.fixtures";

const candidate: SnapCandidate = {
  draggedDominoId: "dragged",
  draggedHalf: "a",
  targetDominoId: "target",
  targetHalf: "a",
  snappedPosition: { x: 1, y: 0 },
  distance: 0.2,
};

describe("apply snap", () => {
  it("moves the dragged domino to the snapped position and creates a link", () => {
    const state = board([
      domino({ id: "dragged", a: content("cat_en"), x: 1.2, y: 0 }),
      domino({ id: "target", a: content("cat_img", "image"), x: 0, y: 0, rotation: 90 }),
    ]);

    const next = applySnap(state, candidate);

    expect(next.dominoes[0]).toEqual({ ...state.dominoes[0], x: 1, y: 0 });
    expect(next.links).toEqual([
      { dominoId1: "dragged", half1: "a", dominoId2: "target", half2: "a" },
    ]);
  });

  it("does not duplicate an existing link", () => {
    const existing: Link = {
      dominoId1: "dragged",
      half1: "a",
      dominoId2: "target",
      half2: "a",
    };
    const state = {
      dominoes: [domino({ id: "dragged" }), domino({ id: "target" })],
      links: [existing],
    };

    expect(applySnap(state, candidate).links).toEqual([existing]);
  });

  it("preserves unrelated links", () => {
    const unrelated: Link = {
      dominoId1: "other-1",
      half1: "a",
      dominoId2: "other-2",
      half2: "b",
    };
    const state = {
      dominoes: [
        domino({ id: "dragged" }),
        domino({ id: "target" }),
        domino({ id: "other-1" }),
        domino({ id: "other-2" }),
      ],
      links: [unrelated],
    };

    expect(applySnap(state, candidate).links).toEqual([unrelated, {
      dominoId1: "dragged",
      half1: "a",
      dominoId2: "target",
      half2: "a",
    }]);
  });
});
