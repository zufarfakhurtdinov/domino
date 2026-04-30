import type { BoardState, Point } from "./types";

export function getConnectedDominoIds(state: BoardState, dominoId: string): string[] {
  if (!state.dominoes.some((domino) => domino.id === dominoId)) {
    return [];
  }

  const visited = new Set<string>();
  const pending = [dominoId];

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);

    for (const link of state.links) {
      if (link.dominoId1 === current && !visited.has(link.dominoId2)) {
        pending.push(link.dominoId2);
      }

      if (link.dominoId2 === current && !visited.has(link.dominoId1)) {
        pending.push(link.dominoId1);
      }
    }
  }

  return [...visited].sort();
}

export function moveConnectedGroup(
  state: BoardState,
  dominoId: string,
  position: Point,
): BoardState {
  const root = state.dominoes.find((domino) => domino.id === dominoId);
  if (!root) {
    return state;
  }

  const connected = new Set(getConnectedDominoIds(state, dominoId));
  const delta = { x: position.x - root.x, y: position.y - root.y };

  return {
    ...state,
    dominoes: state.dominoes.map((domino) =>
      connected.has(domino.id)
        ? { ...domino, x: domino.x + delta.x, y: domino.y + delta.y }
        : domino,
    ),
  };
}
