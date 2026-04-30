import { rotateClockwise } from "./geometry";
import type { BoardState, Point } from "./types";

export function rotateDomino(state: BoardState, dominoId: string): BoardState {
  if (!state.dominoes.some((domino) => domino.id === dominoId)) {
    return state;
  }

  return {
    ...detachDomino(state, dominoId),
    dominoes: state.dominoes.map((domino) =>
      domino.id === dominoId
        ? { ...domino, rotation: rotateClockwise(domino.rotation) }
        : domino,
    ),
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
