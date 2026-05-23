import { generateBoardFromActivity } from "../src/activity/generate-board";
import type { LoadedActivity, GenerationSeed } from "../src/activity/types";

const activity: LoadedActivity = {
  title: "activity",
  pairs: [
    { id: 1, items: [{ type: "text", value: "one" }, { type: "image", url: "blob:one" }] },
    { id: 2, items: [{ type: "text", value: "two" }, { type: "audio", url: "blob:two" }] },
    { id: 3, items: [{ type: "text", value: "three" }, { type: "image", url: "blob:three" }] },
    { id: 4, items: [{ type: "text", value: "four" }, { type: "audio", url: "blob:four" }] },
  ],
};

const seed: GenerationSeed = { domino: "1", layout: "1", rotation: "1" };

describe("activity board generator", () => {
  it("creates a reproducible board and matching pairs from activity pairs", () => {
    const first = generateBoardFromActivity(activity, seed);
    const second = generateBoardFromActivity(activity, seed);

    expect(first).toEqual(second);
    expect(first.state.dominoes).toHaveLength(activity.pairs.length);
    expect(first.pairs).toEqual([
      { a: "1", b: "1" },
      { a: "2", b: "2" },
      { a: "3", b: "3" },
      { a: "4", b: "4" },
    ]);
  });

  it("uses each pair id exactly twice and each content item once", () => {
    const generated = generateBoardFromActivity(activity, seed);
    const sides = generated.state.dominoes.flatMap((domino) => [domino.a, domino.b]);

    expect(countBy(sides.map((side) => side.key))).toEqual({ "1": 2, "2": 2, "3": 2, "4": 2 });
    expect(sides.filter((side) => side.key === "1").map((side) => side.content)).toEqual([
      { type: "text", value: "one" },
      { type: "image", url: "blob:one" },
    ]);
  });

  it("changes only positions when the layout seed changes", () => {
    const first = generateBoardFromActivity(activity, seed);
    const second = generateBoardFromActivity(activity, { ...seed, layout: "2" });

    expect(first.state.dominoes.map(withoutPosition)).toEqual(second.state.dominoes.map(withoutPosition));
    expect(first.state.dominoes.map(position)).not.toEqual(second.state.dominoes.map(position));
  });

  it("changes only rotations when the rotation seed changes", () => {
    const first = generateBoardFromActivity(activity, seed);
    const second = generateBoardFromActivity(activity, { ...seed, rotation: "2" });

    expect(first.state.dominoes.map(withoutRotation)).toEqual(second.state.dominoes.map(withoutRotation));
    expect(first.state.dominoes.map((domino) => domino.rotation)).not.toEqual(
      second.state.dominoes.map((domino) => domino.rotation),
    );
  });
});

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function position(domino: { x: number; y: number }) {
  return { x: domino.x, y: domino.y };
}

function withoutPosition<T extends { x: number; y: number }>(domino: T) {
  const { x: _x, y: _y, ...rest } = domino;
  return rest;
}

function withoutRotation<T extends { rotation: number }>(domino: T) {
  const { rotation: _rotation, ...rest } = domino;
  return rest;
}
