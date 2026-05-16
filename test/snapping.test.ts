import { findSnapCandidate } from "../src/core/snapping";
import { DOMINO_WIDTH, HALF_HEIGHT, HALF_WIDTH, SNAP_GAP } from "../src/core/geometry";
import type { BoardState, Pair } from "../src/core/types";
import { board, content, domino } from "./core.fixtures";

const pairs: Pair[] = [{ a: "cat_en", b: "cat_img" }];
const sideCenteredSnap = { x: HALF_HEIGHT + SNAP_GAP, y: HALF_WIDTH / 2 };
const nearSideCenteredSnap = { x: sideCenteredSnap.x - 0.8, y: HALF_WIDTH / 3 };
const offThresholdSnap = { x: sideCenteredSnap.x + HALF_WIDTH, y: HALF_WIDTH / 3 };
const snapProbeOffset = 8;

describe("snap candidate detection", () => {
  it("returns null when there are no other dominoes", () => {
    const state = board([domino({ id: "dragged", a: content("cat_en") })]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })).toBeNull();
  });

  it("returns null when nearby halves do not match", () => {
    const state = board([
      domino({ id: "dragged", a: content("cat_en"), ...sideCenteredSnap }),
      domino({ id: "target", a: content("dog_img", "image"), x: 0, y: 0, rotation: 90 }),
    ]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })).toBeNull();
  });

  it("returns null when a valid match is outside the magnet threshold", () => {
    const state = board([
      domino({ id: "dragged", a: content("cat_en"), ...offThresholdSnap }),
      domino({ id: "target", a: content("cat_img", "image"), x: 0, y: 0, rotation: 90 }),
    ]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })).toBeNull();
  });

  it("returns a candidate for a valid nearby match", () => {
    const state = board([
      domino({ id: "dragged", a: content("cat_en"), ...nearSideCenteredSnap }),
      domino({ id: "target", a: content("cat_img", "image"), x: 0, y: 0, rotation: 90 }),
    ]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })).toMatchObject({
      draggedDominoId: "dragged",
      draggedHalf: "a",
      targetDominoId: "target",
      targetHalf: "a",
      snappedPosition: sideCenteredSnap,
    });
  });

  it("centers a perpendicular snap on the target domino side", () => {
    const state = board([
      domino({
        id: "dragged",
        a: content("cat_en"),
        x: sideCenteredSnap.x + 4,
        y: sideCenteredSnap.y + 3,
      }),
      domino({ id: "target", a: content("cat_img", "image"), x: 0, y: 0, rotation: 90 }),
    ]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })).toMatchObject({
      draggedDominoId: "dragged",
      draggedHalf: "a",
      targetDominoId: "target",
      targetHalf: "a",
      snappedPosition: sideCenteredSnap,
    });
  });

  it.each([
    [
      "right",
      90,
      { x: sideCenteredSnap.x + snapProbeOffset, y: sideCenteredSnap.y + snapProbeOffset },
      sideCenteredSnap,
    ],
    [
      "left",
      90,
      {
        x: -(DOMINO_WIDTH + SNAP_GAP) - snapProbeOffset,
        y: sideCenteredSnap.y + snapProbeOffset,
        rotation: 180,
      },
      { x: -(DOMINO_WIDTH + SNAP_GAP), y: sideCenteredSnap.y },
    ],
    [
      "below",
      0,
      { x: 0, y: HALF_HEIGHT + SNAP_GAP + snapProbeOffset },
      { x: 0, y: HALF_HEIGHT + SNAP_GAP },
    ],
    [
      "above",
      0,
      { x: 0, y: -(HALF_HEIGHT + SNAP_GAP) - snapProbeOffset },
      { x: 0, y: -(HALF_HEIGHT + SNAP_GAP) },
    ],
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
      domino({ id: "dragged", a: content("cat_en"), b: content("free"), ...nearSideCenteredSnap }),
      domino({ id: "target", a: content("cat_img", "image"), x: 0, y: 0, rotation: 90 }),
      domino({ id: "blocker", x: sideCenteredSnap.x + HALF_WIDTH - 16, y: nearSideCenteredSnap.y }),
    ]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })).toBeNull();
  });

  it("chooses the closest candidate", () => {
    const state = board([
      domino({ id: "dragged", a: content("cat_en"), x: sideCenteredSnap.x + 7, y: 17 }),
      domino({ id: "target-far", a: content("cat_img", "image"), x: 0, y: 0, rotation: 90 }),
      domino({ id: "target-near", a: content("cat_img", "image"), x: SNAP_GAP + 10, y: 0, rotation: 90 }),
    ]);

    expect(findSnapCandidate(state, "dragged", pairs, { threshold: 0.5 })?.targetDominoId).toBe(
      "target-near",
    );
  });

  it("breaks exact ties deterministically by target id, target half, then dragged half", () => {
    const state: BoardState = {
      dominoes: [
        domino({ id: "dragged", a: content("cat_en"), b: content("cat_en"), ...nearSideCenteredSnap }),
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
