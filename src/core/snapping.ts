import {
  getAxisGap,
  getDominoOrientation,
  getDominoBounds,
  getHalfBounds,
  getRectCenter,
  HALF_WIDTH,
  rectanglesOverlap,
  SNAP_GAP,
} from "./geometry";
import { getConnectedDominoIds } from "./connections";
import { canMatch } from "./matching";
import type { Orientation } from "./geometry";
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
  const occupiedSides = getOccupiedSides(state);
  const draggedPorts = getPorts(dragged, occupiedSides);

  for (const target of state.dominoes) {
    if (target.id === dragged.id) {
      continue;
    }

    const targetPorts = getPorts(target, occupiedSides);

    for (const draggedPort of draggedPorts) {
      for (const targetPort of targetPorts) {
        if (!canConnectPorts(dragged, draggedPort, target, targetPort)) {
          continue;
        }

        if (!canMatch(dragged[draggedPort.half], target[targetPort.half], pairs)) {
          continue;
        }

        const candidate = candidateForPorts(dragged, draggedPort, target, targetPort);

        if (candidate.distance > threshold) {
          continue;
        }

        if (collides(state, dragged, candidate.snappedPosition)) {
          continue;
        }

        candidates.push(candidate);
      }
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
type PortKind = "end" | "side-center";

type JointPort = {
  half: DominoHalf;
  side: Side;
  kind: PortKind;
  point: Point;
  normal: Point;
};

const portSidesByOrientation: Record<
  Orientation,
  { ends: readonly Side[]; sideCenters: readonly Side[] }
> = {
  horizontal: { ends: ["left", "right"], sideCenters: ["top", "bottom"] },
  vertical: { ends: ["top", "bottom"], sideCenters: ["left", "right"] },
};

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

const outerHalves: Record<Side, (a: Rect, b: Rect) => DominoHalf> = {
  left: (a, b) => (a.x <= b.x ? "a" : "b"),
  right: (a, b) => (a.x + a.width >= b.x + b.width ? "a" : "b"),
  top: (a, b) => (a.y <= b.y ? "a" : "b"),
  bottom: (a, b) => (a.y + a.height >= b.y + b.height ? "a" : "b"),
};

function candidateForPorts(
  dragged: Domino,
  draggedPort: JointPort,
  target: Domino,
  targetPort: JointPort,
): SnapCandidate {
  const desiredDraggedPort = {
    x: targetPort.point.x + targetPort.normal.x * SNAP_GAP,
    y: targetPort.point.y + targetPort.normal.y * SNAP_GAP,
  };
  const snappedPosition = roundPoint({
    x: dragged.x + desiredDraggedPort.x - draggedPort.point.x,
    y: dragged.y + desiredDraggedPort.y - draggedPort.point.y,
  });

  return {
    draggedDominoId: dragged.id,
    draggedHalf: draggedPort.half,
    targetDominoId: target.id,
    targetHalf: targetPort.half,
    snappedPosition,
    distance: distanceBetween({ x: dragged.x, y: dragged.y }, snappedPosition),
  };
}

function getPorts(domino: Domino, occupiedSides: ReadonlyMap<string, ReadonlySet<Side>>): JointPort[] {
  const occupied = occupiedSides.get(domino.id) ?? new Set<Side>();
  const bounds = getDominoBounds(domino);
  const sides = portSidesByOrientation[getDominoOrientation(domino)];

  return [
    ...sides.ends.map((side) => createEndPort(domino, side)),
    ...sides.sideCenters.flatMap((side) => createSideCenterPorts(domino, side, bounds)),
  ].filter((port) => !occupied.has(port.side));
}

function createEndPort(domino: Domino, side: Side): JointPort {
  const half = getOuterHalf(domino, side);
  const halfBounds = getHalfBounds(domino, half);
  return {
    half,
    side,
    kind: "end",
    point: getSideCenter(halfBounds, side),
    normal: getSideNormal(side),
  };
}

function createSideCenterPorts(domino: Domino, side: Side, bounds: Rect): JointPort[] {
  return (["a", "b"] as const).map((half) => ({
    half,
    side,
    kind: "side-center" as const,
    point: getSideCenter(bounds, side),
    normal: getSideNormal(side),
  }));
}

function getOuterHalf(domino: Domino, side: Side): DominoHalf {
  const a = getHalfBounds(domino, "a");
  const b = getHalfBounds(domino, "b");
  return outerHalves[side](a, b);
}

function canConnectPorts(
  dragged: Domino,
  draggedPort: JointPort,
  target: Domino,
  targetPort: JointPort,
): boolean {
  if (draggedPort.side !== oppositeSide(targetPort.side)) {
    return false;
  }

  return arePerpendicular(dragged, target)
    ? isHorizontalEndToVerticalSide(dragged, draggedPort, target, targetPort)
    : draggedPort.kind === "end" && targetPort.kind === "end";
}

function isHorizontalEndToVerticalSide(
  first: Domino,
  firstPort: JointPort,
  second: Domino,
  secondPort: JointPort,
): boolean {
  return getDominoOrientation(first) === "vertical"
    ? firstPort.kind === "side-center" && secondPort.kind === "end"
    : firstPort.kind === "end" && secondPort.kind === "side-center";
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

function arePerpendicular(left: Domino, right: Domino): boolean {
  return getDominoOrientation(left) !== getDominoOrientation(right);
}

function getOccupiedSides(state: BoardState): Map<string, Set<Side>> {
  const occupied = new Map<string, Set<Side>>();

  for (const link of state.links) {
    const first = state.dominoes.find((domino) => domino.id === link.dominoId1);
    const second = state.dominoes.find((domino) => domino.id === link.dominoId2);
    if (!first || !second) {
      continue;
    }

    const firstBounds = arePerpendicular(first, second)
      ? getDominoBounds(first)
      : getHalfBounds(first, link.half1);
    const secondBounds = arePerpendicular(first, second)
      ? getDominoBounds(second)
      : getHalfBounds(second, link.half2);
    const sides = getTouchingSides(firstBounds, secondBounds);
    if (!sides) {
      continue;
    }

    addOccupiedSide(occupied, first.id, sides.first);
    addOccupiedSide(occupied, second.id, sides.second);
  }

  return occupied;
}

function getTouchingSides(first: Rect, second: Rect): { first: Side; second: Side } | null {
  const horizontalGap = getAxisGap(first.x, first.width, second.x, second.width);
  const verticalGap = getAxisGap(first.y, first.height, second.y, second.height);

  if (horizontalGap > verticalGap) {
    return first.x <= second.x
      ? { first: "right", second: "left" }
      : { first: "left", second: "right" };
  }

  if (verticalGap > horizontalGap) {
    return first.y <= second.y
      ? { first: "bottom", second: "top" }
      : { first: "top", second: "bottom" };
  }

  return null;
}

function addOccupiedSide(occupied: Map<string, Set<Side>>, dominoId: string, side: Side): void {
  const sides = occupied.get(dominoId) ?? new Set<Side>();
  sides.add(side);
  occupied.set(dominoId, sides);
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
