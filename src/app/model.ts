import type { BoardState, Content, Domino, Pair } from "../core/types";

export const pairs: Pair[] = [
  { a: "cat_en", b: "cat_img" },
  { a: "dog_en", b: "dog_img" },
  { a: "owl_en", b: "owl_img" },
];

export function createFixtureBoard(fixture: string | null): BoardState {
  if (fixture === "demo" || fixture === null) {
    return {
      dominoes: [
        createDomino("linked-dragged", text("cat_en", "cat"), text("free", "free"), 1, 0, 0),
        createDomino("linked-target", image("cat_img", "cat image"), text("anchor", "anchor"), 0, 0, 90),
        createDomino("snap-dragged", text("dog_en", "dog"), text("move", "move"), 4, 1, 0),
        createDomino("snap-target", image("dog_img", "dog image"), text("anchor", "anchor"), 7, 1, 90),
        createDomino("rotated-dragged", text("owl_en", "owl"), text("move", "move"), 1, 4, 90),
        createDomino("rotated-target", image("owl_img", "owl image"), text("anchor", "anchor"), 4, 4, 90),
      ],
      links: [{ dominoId1: "linked-dragged", half1: "a", dominoId2: "linked-target", half2: "a" }],
    };
  }

  if (fixture === "basic") {
    return {
      dominoes: [
        createDomino("cat", text("cat_en", "cat"), image("cat_img", "cat image"), 0, 0, 0),
        createDomino("dog", text("dog_en", "dog"), image("dog_img", "dog image"), 3, 2, 90),
      ],
      links: [],
    };
  }

  if (fixture === "snap") {
    return {
      dominoes: [
        createDomino("dragged", text("cat_en", "cat"), text("free", "free"), 3, 0, 0),
        createDomino("target", image("cat_img", "cat image"), text("anchor", "anchor"), 0, 0, 90),
      ],
      links: [],
    };
  }

  if (fixture === "snap-rotated") {
    return {
      dominoes: [
        createDomino("dragged", text("cat_en", "cat"), text("free", "free"), 3, 0, 90),
        createDomino("target", image("cat_img", "cat image"), text("anchor", "anchor"), 0, 0, 90),
      ],
      links: [],
    };
  }

  if (fixture === "linked") {
    return {
      dominoes: [
        createDomino("dragged", text("cat_en", "cat"), text("free", "free"), 1, 0, 0),
        createDomino("target", image("cat_img", "cat image"), text("anchor", "anchor"), 0, 0, 90),
      ],
      links: [{ dominoId1: "dragged", half1: "a", dominoId2: "target", half2: "a" }],
    };
  }

  return createFixtureBoard("demo");
}

function createDomino(
  id: string,
  a: Content,
  b: Content,
  x: number,
  y: number,
  rotation: Domino["rotation"],
): Domino {
  return { id, a, b, x, y, rotation };
}

function text(key: string, value: string): Content {
  return { kind: "text", key, value };
}

function image(key: string, value: string): Content {
  return { kind: "image", key, value };
}
