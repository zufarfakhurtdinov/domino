import {
  getDominoBounds,
  getHalfBounds,
  getHalfLocalBounds,
  getRectCenter,
  HALF_WIDTH,
  rectanglesOverlap,
  SNAP_GAP,
} from "./geometry";
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

        for (const direction of directions) {
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

function candidateForDirection(
  dragged: Domino,
  draggedHalf: DominoHalf,
  target: Domino,
  targetHalf: DominoHalf,
  direction: Point,
): SnapCandidate {
  const draggedLocal = getHalfLocalBounds(dragged.rotation, draggedHalf);
  const targetHalfBounds = getHalfBounds(target, targetHalf);
  const desiredHalfBounds = getDesiredHalfBounds(draggedLocal, targetHalfBounds, direction);
  const snappedPosition = {
    x: desiredHalfBounds.x - draggedLocal.x,
    y: desiredHalfBounds.y - draggedLocal.y,
  };

  return {
    draggedDominoId: dragged.id,
    draggedHalf,
    targetDominoId: target.id,
    targetHalf,
    snappedPosition,
    distance: distanceBetween({ x: dragged.x, y: dragged.y }, snappedPosition),
  };
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
  const snappedDragged = { ...dragged, x: snappedPosition.x, y: snappedPosition.y };
  const bounds = getDominoBounds(snappedDragged);

  return state.dominoes
    .filter((domino) => domino.id !== dragged.id)
    .some((domino) => rectanglesOverlap(bounds, getDominoBounds(domino)));
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
