import { rotateDomino } from "../src/core/board";
import {
  getDominoBounds,
  getRectCenter,
  getRotationSize,
  rotateClockwise,
} from "../src/core/geometry";
import { board, content, domino } from "./core.fixtures";
import type { Domino, Point } from "../src/core/types";

describe("rotation", () => {
  it.each([
    [0, 90],
    [90, 180],
    [180, 270],
    [270, 0],
  ] as const)("rotates %s degrees clockwise to %s", (input, expected) => {
    expect(rotateClockwise(input)).toBe(expected);
  });

  it("rotates a domino around the click point without changing its identity or content", () => {
    const first = domino({
      id: "d1",
      a: content("cat_en"),
      b: content("cat_img", "image"),
      x: 4,
      y: 7,
      rotation: 90,
    });
    const clickPoint = { x: 28, y: 66 };

    const next = rotateDomino(board([first]), "d1", clickPoint);

    expect(next.dominoes[0]).toMatchObject({
      id: first.id,
      a: first.a,
      b: first.b,
      rotation: 180,
    });
    expect(next.dominoes[0]).toEqual(rotateAroundPivot(first, clickPoint));
  });

  it("rotates a linked group clockwise around the click point", () => {
    const clicked = domino({ id: "clicked", x: 0, y: 0, rotation: 0 });
    const linked = domino({ id: "linked", x: 250, y: 50, rotation: 90 });
    const outside = domino({ id: "outside", x: 500, y: 300, rotation: 270 });
    const clickPoint = { x: 25, y: 75 };
    const state = {
      dominoes: [clicked, linked, outside],
      links: [{ dominoId1: "clicked", half1: "a", dominoId2: "linked", half2: "b" }],
    } as const;

    const next = rotateDomino(state, "clicked", clickPoint);

    expect(next.links).toEqual(state.links);
    expect(next.dominoes).toEqual([
      rotateAroundPivot(clicked, clickPoint),
      rotateAroundPivot(linked, clickPoint),
      outside,
    ]);
  });

  it("rotates every domino in a linked chain and leaves separate groups unchanged", () => {
    const a = domino({ id: "a", x: 0, y: 0, rotation: 0 });
    const b = domino({ id: "b", x: 250, y: 50, rotation: 90 });
    const c = domino({ id: "c", x: 250, y: 300, rotation: 180 });
    const d = domino({ id: "d", x: 800, y: 0, rotation: 270 });
    const e = domino({ id: "e", x: 800, y: 300, rotation: 0 });
    const clickPoint = { x: 275, y: 80 };
    const state = {
      dominoes: [a, b, c, d, e],
      links: [
        { dominoId1: "a", half1: "a", dominoId2: "b", half2: "a" },
        { dominoId1: "b", half1: "b", dominoId2: "c", half2: "a" },
        { dominoId1: "d", half1: "a", dominoId2: "e", half2: "a" },
      ],
    } as const;

    const next = rotateDomino(state, "b", clickPoint);

    expect(next.links).toEqual(state.links);
    expect(next.dominoes).toEqual([
      rotateAroundPivot(a, clickPoint),
      rotateAroundPivot(b, clickPoint),
      rotateAroundPivot(c, clickPoint),
      d,
      e,
    ]);
  });

  it("returns the unchanged state when rotating a missing domino", () => {
    const state = board([domino({ id: "present" })]);

    expect(rotateDomino(state, "missing")).toBe(state);
  });
});

function rotateAroundPivot(dominoToRotate: Domino, pivot: Point): Domino {
  const center = getRectCenter(getDominoBounds(dominoToRotate));
  const nextRotation = rotateClockwise(dominoToRotate.rotation);
  const nextSize = getRotationSize(nextRotation);
  const nextCenter = {
    x: pivot.x - (center.y - pivot.y),
    y: pivot.y + (center.x - pivot.x),
  };

  return {
    ...dominoToRotate,
    x: nextCenter.x - nextSize.width / 2,
    y: nextCenter.y - nextSize.height / 2,
    rotation: nextRotation,
  };
}
