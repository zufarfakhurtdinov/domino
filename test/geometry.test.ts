import {
  DOMINO_WIDTH,
  getBoundsOriginFromTransform,
  getDominoBounds,
  getHalfBounds,
  getHalfCenter,
  getTransformOrigin,
  HALF_HEIGHT,
  HALF_WIDTH,
} from "../src/core/geometry";
import { domino } from "./core.fixtures";

const origin = { x: 32, y: 48 };

describe("domino geometry", () => {
  it.each([
    [
      0,
      {
        a: { ...origin, width: HALF_WIDTH, height: HALF_HEIGHT },
        b: { x: origin.x + HALF_WIDTH, y: origin.y, width: HALF_WIDTH, height: HALF_HEIGHT },
      },
    ],
    [
      90,
      {
        a: { ...origin, width: HALF_HEIGHT, height: HALF_WIDTH },
        b: { x: origin.x, y: origin.y + HALF_WIDTH, width: HALF_HEIGHT, height: HALF_WIDTH },
      },
    ],
    [
      180,
      {
        a: { x: origin.x + HALF_WIDTH, y: origin.y, width: HALF_WIDTH, height: HALF_HEIGHT },
        b: { ...origin, width: HALF_WIDTH, height: HALF_HEIGHT },
      },
    ],
    [
      270,
      {
        a: { x: origin.x, y: origin.y + HALF_WIDTH, width: HALF_HEIGHT, height: HALF_WIDTH },
        b: { ...origin, width: HALF_HEIGHT, height: HALF_WIDTH },
      },
    ],
  ] as const)("returns half bounds for %s degrees", (rotation, expected) => {
    expect({
      a: getHalfBounds(domino({ ...origin, rotation }), "a"),
      b: getHalfBounds(domino({ ...origin, rotation }), "b"),
    }).toEqual(expected);
  });

  it("returns the domino bounds for rotated dominoes", () => {
    expect(getDominoBounds(domino({ ...origin, rotation: 270 }))).toEqual({
      ...origin,
      width: HALF_HEIGHT,
      height: DOMINO_WIDTH,
    });
  });

  it("returns the center of a rendered half", () => {
    expect(getHalfCenter(domino({ ...origin, rotation: 90 }), "b")).toEqual({
      x: origin.x + HALF_HEIGHT / 2,
      y: origin.y + HALF_WIDTH + HALF_WIDTH / 2,
    });
  });

  it.each([0, 90, 180, 270] as const)("round-trips through transform origin for %s degrees", (rotation) => {
    const candidate = domino({ ...origin, rotation });
    const transform = getTransformOrigin(candidate);

    expect(getBoundsOriginFromTransform(rotation, transform.x, transform.y)).toEqual(origin);
  });
});
