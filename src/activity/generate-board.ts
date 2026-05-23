import { DOMINO_HEIGHT, DOMINO_WIDTH, HALF_HEIGHT } from "../core/geometry";
import type { BoardState, Content, Domino, Pair, Rotation } from "../core/types";
import type { GenerationSeed, LoadedActivity, LoadedPair } from "./types";
import { createSeededRandom, shuffleWithRandom } from "./random";

export type GeneratedActivityBoard = {
  state: BoardState;
  pairs: Pair[];
};

type PairOccurrenceTracker = Map<number, 0 | 1 | 2>;

const SLOT_GAP = 28;

export function generateBoardFromActivity(activity: LoadedActivity, seed: GenerationSeed): GeneratedActivityBoard {
  const orderedPairs = shuffleWithRandom(activity.pairs, createSeededRandom(seed.domino));
  const occurrences: PairOccurrenceTracker = new Map();
  const rotations = createRotations(activity.pairs.length, seed.rotation);
  const slots = createSlots(activity.pairs.length, seed.layout);

  return {
    state: {
      dominoes: orderedPairs.map((pair, index) =>
        createDomino(pair, orderedPairs[(index + 1) % orderedPairs.length], index, occurrences, slots[index], rotations[index]),
      ),
      links: [],
    },
    pairs: activity.pairs.map((pair) => {
      const key = String(pair.id);
      return { a: key, b: key };
    }),
  };
}

function createDomino(
  left: LoadedPair,
  right: LoadedPair,
  index: number,
  occurrences: PairOccurrenceTracker,
  position: { x: number; y: number },
  rotation: Rotation,
): Domino {
  return {
    id: `activity-${index + 1}`,
    a: {
      key: String(left.id),
      content: nextContent(left, occurrences),
    },
    b: {
      key: String(right.id),
      content: nextContent(right, occurrences),
    },
    x: position.x,
    y: position.y,
    rotation,
  };
}

function nextContent(pair: LoadedPair, occurrences: PairOccurrenceTracker): Content {
  const occurrence = occurrences.get(pair.id) ?? 0;

  if (occurrence >= 2) {
    throw new Error(`Pair ${pair.id} appears too many times.`);
  }

  occurrences.set(pair.id, (occurrence + 1) as 1 | 2);
  return occurrence === 0 ? pair.items[0] : pair.items[1];
}

function createRotations(count: number, seed: string): Rotation[] {
  const random = createSeededRandom(seed);

  return Array.from({ length: count }, () => (random() < 0.5 ? 0 : 90));
}

function createSlots(count: number, seed: string): Array<{ x: number; y: number }> {
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.max(1, Math.ceil(count / columns));
  const slots: Array<{ x: number; y: number }> = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      slots.push({
        x: SLOT_GAP + column * (DOMINO_WIDTH + SLOT_GAP),
        y: SLOT_GAP + row * (DOMINO_HEIGHT + HALF_HEIGHT + SLOT_GAP),
      });
    }
  }

  return shuffleWithRandom(slots, createSeededRandom(seed)).slice(0, count);
}
