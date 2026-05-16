import { createInitialBoard } from "../src/core/layout";
import {
  getDominoBounds,
  HALF_HEIGHT,
  HALF_WIDTH,
  rectanglesOverlap,
} from "../src/core/geometry";
import { content } from "./core.fixtures";

const inputs = [
  { id: "cat", a: content("cat_en"), b: content("cat_img", "image") },
  { id: "dog", a: content("dog_en"), b: content("dog_img", "image") },
  { id: "bird", a: content("bird_en"), b: content("bird_audio", "audio") },
];
const layoutOptions = { width: 8 * HALF_WIDTH, height: 8 * HALF_HEIGHT, seed: 123 };

describe("initial layout", () => {
  it("creates one domino per input with stable ids and content", () => {
    const state = createInitialBoard(inputs, layoutOptions);

    expect(state.dominoes.map((domino) => domino.id)).toEqual(["cat", "dog", "bird"]);
    expect(state.dominoes[0].a).toBe(inputs[0].a);
    expect(state.dominoes[0].b).toBe(inputs[0].b);
    expect(state.links).toEqual([]);
  });

  it("uses only horizontal or vertical starting rotations", () => {
    const state = createInitialBoard(inputs, layoutOptions);

    expect(state.dominoes.every((domino) => domino.rotation === 0 || domino.rotation === 90)).toBe(
      true,
    );
  });

  it("places every domino inside the board bounds", () => {
    const state = createInitialBoard(inputs, layoutOptions);
    const bounds = state.dominoes.map(getDominoBounds);

    expect(
      bounds.every(
        (rect) =>
          rect.x >= 0 &&
          rect.y >= 0 &&
          rect.x + rect.width <= layoutOptions.width &&
          rect.y + rect.height <= layoutOptions.height,
      ),
    ).toBe(true);
  });

  it("does not overlap starting dominoes", () => {
    const state = createInitialBoard(inputs, layoutOptions);
    const bounds = state.dominoes.map(getDominoBounds);

    expect(
      bounds.every((rect, index) =>
        bounds.slice(index + 1).every((other) => !rectanglesOverlap(rect, other)),
      ),
    ).toBe(true);
  });

  it("is deterministic for the same seed", () => {
    const first = createInitialBoard(inputs, layoutOptions);
    const second = createInitialBoard(inputs, layoutOptions);

    expect(second).toEqual(first);
  });
});
