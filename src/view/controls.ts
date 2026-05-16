import type { BoardMetrics, ControlState, RotateControlView } from "./types";

const rotateControlFillByState: Record<ControlState, string> = {
  default: "#111827",
  hover: "#2563eb",
  pressed: "#1d4ed8",
};

const rotateControlRadiusByState: Record<ControlState, number> = {
  default: 17,
  hover: 18,
  pressed: 18,
};

const rotateControlScaleByState: Record<ControlState, number> = {
  default: 1,
  hover: 1,
  pressed: 0.92,
};

export const ROTATE_ICON_PATH =
  "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8 M21 3v5h-5";
export const ROTATE_ICON_TRANSFORM = "translate(-9 -9) scale(0.75)";
export const ROTATE_ICON_VIEW_BOX = "-9 -9 18 18";
export const ROTATE_ICON_STROKE_WIDTH = 1.8;

export function getRotateControlView(
  metrics: BoardMetrics,
  state: ControlState,
): RotateControlView {
  return {
    center: {
      x: metrics.halfWidth * 2,
      y: 0,
    },
    radius: rotateControlRadiusByState[state],
    fill: rotateControlFillByState[state],
    scale: rotateControlScaleByState[state],
  };
}

export function getDetachControlRadius(): number {
  return 13;
}
