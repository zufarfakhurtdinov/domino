import { canMatch } from "../src/core/matching";
import { DOMINO_WIDTH, HALF_WIDTH, SNAP_GAP } from "../src/core/geometry";
import { findSnapCandidate } from "../src/core/snapping";
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

  it("lets the demo one-five domino snap to four-five on the five half", () => {
    const state = createFixtureBoard("demo");
    const fourFive = state.dominoes.find((domino) => domino.id === "four-five");
    expect(fourFive).toBeDefined();

    const snapPosition = {
      x: fourFive!.x - DOMINO_WIDTH - SNAP_GAP,
      y: fourFive!.y + HALF_WIDTH / 2,
    };
    const oneFive = state.dominoes.find((domino) => domino.id === "one-five");
    expect(oneFive).toBeDefined();
    oneFive!.x = snapPosition.x - 8;
    oneFive!.y = snapPosition.y + 8;

    expect(findSnapCandidate(state, "one-five", pairs, { threshold: 0.5 })).toMatchObject({
      draggedDominoId: "one-five",
      draggedHalf: "b",
      targetDominoId: "four-five",
      targetHalf: "b",
      snappedPosition: snapPosition,
    });
  });

  it("lets the demo four-five domino snap to one-five on the five half", () => {
    const state = createFixtureBoard("demo");
    const oneFive = state.dominoes.find((domino) => domino.id === "one-five");
    expect(oneFive).toBeDefined();

    const snapPosition = {
      x: oneFive!.x + DOMINO_WIDTH + SNAP_GAP,
      y: oneFive!.y - HALF_WIDTH / 2,
    };
    const fourFive = state.dominoes.find((domino) => domino.id === "four-five");
    expect(fourFive).toBeDefined();
    fourFive!.x = snapPosition.x + 8;
    fourFive!.y = snapPosition.y + 8;

    expect(findSnapCandidate(state, "four-five", pairs, { threshold: 0.5 })).toMatchObject({
      draggedDominoId: "four-five",
      draggedHalf: "b",
      targetDominoId: "one-five",
      targetHalf: "b",
      snappedPosition: snapPosition,
    });
  });
});
