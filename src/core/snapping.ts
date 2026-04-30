import { getDominoCells, getOccupiedCells } from "./geometry";
import { canMatch } from "./matching";
import type { BoardState, Domino, DominoHalf, Pair, Point } from "./types";

export type SnapCandidate = {
  draggedDominoId: string;
  draggedHalf: DominoHalf;
  targetDominoId: string;
  targetHalf: DominoHalf;
  snappedPosition: Point;
  distance: number;
};

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
          const candidate = candidateForDirection(dragged, draggedHalf, target, targetHalf, direction);

          if (candidate.distance > options.threshold) {
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

const halves: DominoHalf[] = ["a", "b"];

function candidateForDirection(
  dragged: Domino,
  draggedHalf: DominoHalf,
  target: Domino,
  targetHalf: DominoHalf,
  direction: Point,
): SnapCandidate {
  const draggedCells = getDominoCells(dragged);
  const targetCells = getDominoCells(target);
  const draggedOffset = {
    x: draggedCells[draggedHalf].x - dragged.x,
    y: draggedCells[draggedHalf].y - dragged.y,
  };
  const desiredDraggedHalfCell = {
    x: targetCells[targetHalf].x + direction.x,
    y: targetCells[targetHalf].y + direction.y,
  };
  const snappedPosition = {
    x: desiredDraggedHalfCell.x - draggedOffset.x,
    y: desiredDraggedHalfCell.y - draggedOffset.y,
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

function collides(state: BoardState, dragged: Domino, snappedPosition: Point): boolean {
  const snappedDragged = { ...dragged, x: snappedPosition.x, y: snappedPosition.y };
  const occupied = new Set(
    state.dominoes
      .filter((domino) => domino.id !== dragged.id)
      .flatMap(getOccupiedCells)
      .map(pointKey),
  );

  return getOccupiedCells(snappedDragged).some((point) => occupied.has(pointKey(point)));
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

function pointKey(point: Point): string {
  return `${point.x}:${point.y}`;
}
