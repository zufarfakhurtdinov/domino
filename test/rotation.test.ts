import { rotateDomino } from "../src/core/board";
import { rotateClockwise } from "../src/core/geometry";
import { board, content, domino } from "./core.fixtures";

describe("rotation", () => {
  it.each([
    [0, 90],
    [90, 180],
    [180, 270],
    [270, 0],
  ] as const)("rotates %s degrees clockwise to %s", (input, expected) => {
    expect(rotateClockwise(input)).toBe(expected);
  });

  it("rotates a domino without changing its identity, content, or position", () => {
    const first = domino({
      id: "d1",
      a: content("cat_en"),
      b: content("cat_img", "image"),
      x: 4,
      y: 7,
      rotation: 90,
    });

    const next = rotateDomino(board([first]), "d1");

    expect(next.dominoes[0]).toEqual({
      ...first,
      rotation: 180,
    });
  });
});
