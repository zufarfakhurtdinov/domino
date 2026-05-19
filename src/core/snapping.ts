import {
  getDominoBounds,
  getHalfBounds,
  getRectCenter,
  HALF_WIDTH,
  rectanglesOverlap,
  SNAP_GAP,
} from "./geometry";
import { getConnectedDominoIds } from "./connections";
import { canMatch } from "./matching";
import type { BoardState, Domino, DominoHalf, Link, Pair, Point, Rect, SnapCandidate } from "./types";

export type SnapOptions = {
  threshold: number;
};

export function findSnapCandidate(
  state: BoardState,
  draggedDominoId: string,
  pairs: Pair[],
  options: SnapOptions,
): SnapCandidate | null {
  const dragged = state.dominoes.find((domino) => domino.id === draggedDominoId);
  if (!dragged) {
    return null;
  }

  const candidates: SnapCandidate[] = [];
  const threshold = options.threshold * HALF_WIDTH;
  const occupiedHalves = getOccupiedHalves(state);
  const draggedGroup = new Set(getConnectedDominoIds(state, dragged.id));

  for (const target of state.dominoes) {
    if (draggedGroup.has(target.id)) {
      continue;
    }

    for (const joint of getJointCandidates(dragged, target, occupiedHalves)) {
      if (!canMatch(dragged[joint.dragged.half], target[joint.target.half], pairs)) {
        continue;
      }

      const candidate = candidateForJoint(dragged, joint, target);

      if (candidate.distance > threshold) {
        continue;
      }

      if (collides(state, dragged, candidate.snappedPosition)) {
        continue;
      }

      candidates.push(candidate);
    }
  }

  return candidates.sort(compareCandidates)[0] ?? null;
}

export function applySnap(state: BoardState, candidate: SnapCandidate): BoardState {
  const nextLink: Link = {
    dominoId1: candidate.draggedDominoId,
    half1: candidate.draggedHalf,
    dominoId2: candidate.targetDominoId,
    half2: candidate.targetHalf,
  };
  const links = hasLink(state.links, nextLink) ? state.links : [...state.links, nextLink];

  return {
    ...state,
    dominoes: state.dominoes.map((domino) =>
      domino.id === candidate.draggedDominoId
        ? { ...domino, x: candidate.snappedPosition.x, y: candidate.snappedPosition.y }
        : domino,
    ),
    links,
  };
}

type Side = "top" | "right" | "bottom" | "left";

type Slot = {
  half: DominoHalf;
  side: Side;
  point: Point;
  normal: Point;
};

type SnapJoint = {
  dragged: Slot;
  target: Slot;
};

const halves = ["a", "b"] as const;
const sides = ["top", "right", "bottom", "left"] as const;

const sideNormals: Record<Side, Point> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
};

const oppositeSides: Record<Side, Side> = {
  left: "right",
  right: "left",
  top: "bottom",
  bottom: "top",
};

const sideCenters: Record<Side, (rect: Rect, center: Point) => Point> = {
  left: (rect, center) => ({ x: rect.x, y: center.y }),
  right: (rect, center) => ({ x: rect.x + rect.width, y: center.y }),
  top: (rect, center) => ({ x: center.x, y: rect.y }),
  bottom: (rect, center) => ({ x: center.x, y: rect.y + rect.height }),
};

function candidateForJoint(
  dragged: Domino,
  joint: SnapJoint,
  target: Domino,
): SnapCandidate {
  const desiredDraggedPort = {
    x: joint.target.point.x + joint.target.normal.x * SNAP_GAP,
    y: joint.target.point.y + joint.target.normal.y * SNAP_GAP,
  };
  const snappedPosition = roundPoint({
    x: dragged.x + desiredDraggedPort.x - joint.dragged.point.x,
    y: dragged.y + desiredDraggedPort.y - joint.dragged.point.y,
  });

  return {
    draggedDominoId: dragged.id,
    draggedHalf: joint.dragged.half,
    targetDominoId: target.id,
    targetHalf: joint.target.half,
    snappedPosition,
    distance: distanceBetween({ x: dragged.x, y: dragged.y }, snappedPosition),
  };
}

function getJointCandidates(
  dragged: Domino,
  target: Domino,
  occupiedHalves: ReadonlyMap<string, ReadonlySet<DominoHalf>>,
): SnapJoint[] {
  const draggedSlots = getSlots(dragged, occupiedHalves);
  const targetSlots = getSlots(target, occupiedHalves);
  const joints: SnapJoint[] = [];

  for (const draggedSlot of draggedSlots) {
    for (const targetSlot of targetSlots) {
      if (canConnectSlots(dragged, draggedSlot, target, targetSlot)) {
        joints.push({ dragged: draggedSlot, target: targetSlot });
      }
    }
  }

  return joints;
}

function getSlots(domino: Domino, occupiedHalves: ReadonlyMap<string, ReadonlySet<DominoHalf>>): Slot[] {
  const occupied = occupiedHalves.get(domino.id) ?? new Set<DominoHalf>();
  const dominoBounds = getDominoBounds(domino);

  return halves.flatMap((half) => {
    if (occupied.has(half)) {
      return [];
    }

    const halfBounds = getHalfBounds(domino, half);

    return sides
      .filter((side) => isExposedSide(halfBounds, dominoBounds, side))
      .map((side) => ({
        half,
        side,
        point: getSideCenter(halfBounds, side),
        normal: getSideNormal(side),
      }));
  });
}

function isExposedSide(half: Rect, domino: Rect, side: Side): boolean {
  if (side === "left") {
    return half.x === domino.x;
  }

  if (side === "right") {
    return half.x + half.width === domino.x + domino.width;
  }

  if (side === "top") {
    return half.y === domino.y;
  }

  return half.y + half.height === domino.y + domino.height;
}

function canConnectSlots(
  dragged: Domino,
  draggedSlot: Slot,
  target: Domino,
  targetSlot: Slot,
): boolean {
  if (draggedSlot.side !== oppositeSide(targetSlot.side)) {
    return false;
  }

  if (getOrientation(dragged) !== getOrientation(target)) {
    return true;
  }

  return isLongAxisSide(dragged, draggedSlot.side) && isLongAxisSide(target, targetSlot.side);
}

function getOrientation(domino: Domino): "horizontal" | "vertical" {
  return getDominoBounds(domino).width > getDominoBounds(domino).height ? "horizontal" : "vertical";
}

function isLongAxisSide(domino: Domino, side: Side): boolean {
  return getOrientation(domino) === "horizontal"
    ? side === "left" || side === "right"
    : side === "top" || side === "bottom";
}

function roundPoint(point: Point): Point {
  return {
    x: Number(point.x.toFixed(6)),
    y: Number(point.y.toFixed(6)),
  };
}

function getSideCenter(rect: Rect, side: Side): Point {
  return sideCenters[side](rect, getRectCenter(rect));
}

function getSideNormal(side: Side): Point {
  return sideNormals[side];
}

function oppositeSide(side: Side): Side {
  return oppositeSides[side];
}

function getOccupiedHalves(state: BoardState): Map<string, Set<DominoHalf>> {
  const occupied = new Map<string, Set<DominoHalf>>();

  for (const link of state.links) {
    addOccupiedHalf(occupied, link.dominoId1, link.half1);
    addOccupiedHalf(occupied, link.dominoId2, link.half2);
  }

  return occupied;
}

function addOccupiedHalf(
  occupied: Map<string, Set<DominoHalf>>,
  dominoId: string,
  half: DominoHalf,
): void {
  const halves = occupied.get(dominoId) ?? new Set<DominoHalf>();
  halves.add(half);
  occupied.set(dominoId, halves);
}

function collides(state: BoardState, dragged: Domino, snappedPosition: Point): boolean {
  const connected = new Set(getConnectedDominoIds(state, dragged.id));
  const delta = {
    x: snappedPosition.x - dragged.x,
    y: snappedPosition.y - dragged.y,
  };
  const movedGroupBounds = state.dominoes
    .filter((domino) => connected.has(domino.id))
    .map((domino) => getDominoBounds({ ...domino, x: domino.x + delta.x, y: domino.y + delta.y }));
  const externalBounds = state.dominoes
    .filter((domino) => !connected.has(domino.id))
    .map((domino) => getDominoBounds(domino));

  return movedGroupBounds.some((groupBounds) =>
    externalBounds.some((external) => rectanglesOverlap(groupBounds, external)),
  );
}

function distanceBetween(left: Point, right: Point): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function compareCandidates(left: SnapCandidate, right: SnapCandidate): number {
  return (
    left.distance - right.distance ||
    left.targetDominoId.localeCompare(right.targetDominoId) ||
    left.targetHalf.localeCompare(right.targetHalf) ||
    left.draggedHalf.localeCompare(right.draggedHalf)
  );
}

function hasLink(links: readonly Link[], target: Link): boolean {
  return links.some(
    (link) =>
      link.dominoId1 === target.dominoId1 &&
      link.half1 === target.half1 &&
      link.dominoId2 === target.dominoId2 &&
      link.half2 === target.half2,
  );
}
