import { createInitialBoard } from "../src/core/layout";
import { getOccupiedCells } from "../src/core/geometry";
import { content } from "./core.fixtures";

const inputs = [
  { id: "cat", a: content("cat_en"), b: content("cat_img", "image") },
  { id: "dog", a: content("dog_en"), b: content("dog_img", "image") },
  { id: "bird", a: content("bird_en"), b: content("bird_audio", "audio") },
];

describe("initial layout", () => {
  it("creates one domino per input with stable ids and content", () => {
    const state = createInitialBoard(inputs, { columns: 8, rows: 8, seed: 123 });

    expect(state.dominoes.map((domino) => domino.id)).toEqual(["cat", "dog", "bird"]);
    expect(state.dominoes[0].a).toBe(inputs[0].a);
    expect(state.dominoes[0].b).toBe(inputs[0].b);
    expect(state.links).toEqual([]);
  });

  it("uses only horizontal or vertical starting rotations", () => {
    const state = createInitialBoard(inputs, { columns: 8, rows: 8, seed: 123 });

    expect(state.dominoes.every((domino) => domino.rotation === 0 || domino.rotation === 90)).toBe(
      true,
    );
  });

  it("places every occupied cell inside the board bounds", () => {
    const state = createInitialBoard(inputs, { columns: 8, rows: 8, seed: 123 });
    const cells = state.dominoes.flatMap(getOccupiedCells);

    expect(cells.every((cell) => cell.x >= 0 && cell.x < 8 && cell.y >= 0 && cell.y < 8)).toBe(
      true,
    );
  });

  it("does not overlap starting dominoes", () => {
    const state = createInitialBoard(inputs, { columns: 8, rows: 8, seed: 123 });
    const occupied = state.dominoes.flatMap(getOccupiedCells).map((cell) => `${cell.x}:${cell.y}`);

    expect(new Set(occupied).size).toBe(occupied.length);
  });

  it("is deterministic for the same seed", () => {
    const first = createInitialBoard(inputs, { columns: 8, rows: 8, seed: 123 });
    const second = createInitialBoard(inputs, { columns: 8, rows: 8, seed: 123 });

    expect(second).toEqual(first);
  });
});
