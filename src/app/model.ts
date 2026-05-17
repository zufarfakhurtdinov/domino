import { HALF_HEIGHT, HALF_WIDTH, SNAP_GAP } from "../core/geometry";
import type { BoardState, Content, Domino, Pair } from "../core/types";

const BOARD_LEFT = 32;
const BOARD_TOP = 32;
const LINKED_DRAGGED_LEFT = BOARD_LEFT + HALF_HEIGHT + SNAP_GAP;
const LINKED_DRAGGED_TOP = BOARD_TOP + HALF_WIDTH / 2;

export const pairs: Pair[] = [
  { a: "cat_en", b: "cat_img" },
  { a: "dog_en", b: "dog_img" },
  { a: "owl_en", b: "owl_img" },
  { a: "one_1", b: "one_3" },
  { a: "one_1", b: "one_5" },
  { a: "one_3", b: "one_5" },
  { a: "two_1", b: "two_2" },
  { a: "two_1", b: "two_3" },
  { a: "two_2", b: "two_3" },
  { a: "three_2", b: "three_6" },
  { a: "five_4", b: "five_5" },
];

export function createFixtureBoard(fixture: string | null): BoardState {
  if (fixture === "demo" || fixture === null) {
    return {
      dominoes: [
        createDomino("one-two-a", word("one_1", "one", 1), word("two_1", "two", 2), BOARD_LEFT, BOARD_TOP, 0),
        createDomino("two-three", word("two_2", "two", 2), word("three_2", "three", 3), 312, BOARD_TOP, 90),
        createDomino("one-two-b", word("one_3", "one", 1), word("two_3", "two", 2), 512, BOARD_TOP, 0),
        createDomino("four-five", word("four_4", "four", 4), word("five_4", "five", 5), BOARD_LEFT, 284, 90),
        createDomino("one-five", word("one_5", "one", 1), word("five_5", "five", 5), 232, 284, 0),
        createDomino("three-seven", word("three_6", "three", 3), word("seven_6", "seven", 7), 640, 284, 90),
      ],
      links: [],
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

function word(key: string, value: string, number: number): Content {
  return text(key, `${value} (${number})`);
}

function image(key: string, value: string): Content {
  return { kind: "image", key, value };
}
