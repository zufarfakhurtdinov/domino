import { getDominoCells, getHalfCenter, getOccupiedCells } from "../src/core/geometry";
import { domino } from "./core.fixtures";

describe("domino geometry", () => {
  it.each([
    [0, { a: { x: 2, y: 3 }, b: { x: 3, y: 3 } }],
    [90, { a: { x: 2, y: 3 }, b: { x: 2, y: 4 } }],
    [180, { a: { x: 3, y: 3 }, b: { x: 2, y: 3 } }],
    [270, { a: { x: 2, y: 4 }, b: { x: 2, y: 3 } }],
  ] as const)("returns half cells for %s degrees", (rotation, expected) => {
    expect(getDominoCells(domino({ x: 2, y: 3, rotation }))).toEqual(expected);
  });

  it("returns occupied cells independent of half order", () => {
    expect(getOccupiedCells(domino({ x: 2, y: 3, rotation: 180 }))).toEqual([
      { x: 2, y: 3 },
      { x: 3, y: 3 },
    ]);
  });

  it("returns the center of a half cell", () => {
    expect(getHalfCenter(domino({ x: 2, y: 3, rotation: 90 }), "b")).toEqual({
      x: 2.5,
      y: 4.5,
    });
  });
});
