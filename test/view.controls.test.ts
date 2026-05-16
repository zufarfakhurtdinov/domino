import { getDetachControlRadius, getRotateControlView } from "../src/view/controls";
import { DEFAULT_BOARD_METRICS } from "../src/view/metrics";

describe("view controls", () => {
  it("returns the rotate control anchor and style for each control state", () => {
    expect(getRotateControlView(DEFAULT_BOARD_METRICS, "default")).toEqual({
      center: { x: 200, y: 0 },
      radius: 17,
      fill: "#111827",
      scale: 1,
    });

    expect(getRotateControlView(DEFAULT_BOARD_METRICS, "hover")).toMatchObject({
      radius: 18,
      fill: "#2563eb",
      scale: 1,
    });

    expect(getRotateControlView(DEFAULT_BOARD_METRICS, "pressed")).toMatchObject({
      radius: 18,
      fill: "#1d4ed8",
      scale: 0.92,
    });
  });

  it("returns the detach control radius", () => {
    expect(getDetachControlRadius()).toBe(13);
  });
});
