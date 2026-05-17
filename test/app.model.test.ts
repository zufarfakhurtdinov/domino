import { canMatch } from "../src/core/matching";
import { createFixtureBoard, pairs } from "../src/app/model";

describe("app model fixtures", () => {
  it("builds the default demo as six horizontal word dominoes", () => {
    const state = createFixtureBoard(null);

    expect(state.links).toEqual([]);
    expect(state.dominoes.map((domino) => [domino.a.value, domino.b.value])).toEqual([
      ["one (1)", "two (2)"],
      ["two (2)", "three (3)"],
      ["one (1)", "two (2)"],
      ["four (4)", "five (5)"],
      ["one (1)", "five (5)"],
      ["three (3)", "seven (7)"],
    ]);
    expect(state.dominoes.map((domino) => domino.rotation)).toEqual([0, 90, 0, 90, 0, 90]);
  });

  it("allows repeated demo words to match by hidden occurrence keys", () => {
    const state = createFixtureBoard("demo");
    const oneTwo = state.dominoes[0];
    const twoThree = state.dominoes[1];
    const fourFive = state.dominoes[3];
    const oneFive = state.dominoes[4];
    const threeSeven = state.dominoes[5];

    expect(canMatch(oneTwo.b, twoThree.a, pairs)).toBe(true);
    expect(canMatch(oneTwo.a, oneFive.a, pairs)).toBe(true);
    expect(canMatch(fourFive.b, oneFive.b, pairs)).toBe(true);
    expect(canMatch(twoThree.b, threeSeven.a, pairs)).toBe(true);
  });
});
