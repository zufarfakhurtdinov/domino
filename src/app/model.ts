import { HALF_HEIGHT, HALF_WIDTH, SNAP_GAP } from "../core/geometry";
import type { BoardState, Content, Domino, Pair } from "../core/types";

const BOARD_LEFT = 32;
const BOARD_TOP = 32;
const LINKED_DRAGGED_LEFT = BOARD_LEFT + HALF_HEIGHT + SNAP_GAP;
const LINKED_DRAGGED_TOP = BOARD_TOP + (HALF_WIDTH - HALF_HEIGHT) / 2;

export const pairs: Pair[] = [
  { a: "cat_en", b: "cat_img" },
  { a: "dog_en", b: "dog_img" },
  { a: "owl_en", b: "owl_img" },
];

export function createFixtureBoard(fixture: string | null): BoardState {
  if (fixture === "demo" || fixture === null) {
    return {
      dominoes: [
        createDomino("linked-dragged", text("cat_en", "cat (1)"), text("free", "free"), LINKED_DRAGGED_LEFT, LINKED_DRAGGED_TOP, 0),
        createDomino("linked-target", image("cat_img", "cat image (1)"), text("anchor", "anchor"), BOARD_LEFT, BOARD_TOP, 90),
        createDomino("snap-dragged", text("dog_en", "dog (2)"), text("move", "move"), 428, 32, 0),
        createDomino("snap-target", image("dog_img", "dog image (2)"), text("anchor", "anchor"), 824, 32, 90),
        createDomino("rotated-dragged", text("owl_en", "owl (3)"), text("move", "move"), 428, 336, 90),
        createDomino("rotated-target", image("owl_img", "owl image (3)"), text("anchor", "anchor"), 692, 336, 90),
      ],
      links: [{ dominoId1: "linked-dragged", half1: "a", dominoId2: "linked-target", half2: "a" }],
    };
  }

  if (fixture === "basic") {
    return {
      dominoes: [
        createDomino("cat", text("cat_en", "cat (1)"), image("cat_img", "cat image (1)"), BOARD_LEFT, BOARD_TOP, 0),
        createDomino("dog", text("dog_en", "dog (2)"), image("dog_img", "dog image (2)"), 428, 184, 90),
      ],
      links: [],
    };
  }

  if (fixture === "snap") {
    return {
      dominoes: [
        createDomino("dragged", text("cat_en", "cat (1)"), text("free", "free"), 428, 32, 0),
        createDomino("target", image("cat_img", "cat image (1)"), text("anchor", "anchor"), BOARD_LEFT, BOARD_TOP, 90),
      ],
      links: [],
    };
  }

  if (fixture === "snap-rotated") {
    return {
      dominoes: [
        createDomino("dragged", text("cat_en", "cat (1)"), text("free", "free"), 428, 32, 90),
        createDomino("target", image("cat_img", "cat image (1)"), text("anchor", "anchor"), BOARD_LEFT, BOARD_TOP, 90),
      ],
      links: [],
    };
  }

  if (fixture === "linked") {
    return {
      dominoes: [
        createDomino("dragged", text("cat_en", "cat (1)"), text("free", "free"), LINKED_DRAGGED_LEFT, LINKED_DRAGGED_TOP, 0),
        createDomino("target", image("cat_img", "cat image (1)"), text("anchor", "anchor"), BOARD_LEFT, BOARD_TOP, 90),
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
