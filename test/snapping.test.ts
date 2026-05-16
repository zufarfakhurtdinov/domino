import { findSnapCandidate } from "../src/core/snapping";
import { HALF_HEIGHT, HALF_WIDTH, SNAP_GAP } from "../src/core/geometry";
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
      domino({ id: "dragged", a: content("cat_en"), x: 102, y: 17 }),
      domino({ id: "target", a: content("dog_img", "image"), x: 0, y: 0, rotation: 90 }),
    ]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })).toBeNull();
  });

  it("returns null when a valid match is outside the magnet threshold", () => {
    const state = board([
      domino({ id: "dragged", a: content("cat_en"), x: 202, y: 17 }),
      domino({ id: "target", a: content("cat_img", "image"), x: 0, y: 0, rotation: 90 }),
    ]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })).toBeNull();
  });

  it("returns a candidate for a valid nearby match", () => {
    const state = board([
      domino({ id: "dragged", a: content("cat_en"), x: 101.2, y: 17 }),
      domino({ id: "target", a: content("cat_img", "image"), x: 0, y: 0, rotation: 90 }),
    ]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })).toMatchObject({
      draggedDominoId: "dragged",
      draggedHalf: "a",
      targetDominoId: "target",
      targetHalf: "a",
      snappedPosition: { x: HALF_HEIGHT + SNAP_GAP, y: HALF_WIDTH / 2 },
    });
  });

  it("centers a perpendicular snap on the target domino side", () => {
    const state = board([
      domino({ id: "dragged", a: content("cat_en"), x: HALF_HEIGHT + SNAP_GAP + 4, y: HALF_WIDTH / 2 + 3 }),
      domino({ id: "target", a: content("cat_img", "image"), x: 0, y: 0, rotation: 90 }),
    ]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })).toMatchObject({
      draggedDominoId: "dragged",
      draggedHalf: "a",
      targetDominoId: "target",
      targetHalf: "a",
      snappedPosition: { x: HALF_HEIGHT + SNAP_GAP, y: HALF_WIDTH / 2 },
    });
  });

  it.each([
    [
      "right",
      90,
      { x: HALF_HEIGHT + SNAP_GAP + 8, y: HALF_WIDTH / 2 + 8 },
      { x: HALF_HEIGHT + SNAP_GAP, y: HALF_WIDTH / 2 },
    ],
    [
      "left",
      90,
      { x: -(HALF_WIDTH * 2 + SNAP_GAP) - 8, y: HALF_WIDTH / 2 + 8, rotation: 180 },
      { x: -(HALF_WIDTH * 2 + SNAP_GAP), y: HALF_WIDTH / 2 },
    ],
    ["below", 0, { x: 0, y: HALF_HEIGHT + SNAP_GAP + 8 }, { x: 0, y: HALF_HEIGHT + SNAP_GAP }],
    ["above", 0, { x: 0, y: -(HALF_HEIGHT + SNAP_GAP) - 8 }, { x: 0, y: -(HALF_HEIGHT + SNAP_GAP) }],
  ] as const)(
    "can snap to the target's %s side",
    (_side, targetRotation, draggedPosition, snappedPosition) => {
    const state = board([
      domino({
        id: "dragged",
        a: content("cat_en"),
        x: draggedPosition.x,
        y: draggedPosition.y,
        rotation: "rotation" in draggedPosition ? draggedPosition.rotation : 0,
      }),
      domino({ id: "target", a: content("cat_img", "image"), x: 0, y: 0, rotation: targetRotation }),
    ]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })?.snappedPosition).toEqual(
      snappedPosition,
    );
    },
  );

  it("rejects a snap placement that would collide with another domino", () => {
    const state = board([
      domino({ id: "dragged", a: content("cat_en"), b: content("free"), x: 101.2, y: 17 }),
      domino({ id: "target", a: content("cat_img", "image"), x: 0, y: 0, rotation: 90 }),
      domino({ id: "blocker", x: 186, y: 17 }),
    ]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })).toBeNull();
  });

  it("chooses the closest candidate", () => {
    const state = board([
      domino({ id: "dragged", a: content("cat_en"), x: 109, y: 17 }),
      domino({ id: "target-far", a: content("cat_img", "image"), x: 0, y: 0, rotation: 90 }),
      domino({ id: "target-near", a: content("cat_img", "image"), x: 12, y: 0, rotation: 90 }),
    ]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })?.targetDominoId).toBe(
      "target-near",
    );
  });

  it("breaks exact ties deterministically by target id, target half, then dragged half", () => {
    const state: BoardState = {
      dominoes: [
        domino({ id: "dragged", a: content("cat_en"), b: content("cat_en"), x: 101.2, y: 17 }),
        domino({ id: "b-target", a: content("cat_img", "image"), x: 0, y: 0, rotation: 90 }),
        domino({ id: "a-target", a: content("cat_img", "image"), x: 0, y: 0, rotation: 90 }),
      ],
      links: [],
    };

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 2 })?.targetDominoId).toBe(
      "a-target",
    );
  });
});
