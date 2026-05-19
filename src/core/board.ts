import { getConnectedDominoIds } from "./connections";
import { getDominoBounds, getRectCenter, getRotationSize, rotateClockwise } from "./geometry";
import type { BoardState, Domino, Point } from "./types";

export function rotateDomino(
  state: BoardState,
  dominoId: string,
  pivotOverride?: Point,
): BoardState {
  const current = state.dominoes.find((domino) => domino.id === dominoId);
  if (!current) {
    return state;
  }

  const connected = new Set(getConnectedDominoIds(state, dominoId));
  const pivot = pivotOverride ?? getRectCenter(getDominoBounds(current));

  return {
    ...state,
    dominoes: state.dominoes.map((domino) =>
      connected.has(domino.id)
        ? rotateAroundPivot(domino, pivot)
        : domino,
    ),
  };
}

function rotateAroundPivot(domino: Domino, pivot: Point): Domino {
  const center = getRectCenter(getDominoBounds(domino));
  const nextRotation = rotateClockwise(domino.rotation);
  const nextSize = getRotationSize(nextRotation);
  const nextCenter = {
    x: pivot.x - (center.y - pivot.y),
    y: pivot.y + (center.x - pivot.x),
  };

  return {
    ...domino,
    x: nextCenter.x - nextSize.width / 2,
    y: nextCenter.y - nextSize.height / 2,
    rotation: nextRotation,
  };
}

export function moveDomino(state: BoardState, dominoId: string, position: Point): BoardState {
  if (!state.dominoes.some((domino) => domino.id === dominoId)) {
    return state;
  }

  return {
    ...state,
    dominoes: state.dominoes.map((domino) =>
      domino.id === dominoId ? { ...domino, x: position.x, y: position.y } : domino,
    ),
  };
}

export function detachDomino(state: BoardState, dominoId: string): BoardState {
  const links = state.links.filter(
    (link) => link.dominoId1 !== dominoId && link.dominoId2 !== dominoId,
  );

  if (links.length === state.links.length) {
    return state;
  }

  return { ...state, links };
}
