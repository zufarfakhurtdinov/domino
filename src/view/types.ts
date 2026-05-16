import type { BoardState, Link, Point, Rotation, SnapCandidate } from "../core/types";

export type BoardMetrics = {
  cellWidth: number;
  cellHeight: number;
  boardPadding: number;
  minBoardScale: number;
  maxBoardScale: number;
  boardScaleStep: number;
};

export type BoardViewport = {
  width: number;
  height: number;
  scale: number;
};

export type DragVisualState = {
  x: number;
  y: number;
  rotation: Rotation;
};

export type SnapHighlightView = {
  x: number;
  y: number;
  rotation: Rotation;
  width: number;
  height: number;
};

export type LinkControlView = {
  link: Link;
  center: Point;
};

export type BoardRect = {
  width: number;
  height: number;
};

export type PreviewResult = {
  previewState: BoardState;
  candidate: SnapCandidate | null;
};
