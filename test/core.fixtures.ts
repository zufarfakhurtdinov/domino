import type { BoardState, Content, Domino, DominoSide, Rotation } from "../src/core/types";

export function content(key: string, type: Content["type"] = "text"): DominoSide {
  const renderableContent: Content =
    type === "text"
      ? { type: "text", value: key }
      : type === "image"
        ? { type: "image", url: key }
        : { type: "audio", url: key };

  return { key, content: renderableContent };
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
