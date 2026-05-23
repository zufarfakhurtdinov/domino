import { createSeededRandom, shuffleWithRandom } from "../src/activity/random";

describe("activity seeded random", () => {
  it("returns the same sequence for the same seed", () => {
    const first = createSeededRandom("domino:1");
    const second = createSeededRandom("domino:1");

    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  it("returns different sequences for different seeds", () => {
    const first = createSeededRandom("domino:1");
    const second = createSeededRandom("domino:2");

    expect([first(), first(), first()]).not.toEqual([second(), second(), second()]);
  });

  it("shuffles deterministically without mutating the input", () => {
    const input = [1, 2, 3, 4, 5, 6];
    const random = createSeededRandom("layout:1");

    expect(shuffleWithRandom(input, random)).toEqual(shuffleWithRandom(input, createSeededRandom("layout:1")));
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
