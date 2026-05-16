import { DOMINO_WIDTH, HALF_HEIGHT, HALF_WIDTH, SNAP_GAP } from "../src/core/geometry";
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

const boardOrigin = { x: 2, y: 3 };
const sideCenteredPosition = {
  x: HALF_HEIGHT + SNAP_GAP,
  y: HALF_WIDTH / 2,
};
const snapHighlightInset = 8;

describe("view transforms", () => {
  it.each([
    [0, boardOrigin],
    [90, { x: boardOrigin.x + HALF_HEIGHT, y: boardOrigin.y }],
    [180, { x: boardOrigin.x + DOMINO_WIDTH, y: boardOrigin.y + HALF_HEIGHT }],
    [270, { x: boardOrigin.x, y: boardOrigin.y + DOMINO_WIDTH }],
  ] as const)("returns the visual transform for %s degrees", (rotation, expected) => {
    expect(getVisualTransform(domino({ ...boardOrigin, rotation }), DEFAULT_BOARD_METRICS)).toEqual(
      expected,
    );
  });

  it.each([0, 90, 180, 270] as const)("converts visual drag state back to board space for %s degrees", (rotation) => {
    const candidate = domino({ ...boardOrigin, rotation });
    const transform = getVisualTransform(candidate, DEFAULT_BOARD_METRICS);

    expect(
      getBoardPositionFromVisualState(
        { x: transform.x, y: transform.y, rotation },
        DEFAULT_BOARD_METRICS,
      ),
    ).toEqual(boardOrigin);
  });

  it("returns the detach control center between linked halves", () => {
    const state: BoardState = {
      dominoes: [
        domino({ id: "dragged", a: content("cat_en"), ...sideCenteredPosition }),
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
      center: { x: HALF_HEIGHT + SNAP_GAP / 2, y: HALF_WIDTH },
    });
  });

  it("returns the snap highlight footprint from the rigid visual transform", () => {
    expect(
      getSnapHighlightView(domino({ x: 1, y: 4, rotation: 90 }), DEFAULT_BOARD_METRICS),
    ).toEqual({
      x: 1 + HALF_HEIGHT,
      y: 4,
      rotation: 90,
      width: DEFAULT_BOARD_METRICS.halfWidth * 2 - snapHighlightInset,
      height: DEFAULT_BOARD_METRICS.halfHeight - snapHighlightInset,
    });
  });

  it("normalizes arbitrary rotation degrees to orthogonal board rotations", () => {
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(450)).toBe(90);
    expect(normalizeRotation(44)).toBe(0);
  });
});
