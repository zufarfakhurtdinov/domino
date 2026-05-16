import type { BoardState, Link } from "../src/core/types";
import { DEFAULT_BOARD_METRICS } from "../src/view/metrics";
import {
  getBoardPositionFromVisualState,
  getLinkControlView,
  getSnapHighlightView,
  getVisualTransform,
  normalizeRotation,
} from "../src/view/transforms";
import { board, content, domino } from "./core.fixtures";

describe("view transforms", () => {
  it.each([
    [0, { x: 2, y: 3 }],
    [90, { x: 102, y: 3 }],
    [180, { x: 202, y: 103 }],
    [270, { x: 2, y: 203 }],
  ] as const)("returns the visual transform for %s degrees", (rotation, expected) => {
    expect(getVisualTransform(domino({ x: 2, y: 3, rotation }), DEFAULT_BOARD_METRICS)).toEqual(
      expected,
    );
  });

  it.each([0, 90, 180, 270] as const)("converts visual drag state back to board space for %s degrees", (rotation) => {
    const candidate = domino({ x: 2, y: 3, rotation });
    const transform = getVisualTransform(candidate, DEFAULT_BOARD_METRICS);

    expect(
      getBoardPositionFromVisualState(
        { x: transform.x, y: transform.y, rotation },
        DEFAULT_BOARD_METRICS,
      ),
    ).toEqual({ x: 2, y: 3 });
  });

  it("returns the detach control center between linked halves", () => {
    const state: BoardState = {
      dominoes: [
        domino({ id: "dragged", a: content("cat_en"), x: 100, y: 17 }),
        domino({ id: "target", a: content("cat_img", "image"), x: 0, y: 0, rotation: 90 }),
      ],
      links: [],
    };
    const link: Link = {
      dominoId1: "dragged",
      half1: "a",
      dominoId2: "target",
      half2: "a",
    };

    expect(getLinkControlView(state, link, DEFAULT_BOARD_METRICS)).toEqual({
      link,
      center: { x: 100, y: 58.5 },
    });
  });

  it("returns the snap highlight footprint from the rigid visual transform", () => {
    expect(
      getSnapHighlightView(domino({ x: 1, y: 4, rotation: 90 }), DEFAULT_BOARD_METRICS),
    ).toEqual({
      x: 101,
      y: 4,
      rotation: 90,
      width: 192,
      height: 92,
    });
  });

  it("normalizes arbitrary rotation degrees to orthogonal board rotations", () => {
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(450)).toBe(90);
    expect(normalizeRotation(44)).toBe(0);
  });
});
