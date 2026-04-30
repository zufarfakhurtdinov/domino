import { getOccupiedCells } from "./geometry";
import type { BoardState, Content, Domino, Point, Rotation } from "./types";

export type DominoInput = {
  id: string;
  a: Content;
  b: Content;
};

export type LayoutOptions = {
  columns: number;
  rows: number;
  seed: number;
};

export function createInitialBoard(inputs: DominoInput[], options: LayoutOptions): BoardState {
  const random = seededRandom(options.seed);
  const dominoes: Domino[] = [];
  const occupied = new Set<string>();

  for (const input of inputs) {
    const domino = placeDomino(input, options, random, occupied);
    dominoes.push(domino);

    for (const cell of getOccupiedCells(domino)) {
      occupied.add(pointKey(cell));
    }
  }

  return { dominoes, links: [] };
}

function placeDomino(
  input: DominoInput,
  options: LayoutOptions,
  random: () => number,
  occupied: Set<string>,
): Domino {
  const maxAttempts = options.columns * options.rows * 8;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const rotation: Rotation = random() < 0.5 ? 0 : 90;
    const maxX = rotation === 0 ? options.columns - 2 : options.columns - 1;
    const maxY = rotation === 0 ? options.rows - 1 : options.rows - 2;

    if (maxX < 0 || maxY < 0) {
      break;
    }

    const domino: Domino = {
      ...input,
      x: randomInt(random, maxX + 1),
      y: randomInt(random, maxY + 1),
      rotation,
    };

    if (getOccupiedCells(domino).every((cell) => !occupied.has(pointKey(cell)))) {
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

function pointKey(point: Point): string {
  return `${point.x}:${point.y}`;
}
