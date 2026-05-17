import {
  getDominoBounds,
  getHalfBounds,
  getHalfLocalBounds,
  getRectCenter,
  getRotationSize,
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

const directions: Point[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

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

  for (const target of state.dominoes) {
    if (target.id === dragged.id) {
      continue;
    }

    for (const draggedHalf of halves) {
      for (const targetHalf of halves) {
        if (!canMatch(dragged[draggedHalf], target[targetHalf], pairs)) {
          continue;
        }

        for (const direction of getCandidateDirections(dragged, target)) {
          const candidate = candidateForDirection(
            dragged,
            draggedHalf,
            target,
            targetHalf,
            direction,
          );

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

const halves: DominoHalf[] = ["a", "b"];

function getCandidateDirections(dragged: Domino, target: Domino): readonly Point[] {
  if (arePerpendicular(dragged, target)) {
    return isVertical(target)
      ? horizontalDirections
      : verticalDirections;
  }

  return isVertical(target)
    ? verticalDirections
    : horizontalDirections;
}

const horizontalDirections: Point[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
];

const verticalDirections: Point[] = [
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

function candidateForDirection(
  dragged: Domino,
  draggedHalf: DominoHalf,
  target: Domino,
  targetHalf: DominoHalf,
  direction: Point,
): SnapCandidate {
  const snappedPosition = arePerpendicular(dragged, target)
    ? getPerpendicularSnappedPosition(dragged, target, direction)
    : getHalfSnappedPosition(dragged, draggedHalf, target, targetHalf, direction);

  return {
    draggedDominoId: dragged.id,
    draggedHalf,
    targetDominoId: target.id,
    targetHalf,
    snappedPosition,
    distance: distanceBetween({ x: dragged.x, y: dragged.y }, snappedPosition),
  };
}

function getHalfSnappedPosition(
  dragged: Domino,
  draggedHalf: DominoHalf,
  target: Domino,
  targetHalf: DominoHalf,
  direction: Point,
): Point {
  const draggedLocal = getHalfLocalBounds(dragged.rotation, draggedHalf);
  const targetHalfBounds = getHalfBounds(target, targetHalf);
  const desiredHalfBounds = getDesiredHalfBounds(draggedLocal, targetHalfBounds, direction);

  return {
    x: desiredHalfBounds.x - draggedLocal.x,
    y: desiredHalfBounds.y - draggedLocal.y,
  };
}

function getPerpendicularSnappedPosition(
  dragged: Domino,
  target: Domino,
  direction: Point,
): Point {
  const draggedSize = getRotationSize(dragged.rotation);
  const targetBounds = getDominoBounds(target);
  const targetCenter = getRectCenter(targetBounds);

  if (direction.x === 1) {
    return {
      x: targetBounds.x + targetBounds.width + SNAP_GAP,
      y: targetCenter.y - draggedSize.height / 2,
    };
  }

  if (direction.x === -1) {
    return {
      x: targetBounds.x - SNAP_GAP - draggedSize.width,
      y: targetCenter.y - draggedSize.height / 2,
    };
  }

  if (direction.y === 1) {
    return {
      x: targetCenter.x - draggedSize.width / 2,
      y: targetBounds.y + targetBounds.height + SNAP_GAP,
    };
  }

  return {
    x: targetCenter.x - draggedSize.width / 2,
    y: targetBounds.y - SNAP_GAP - draggedSize.height,
  };
}

function arePerpendicular(left: Domino, right: Domino): boolean {
  return isVertical(left) !== isVertical(right);
}

function isVertical(domino: Domino): boolean {
  return domino.rotation === 90 || domino.rotation === 270;
}

function getDesiredHalfBounds(draggedLocal: Rect, targetHalfBounds: Rect, direction: Point): Rect {
  if (direction.x === 1) {
    return {
      x: targetHalfBounds.x + targetHalfBounds.width + SNAP_GAP,
      y: getRectCenter(targetHalfBounds).y - draggedLocal.height / 2,
      width: draggedLocal.width,
      height: draggedLocal.height,
    };
  }

  if (direction.x === -1) {
    return {
      x: targetHalfBounds.x - SNAP_GAP - draggedLocal.width,
      y: getRectCenter(targetHalfBounds).y - draggedLocal.height / 2,
      width: draggedLocal.width,
      height: draggedLocal.height,
    };
  }

  if (direction.y === 1) {
    return {
      x: getRectCenter(targetHalfBounds).x - draggedLocal.width / 2,
      y: targetHalfBounds.y + targetHalfBounds.height + SNAP_GAP,
      width: draggedLocal.width,
      height: draggedLocal.height,
    };
  }

  return {
    x: getRectCenter(targetHalfBounds).x - draggedLocal.width / 2,
    y: targetHalfBounds.y - SNAP_GAP - draggedLocal.height,
    width: draggedLocal.width,
    height: draggedLocal.height,
  };
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
