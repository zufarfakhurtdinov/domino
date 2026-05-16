import { rotateDomino } from "../src/core/board";
import { getDominoBounds, rotateClockwise } from "../src/core/geometry";
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

  it("rotates a domino without changing its identity or content and keeps its visual center", () => {
    const first = domino({
      id: "d1",
      a: content("cat_en"),
      b: content("cat_img", "image"),
      x: 4,
      y: 7,
      rotation: 90,
    });

    const next = rotateDomino(board([first]), "d1");
    const before = getDominoBounds(first);
    const after = getDominoBounds(next.dominoes[0]);

    expect(next.dominoes[0]).toMatchObject({
      id: first.id,
      a: first.a,
      b: first.b,
      rotation: 180,
    });
    expect({
      x: before.x + before.width / 2,
      y: before.y + before.height / 2,
    }).toEqual({
      x: after.x + after.width / 2,
      y: after.y + after.height / 2,
    });
  });
});
