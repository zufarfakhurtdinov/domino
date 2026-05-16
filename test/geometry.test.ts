import {
  getBoundsOriginFromTransform,
  getDominoBounds,
  getHalfBounds,
  getHalfCenter,
  getTransformOrigin,
} from "../src/core/geometry";
import { domino } from "./core.fixtures";

describe("domino geometry", () => {
  it.each([
    [0, { a: { x: 32, y: 48, width: 132, height: 98 }, b: { x: 164, y: 48, width: 132, height: 98 } }],
    [90, { a: { x: 32, y: 48, width: 98, height: 132 }, b: { x: 32, y: 180, width: 98, height: 132 } }],
    [180, { a: { x: 164, y: 48, width: 132, height: 98 }, b: { x: 32, y: 48, width: 132, height: 98 } }],
    [270, { a: { x: 32, y: 180, width: 98, height: 132 }, b: { x: 32, y: 48, width: 98, height: 132 } }],
  ] as const)("returns half bounds for %s degrees", (rotation, expected) => {
    expect({
      a: getHalfBounds(domino({ x: 32, y: 48, rotation }), "a"),
      b: getHalfBounds(domino({ x: 32, y: 48, rotation }), "b"),
    }).toEqual(expected);
  });

  it("returns the domino bounds for rotated dominoes", () => {
    expect(getDominoBounds(domino({ x: 32, y: 48, rotation: 270 }))).toEqual({
      x: 32,
      y: 48,
      width: 98,
      height: 264,
    });
  });

  it("returns the center of a rendered half", () => {
    expect(getHalfCenter(domino({ x: 32, y: 48, rotation: 90 }), "b")).toEqual({
      x: 81,
      y: 246,
    });
  });

  it.each([0, 90, 180, 270] as const)("round-trips through transform origin for %s degrees", (rotation) => {
    const candidate = domino({ x: 32, y: 48, rotation });
    const transform = getTransformOrigin(candidate);

    expect(getBoundsOriginFromTransform(rotation, transform.x, transform.y)).toEqual({
      x: 32,
      y: 48,
    });
  });
});
