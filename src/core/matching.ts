import type { DominoSide, Pair } from "./types";

export function canMatch(left: DominoSide, right: DominoSide, pairs: Pair[]): boolean {
  return pairs.some(
    (pair) =>
      (pair.a === left.key && pair.b === right.key) ||
      (pair.a === right.key && pair.b === left.key),
  );
}
