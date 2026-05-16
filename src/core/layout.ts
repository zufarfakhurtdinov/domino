import { getDominoBounds, getRotationSize, rectanglesOverlap, HALF_HEIGHT, HALF_WIDTH } from "./geometry";
import type { BoardState, Content, Domino, Rect, Rotation } from "./types";

export type DominoInput = {
  id: string;
  a: Content;
  b: Content;
};

export type LayoutOptions = {
  width: number;
  height: number;
  seed: number;
};

export function createInitialBoard(inputs: DominoInput[], options: LayoutOptions): BoardState {
  const random = seededRandom(options.seed);
  const dominoes: Domino[] = [];
  const occupied: Rect[] = [];

  for (const input of inputs) {
    const domino = placeDomino(input, options, random, occupied);
    dominoes.push(domino);

    occupied.push(getDominoBounds(domino));
  }

  return { dominoes, links: [] };
}

function placeDomino(
  input: DominoInput,
  options: LayoutOptions,
  random: () => number,
  occupied: readonly Rect[],
): Domino {
  const maxAttempts = Math.ceil((options.width * options.height) / (HALF_WIDTH * HALF_HEIGHT)) * 8;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const rotation: Rotation = random() < 0.5 ? 0 : 90;
    const size = getRotationSize(rotation);
    const maxX = options.width - size.width;
    const maxY = options.height - size.height;

    if (maxX < 0 || maxY < 0) {
      break;
    }

    const domino: Domino = {
      ...input,
      x: randomInt(random, maxX + 1),
      y: randomInt(random, maxY + 1),
      rotation,
    };

    if (occupied.every((rect) => !rectanglesOverlap(rect, getDominoBounds(domino)))) {
      return domino;
    }
  }

  throw new Error("Unable to place all dominoes without overlap");
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randomInt(random: () => number, exclusiveMax: number): number {
  return Math.floor(random() * exclusiveMax);
}
