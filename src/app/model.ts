import { HALF_HEIGHT, HALF_WIDTH, SNAP_GAP } from "../core/geometry";
import type { BoardState, Domino, DominoSide, Pair } from "../core/types";

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
        createDomino("one-two-a", word("one_1", "one", 1), word("two_1", "two", 2), 64, 68, 0),
        createDomino("two-three", word("two_2", "two", 2), word("three_2", "three", 3), 360, 68, 90),
        createDomino("one-two-b", word("one_3", "one", 1), word("two_3", "two", 2), 580, 68, 0),
        createDomino("four-five", word("four_4", "four", 4), word("five_4", "five", 5), 64, 316, 90),
        createDomino("one-five", word("one_5", "one", 1), word("five_5", "five", 5), 284, 364, 0),
        createDomino("three-seven", word("three_6", "three", 3), word("seven_6", "seven", 7), 720, 316, 90),
        createDomino("style-numbers", text("three_a", "three"), text("four_a", "four"), 960, 68, 0),
        createDomino("style-image", designImage("image_a"), text("two_a", "two"), 960, 216, 0),
        createDomino("style-audio", audio("audio_a"), text("five_a", "five"), 960, 364, 0),
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
  a: DominoSide,
  b: DominoSide,
  x: number,
  y: number,
  rotation: Domino["rotation"],
): Domino {
  return { id, a, b, x, y, rotation };
}

function text(key: string, value: string): DominoSide {
  return { key, content: { type: "text", value } };
}

function word(key: string, value: string, number: number): DominoSide {
  return text(key, `${value} (${number})`);
}

function image(key: string, value: string): DominoSide {
  return { key, content: { type: "text", value } };
}

function designImage(key: string): DominoSide {
  return {
    key,
    content: {
      type: "image",
      url: svgDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 72">
          <rect width="96" height="72" rx="6" fill="#d5ccbb"/>
          <circle cx="22" cy="22" r="7" fill="#eee7d8"/>
          <path d="M12 58h72L60 34 45 48 34 38z" fill="#a89d8a"/>
          <path d="M12 58h72" stroke="#8b806f" stroke-width="4" stroke-linecap="round"/>
        </svg>
      `),
    },
  };
}

function audio(key: string): DominoSide {
  return {
    key,
    content: {
      type: "audio",
      url: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=",
    },
  };
}

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;
}
