import { DOMINO_WIDTH, HALF_WIDTH, SNAP_GAP } from "../src/core/geometry";
import { findSnapCandidate } from "../src/core/snapping";
import { createDefaultBoard } from "../src/app/model";

describe("app model", () => {
  it("builds the default demo with original word dominoes and style preview dominoes", () => {
    const state = createDefaultBoard();

    expect(state.links).toEqual([]);
    expect(state.dominoes.slice(0, 6).map((domino) => [
      domino.a.content.type === "text" ? domino.a.content.value : "",
      domino.b.content.type === "text" ? domino.b.content.value : "",
    ])).toEqual([
      ["one (1)", "two (2)"],
      ["two (2)", "three (3)"],
      ["one (1)", "two (2)"],
      ["four (4)", "five (5)"],
      ["one (1)", "five (5)"],
      ["three (3)", "seven (7)"],
    ]);
    expect(state.dominoes.slice(0, 6).map((domino) => domino.rotation)).toEqual([0, 90, 0, 90, 0, 90]);
    expect(state.dominoes.slice(6).map((domino) => domino.id)).toEqual([
      "style-numbers",
      "style-image",
      "style-audio",
    ]);
    expect(state.dominoes[6].a.content).toEqual({ type: "text", value: "three" });
    expect(state.dominoes[6].b.content).toEqual({ type: "text", value: "four" });
    expect(state.dominoes[7].a.content.type).toBe("image");
    expect(state.dominoes[7].b.content).toEqual({ type: "text", value: "two" });
    expect(state.dominoes[8].a.content.type).toBe("audio");
    expect(state.dominoes[8].b.content).toEqual({ type: "text", value: "five" });
  });

  it("lets the demo one-five domino snap to four-five on the five half", () => {
    const state = createDefaultBoard();
    const fourFive = state.dominoes.find((domino) => domino.id === "four-five");
    expect(fourFive).toBeDefined();

    const snapPosition = {
      x: fourFive!.x - DOMINO_WIDTH - SNAP_GAP,
      y: fourFive!.y + HALF_WIDTH,
    };
    const oneFive = state.dominoes.find((domino) => domino.id === "one-five");
    expect(oneFive).toBeDefined();
    oneFive!.x = snapPosition.x - 8;
    oneFive!.y = snapPosition.y + 8;

    expect(findSnapCandidate(state, "one-five", { threshold: 0.5 })).toMatchObject({
      draggedDominoId: "one-five",
      draggedHalf: "b",
      targetDominoId: "four-five",
      targetHalf: "b",
      snappedPosition: snapPosition,
    });
  });

  it("lets the demo four-five domino snap to one-five on the five half", () => {
    const state = createDefaultBoard();
    const oneFive = state.dominoes.find((domino) => domino.id === "one-five");
    expect(oneFive).toBeDefined();

    const snapPosition = {
      x: oneFive!.x + DOMINO_WIDTH + SNAP_GAP,
      y: oneFive!.y - HALF_WIDTH,
    };
    const fourFive = state.dominoes.find((domino) => domino.id === "four-five");
    expect(fourFive).toBeDefined();
    fourFive!.x = snapPosition.x + 8;
    fourFive!.y = snapPosition.y + 8;

    expect(findSnapCandidate(state, "four-five", { threshold: 0.5 })).toMatchObject({
      draggedDominoId: "four-five",
      draggedHalf: "b",
      targetDominoId: "one-five",
      targetHalf: "b",
      snappedPosition: snapPosition,
    });
  });
});
