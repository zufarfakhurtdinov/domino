import { findSnapCandidate } from "../src/core/snapping";
import {
  DOMINO_WIDTH,
  getDominoBounds,
  getHalfBounds,
  getRectCenter,
  HALF_WIDTH,
  SNAP_GAP,
} from "../src/core/geometry";
import type { BoardState, Domino, DominoHalf, Point, Rect, Rotation } from "../src/core/types";
import { board, content, domino } from "./core.fixtures";

type Side = "top" | "right" | "bottom" | "left";

type SlotRef = {
  half: DominoHalf;
  side: Side;
};

type SlotPairCase = {
  name: string;
  targetRotation: Rotation;
  draggedRotation: Rotation;
  targetSlot: SlotRef;
  draggedSlot: SlotRef;
  snappedPosition: Point;
};

const rotations = [0, 90, 180, 270] as const;
const sides = ["top", "right", "bottom", "left"] as const;
const snapProbeOffset = { x: 0.75, y: 0.5 };

describe("snap candidate detection", () => {
  it.each([
    [
      0,
      [
        { half: "a", side: "left" },
        { half: "a", side: "top" },
        { half: "a", side: "bottom" },
        { half: "b", side: "right" },
        { half: "b", side: "top" },
        { half: "b", side: "bottom" },
      ],
    ],
    [
      90,
      [
        { half: "a", side: "top" },
        { half: "a", side: "right" },
        { half: "a", side: "left" },
        { half: "b", side: "bottom" },
        { half: "b", side: "right" },
        { half: "b", side: "left" },
      ],
    ],
    [
      180,
      [
        { half: "a", side: "right" },
        { half: "a", side: "top" },
        { half: "a", side: "bottom" },
        { half: "b", side: "left" },
        { half: "b", side: "top" },
        { half: "b", side: "bottom" },
      ],
    ],
    [
      270,
      [
        { half: "a", side: "bottom" },
        { half: "a", side: "right" },
        { half: "a", side: "left" },
        { half: "b", side: "top" },
        { half: "b", side: "right" },
        { half: "b", side: "left" },
      ],
    ],
  ] as const)("uses six exposed slots for rotation %s", (rotation, expectedSlots) => {
    const slots = exposedSlots(domino({ rotation }));

    expect(slots).toHaveLength(6);
    expect(slots).toEqual(expect.arrayContaining([...expectedSlots]));
  });

  it.each(slotPairCases())(
    "snaps $name",
    ({ targetRotation, draggedRotation, targetSlot, draggedSlot, snappedPosition }) => {
      const target = matchingTarget(targetRotation, targetSlot.half);
      const dragged = matchingDragged(draggedRotation, draggedSlot.half, {
        x: snappedPosition.x + snapProbeOffset.x,
        y: snappedPosition.y + snapProbeOffset.y,
      });

      expect(findSnapCandidate(board([dragged, target]), "dragged", { threshold: 0.25 })).toMatchObject({
        draggedDominoId: "dragged",
        draggedHalf: draggedSlot.half,
        targetDominoId: "target",
        targetHalf: targetSlot.half,
        snappedPosition,
      });
    },
  );

  it("does not snap horizontal dominoes through side slots", () => {
    const target = matchingTarget(0, "a");
    const targetSlot = { half: "a", side: "top" } as const;
    const draggedSlot = { half: "a", side: "bottom" } as const;
    const snappedPosition = snapPositionForSlots(
      matchingDragged(0, draggedSlot.half),
      draggedSlot,
      target,
      targetSlot,
    );
    const state = board([
      matchingDragged(0, draggedSlot.half, near(snappedPosition)),
      target,
    ]);

    expect(findSnapCandidate(state, "dragged", { threshold: 0.5 })).toBeNull();
  });

  it("does not snap vertical dominoes through side slots", () => {
    const target = matchingTarget(90, "a");
    const targetSlot = { half: "a", side: "left" } as const;
    const draggedSlot = { half: "a", side: "right" } as const;
    const snappedPosition = snapPositionForSlots(
      matchingDragged(90, draggedSlot.half),
      draggedSlot,
      target,
      targetSlot,
    );
    const state = board([
      matchingDragged(90, draggedSlot.half, near(snappedPosition)),
      target,
    ]);

    expect(findSnapCandidate(state, "dragged", { threshold: 0.5 })).toBeNull();
  });

  it("returns null when there are no other dominoes", () => {
    const state = board([domino({ id: "dragged", a: content("cat_en") })]);

    expect(findSnapCandidate(state, "dragged", { threshold: 0.5 })).toBeNull();
  });

  it("snaps nearby exposed slots without requiring a configured pair", () => {
    const target = matchingTarget(90, "a");
    const targetSlot = { half: "a", side: "top" } as const;
    const draggedSlot = { half: "a", side: "bottom" } as const;
    const snappedPosition = snapPositionForSlots(
      domino({ id: "dragged", a: content("dog_en") }),
      draggedSlot,
      target,
      targetSlot,
    );
    const state = board([
      domino({ id: "dragged", a: content("dog_en"), ...near(snappedPosition) }),
      target,
    ]);

    expect(findSnapCandidate(state, "dragged", { threshold: 0.5 })).toMatchObject({
      draggedDominoId: "dragged",
      draggedHalf: "a",
      targetDominoId: "target",
      targetHalf: "a",
      snappedPosition,
    });
  });

  it("returns null when a valid match is outside the magnet threshold", () => {
    const target = matchingTarget(90, "a");
    const targetSlot = { half: "a", side: "top" } as const;
    const draggedSlot = { half: "a", side: "bottom" } as const;
    const snappedPosition = snapPositionForSlots(
      matchingDragged(0, draggedSlot.half),
      draggedSlot,
      target,
      targetSlot,
    );
    const state = board([
      matchingDragged(0, draggedSlot.half, {
        x: snappedPosition.x + HALF_WIDTH * 4,
        y: snappedPosition.y + HALF_WIDTH * 4,
      }),
      target,
    ]);

    expect(findSnapCandidate(state, "dragged", { threshold: 0.5 })).toBeNull();
  });

  it("does not offer another slot on a half that already has a link", () => {
    const target = matchingTarget(90, "a");
    const targetSlot = { half: "a", side: "top" } as const;
    const draggedSlot = { half: "a", side: "bottom" } as const;
    const snappedPosition = snapPositionForSlots(
      matchingDragged(0, draggedSlot.half),
      draggedSlot,
      target,
      targetSlot,
    );
    const state: BoardState = {
      dominoes: [
        matchingDragged(0, draggedSlot.half, near(snappedPosition)),
        target,
        domino({
          id: "linked-to-target-a",
          a: content("dog_en"),
          b: content("dog_en"),
          x: -(DOMINO_WIDTH + SNAP_GAP),
          y: 0,
        }),
      ],
      links: [{ dominoId1: "target", half1: "a", dominoId2: "linked-to-target-a", half2: "b" }],
    };

    expect(findSnapCandidate(state, "dragged", { threshold: 0.5 })).toBeNull();
  });

  it("still offers a slot on the other half when one half already has a link", () => {
    const targetSlot = { half: "b", side: "bottom" } as const;
    const draggedSlot = { half: "b", side: "top" } as const;
    const target = matchingTarget(90, targetSlot.half);
    const snappedPosition = snapPositionForSlots(
      matchingDragged(0, draggedSlot.half),
      draggedSlot,
      target,
      targetSlot,
    );
    const state: BoardState = {
      dominoes: [
        matchingDragged(0, draggedSlot.half, near(snappedPosition)),
        target,
        domino({
          id: "linked-to-target-a",
          a: content("dog_en"),
          b: content("dog_en"),
          x: -(DOMINO_WIDTH + SNAP_GAP),
          y: 0,
        }),
      ],
      links: [{ dominoId1: "target", half1: "a", dominoId2: "linked-to-target-a", half2: "b" }],
    };

    expect(findSnapCandidate(state, "dragged", { threshold: 0.5 })).toMatchObject({
      draggedHalf: "b",
      targetHalf: "b",
      snappedPosition,
    });
  });

  it("does not offer another slot from a dragged half that already has a link", () => {
    const target = matchingTarget(90, "a");
    const targetSlot = { half: "a", side: "top" } as const;
    const draggedSlot = { half: "a", side: "bottom" } as const;
    const snappedPosition = snapPositionForSlots(
      matchingDragged(0, draggedSlot.half),
      draggedSlot,
      target,
      targetSlot,
    );
    const dragged = matchingDragged(0, draggedSlot.half, near(snappedPosition));
    const state: BoardState = {
      dominoes: [
        dragged,
        target,
        domino({
          id: "linked-to-dragged-a",
          a: content("dog_en"),
          b: content("dog_en"),
          x: dragged.x - (DOMINO_WIDTH + SNAP_GAP),
          y: dragged.y,
        }),
      ],
      links: [{ dominoId1: "dragged", half1: "a", dominoId2: "linked-to-dragged-a", half2: "b" }],
    };

    expect(findSnapCandidate(state, "dragged", { threshold: 0.5 })).toBeNull();
  });

  it("does not offer the second half on an already occupied broad side", () => {
    const target = matchingTarget(90, "a");
    const linkedSlot = { half: "b", side: "right" } as const;
    const firstTargetSlot = { half: "a", side: "left" } as const;
    const secondTargetSlot = { half: "b", side: "left" } as const;
    const draggedSlot = { half: "b", side: "right" } as const;
    const linked = domino({
      id: "linked",
      ...snapPositionForSlots(domino({ id: "linked" }), linkedSlot, target, firstTargetSlot),
    });
    const snappedPosition = snapPositionForSlots(
      matchingDragged(0, draggedSlot.half),
      draggedSlot,
      target,
      secondTargetSlot,
    );
    const state: BoardState = {
      dominoes: [
        matchingDragged(0, draggedSlot.half, near(snappedPosition)),
        target,
        linked,
      ],
      links: [{ dominoId1: "linked", half1: "b", dominoId2: "target", half2: "a" }],
    };

    expect(findSnapCandidate(state, "dragged", { threshold: 0.5 })).toBeNull();
  });

  it("rejects a snap placement that would collide with another domino", () => {
    const target = matchingTarget(90, "a");
    const targetSlot = { half: "a", side: "top" } as const;
    const draggedSlot = { half: "a", side: "bottom" } as const;
    const snappedPosition = snapPositionForSlots(
      matchingDragged(0, draggedSlot.half),
      draggedSlot,
      target,
      targetSlot,
    );
    const state = board([
      matchingDragged(0, draggedSlot.half, near(snappedPosition)),
      target,
      domino({ id: "blocker", x: snappedPosition.x, y: snappedPosition.y }),
    ]);

    expect(findSnapCandidate(state, "dragged", { threshold: 0.5 })).toBeNull();
  });

  it("does not propose a snap to another domino in the dragged group", () => {
    const target = matchingTarget(90, "a", "linked-target");
    const targetSlot = { half: "a", side: "top" } as const;
    const draggedSlot = { half: "a", side: "bottom" } as const;
    const snappedPosition = snapPositionForSlots(
      matchingDragged(0, draggedSlot.half),
      draggedSlot,
      target,
      targetSlot,
    );
    const state: BoardState = {
      dominoes: [
        matchingDragged(0, draggedSlot.half, near(snappedPosition)),
        target,
      ],
      links: [{ dominoId1: "dragged", half1: "b", dominoId2: "linked-target", half2: "b" }],
    };

    expect(findSnapCandidate(state, "dragged", { threshold: 0.5 })).toBeNull();
  });

  it("chooses the closest candidate", () => {
    const targetSlot = { half: "a", side: "top" } as const;
    const draggedSlot = { half: "a", side: "bottom" } as const;
    const nearTarget = matchingTarget(90, targetSlot.half, "target-near", { x: SNAP_GAP + 10, y: 0 });
    const farTarget = matchingTarget(90, targetSlot.half, "target-far");
    const snappedPosition = snapPositionForSlots(
      matchingDragged(0, draggedSlot.half),
      draggedSlot,
      nearTarget,
      targetSlot,
    );
    const state = board([
      matchingDragged(0, draggedSlot.half, near(snappedPosition)),
      farTarget,
      nearTarget,
    ]);

    expect(findSnapCandidate(state, "dragged", { threshold: 0.5 })?.targetDominoId).toBe(
      "target-near",
    );
  });

  it("breaks exact ties deterministically by target id, target half, then dragged half", () => {
    const targetSlot = { half: "a", side: "top" } as const;
    const draggedSlot = { half: "a", side: "bottom" } as const;
    const target = matchingTarget(90, targetSlot.half, "a-target");
    const snappedPosition = snapPositionForSlots(
      matchingDragged(0, draggedSlot.half),
      draggedSlot,
      target,
      targetSlot,
    );
    const state: BoardState = {
      dominoes: [
        matchingDragged(0, draggedSlot.half, near(snappedPosition)),
        matchingTarget(90, targetSlot.half, "b-target"),
        target,
      ],
      links: [],
    };

    expect(findSnapCandidate(state, "dragged", { threshold: 0.5 })?.targetDominoId).toBe(
      "a-target",
    );
  });
});

function slotPairCases(): SlotPairCase[] {
  return rotations.flatMap((targetRotation) => {
    const target = matchingTarget(targetRotation, "a");

    return exposedSlots(target).flatMap((targetSlot) =>
      rotations.flatMap((draggedRotation) => {
        if (
          getOrientation(targetRotation) === getOrientation(draggedRotation) &&
          !isLongAxisSide(targetRotation, targetSlot.side)
        ) {
          return [];
        }

        const dragged = matchingDragged(draggedRotation, targetSlot.half);
        const draggedSlot = chooseDraggedSlot(dragged, oppositeSide(targetSlot.side), targetSlot.half);
        const snappedPosition = snapPositionForSlots(dragged, draggedSlot, target, targetSlot);

        return {
          name: `target ${targetRotation} ${targetSlot.half}.${targetSlot.side} from dragged ${draggedRotation} ${draggedSlot.half}.${draggedSlot.side}`,
          targetRotation,
          draggedRotation,
          targetSlot,
          draggedSlot,
          snappedPosition,
        };
      }),
    );
  });
}

function getOrientation(rotation: Rotation): "horizontal" | "vertical" {
  return rotation === 90 || rotation === 270 ? "vertical" : "horizontal";
}

function isLongAxisSide(rotation: Rotation, side: Side): boolean {
  return getOrientation(rotation) === "horizontal"
    ? side === "left" || side === "right"
    : side === "top" || side === "bottom";
}

function matchingTarget(
  rotation: Rotation,
  matchingHalf: DominoHalf,
  id = "target",
  position: Partial<Pick<Domino, "x" | "y">> = {},
): Domino {
  return domino({
    id,
    rotation,
    a: content(matchingHalf === "a" ? "cat_img" : "dog_img", "image"),
    b: content(matchingHalf === "b" ? "cat_img" : "dog_img", "image"),
    ...position,
  });
}

function matchingDragged(
  rotation: Rotation,
  matchingHalf: DominoHalf,
  position: Partial<Pick<Domino, "x" | "y">> = {},
): Domino {
  return domino({
    id: "dragged",
    rotation,
    a: content(matchingHalf === "a" ? "cat_en" : "dog_en"),
    b: content(matchingHalf === "b" ? "cat_en" : "dog_en"),
    ...position,
  });
}

function exposedSlots(candidate: Domino): SlotRef[] {
  return (["a", "b"] as const).flatMap((half) => {
    const dominoBounds = getDominoBounds(candidate);
    const halfBounds = getHalfBounds(candidate, half);

    return sides
      .filter((side) => isExposedSide(halfBounds, dominoBounds, side))
      .map((side) => ({ half, side }));
  });
}

function isExposedSide(half: Rect, dominoBounds: Rect, side: Side): boolean {
  if (side === "left") {
    return half.x === dominoBounds.x;
  }

  if (side === "right") {
    return half.x + half.width === dominoBounds.x + dominoBounds.width;
  }

  if (side === "top") {
    return half.y === dominoBounds.y;
  }

  return half.y + half.height === dominoBounds.y + dominoBounds.height;
}

function chooseDraggedSlot(dragged: Domino, side: Side, preferredHalf: DominoHalf): SlotRef {
  const slots = exposedSlots(dragged).filter((slot) => slot.side === side);
  return slots.find((slot) => slot.half === preferredHalf) ?? slots[0];
}

function snapPositionForSlots(
  dragged: Domino,
  draggedSlot: SlotRef,
  target: Domino,
  targetSlot: SlotRef,
): Point {
  const draggedPoint = slotPoint(dragged, draggedSlot);
  const targetPoint = slotPoint(target, targetSlot);
  const normal = sideNormal(targetSlot.side);

  return roundPoint({
    x: dragged.x + targetPoint.x + normal.x * SNAP_GAP - draggedPoint.x,
    y: dragged.y + targetPoint.y + normal.y * SNAP_GAP - draggedPoint.y,
  });
}

function slotPoint(candidate: Domino, slot: SlotRef): Point {
  return getSideCenter(getHalfBounds(candidate, slot.half), slot.side);
}

function getSideCenter(rect: Rect, side: Side): Point {
  const center = getRectCenter(rect);

  if (side === "left") {
    return { x: rect.x, y: center.y };
  }

  if (side === "right") {
    return { x: rect.x + rect.width, y: center.y };
  }

  if (side === "top") {
    return { x: center.x, y: rect.y };
  }

  return { x: center.x, y: rect.y + rect.height };
}

function sideNormal(side: Side): Point {
  if (side === "left") {
    return { x: -1, y: 0 };
  }

  if (side === "right") {
    return { x: 1, y: 0 };
  }

  if (side === "top") {
    return { x: 0, y: -1 };
  }

  return { x: 0, y: 1 };
}

function oppositeSide(side: Side): Side {
  if (side === "left") {
    return "right";
  }

  if (side === "right") {
    return "left";
  }

  if (side === "top") {
    return "bottom";
  }

  return "top";
}

function near(position: Point): Point {
  return {
    x: position.x + snapProbeOffset.x,
    y: position.y + snapProbeOffset.y,
  };
}

function roundPoint(point: Point): Point {
  return {
    x: Number(point.x.toFixed(6)),
    y: Number(point.y.toFixed(6)),
  };
}
