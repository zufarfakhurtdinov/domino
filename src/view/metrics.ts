import { HALF_HEIGHT, HALF_WIDTH } from "../core/geometry";
import type { BoardMetrics, BoardRect, BoardViewport } from "./types";

export const DEFAULT_BOARD_METRICS: BoardMetrics = {
  halfWidth: HALF_WIDTH,
  halfHeight: HALF_HEIGHT,
  minBoardScale: 0.4,
  maxBoardScale: 1.8,
  boardScaleStep: 0.2,
};

export function clampBoardScale(nextScale: number, metrics: BoardMetrics): number {
  return Math.min(
    metrics.maxBoardScale,
    Math.max(metrics.minBoardScale, Number(nextScale.toFixed(2))),
  );
}

export function getBoardRect(viewport: BoardViewport): BoardRect {
  return {
    width: viewport.width / viewport.scale,
    height: viewport.height / viewport.scale,
  };
}
