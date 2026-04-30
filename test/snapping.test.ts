import { findSnapCandidate } from "../src/core/snapping";
import type { BoardState, Pair } from "../src/core/types";
import { board, content, domino } from "./core.fixtures";

const pairs: Pair[] = [{ a: "cat_en", b: "cat_img" }];

describe("snap candidate detection", () => {
  it("returns null when there are no other dominoes", () => {
    const state = board([domino({ id: "dragged", a: content("cat_en") })]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })).toBeNull();
  });

  it("returns null when nearby halves do not match", () => {
    const state = board([
      domino({ id: "dragged", a: content("cat_en"), x: 1.1, y: 0 }),
      domino({ id: "target", a: content("dog_img", "image"), x: 0, y: 0 }),
    ]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })).toBeNull();
  });

  it("returns null when a valid match is outside the magnet threshold", () => {
    const state = board([
      domino({ id: "dragged", a: content("cat_en"), x: 3, y: 0 }),
      domino({ id: "target", a: content("cat_img", "image"), x: 0, y: 0 }),
    ]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })).toBeNull();
  });

  it("returns a candidate for a valid nearby match", () => {
    const state = board([
      domino({ id: "dragged", a: content("cat_en"), x: 1.2, y: 0 }),
      domino({ id: "target", a: content("cat_img", "image"), x: 0, y: 0 }),
    ]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })).toEqual({
      draggedDominoId: "dragged",
      draggedHalf: "a",
      targetDominoId: "target",
      targetHalf: "a",
      snappedPosition: { x: 1, y: 0 },
      distance: 0.19999999999999996,
    });
  });

  it.each([
    ["right", { x: 1.2, y: 0 }, { x: 1, y: 0 }],
    ["left", { x: -1.2, y: 0 }, { x: -1, y: 0 }],
    ["below", { x: 0, y: 1.2 }, { x: 0, y: 1 }],
    ["above", { x: 0, y: -1.2 }, { x: 0, y: -1 }],
  ] as const)("can snap to the target's %s side", (_side, draggedPosition, snappedPosition) => {
    const state = board([
      domino({ id: "dragged", a: content("cat_en"), x: draggedPosition.x, y: draggedPosition.y }),
      domino({ id: "target", a: content("cat_img", "image"), x: 0, y: 0 }),
    ]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })?.snappedPosition).toEqual(
      snappedPosition,
    );
  });

  it("rejects a snap placement that would collide with another domino", () => {
    const state = board([
      domino({ id: "dragged", a: content("cat_en"), b: content("free"), x: 1.2, y: 0 }),
      domino({ id: "target", a: content("cat_img", "image"), x: 0, y: 0 }),
      domino({ id: "blocker", x: 2, y: 0 }),
    ]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })).toBeNull();
  });

  it("chooses the closest candidate", () => {
    const state = board([
      domino({ id: "dragged", a: content("cat_en"), x: 1.15, y: 0 }),
      domino({ id: "target-far", a: content("cat_img", "image"), x: 0, y: 0 }),
      domino({ id: "target-near", a: content("cat_img", "image"), x: 3, y: 0, rotation: 180 }),
    ]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })?.targetDominoId).toBe(
      "target-near",
    );
  });

  it("breaks exact ties deterministically by target id, target half, then dragged half", () => {
    const state: BoardState = {
      dominoes: [
        domino({ id: "dragged", a: content("cat_en"), b: content("cat_en"), x: 1.2, y: 0 }),
        domino({ id: "b-target", a: content("cat_img", "image"), x: 0, y: 0 }),
        domino({ id: "a-target", a: content("cat_img", "image"), x: 0, y: 2 }),
      ],
      links: [],
    };

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 2 })?.targetDominoId).toBe(
      "a-target",
    );
  });
});
