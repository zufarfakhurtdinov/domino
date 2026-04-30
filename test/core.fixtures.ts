import type { BoardState, Content, Domino, Rotation } from "../src/core/types";

export function content(key: string, kind: Content["kind"] = "text"): Content {
  return { kind, key, value: key };
}

export function domino(overrides: Partial<Domino> = {}): Domino {
  return {
    id: "d1",
    a: content("a"),
    b: content("b"),
    x: 0,
    y: 0,
    rotation: 0 as Rotation,
    ...overrides,
  };
}

export function board(dominoes: Domino[]): BoardState {
  return { dominoes, links: [] };
}
