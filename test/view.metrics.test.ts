import { clampBoardScale, DEFAULT_BOARD_METRICS, getBoardRect } from "../src/view/metrics";

describe("view metrics", () => {
  it("clamps board scale to configured bounds", () => {
    expect(clampBoardScale(0.31, DEFAULT_BOARD_METRICS)).toBe(0.4);
    expect(clampBoardScale(2.3, DEFAULT_BOARD_METRICS)).toBe(1.8);
  });

  it("rounds board scale to two decimals", () => {
    expect(clampBoardScale(1.333, DEFAULT_BOARD_METRICS)).toBe(1.33);
  });

  it("returns the unscaled board rect for the current viewport", () => {
    expect(getBoardRect({ width: 800, height: 600, scale: 2 })).toEqual({
      width: 400,
      height: 300,
    });
  });
});
