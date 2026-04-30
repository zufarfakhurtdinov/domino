import { rotateClockwise } from "./geometry";
import type { BoardState } from "./types";

export function rotateDomino(state: BoardState, dominoId: string): BoardState {
  return {
    ...state,
    dominoes: state.dominoes.map((domino) =>
      domino.id === dominoId
        ? { ...domino, rotation: rotateClockwise(domino.rotation) }
        : domino,
    ),
  };
}
