import type { BoardState, Content, DominoHalf, Link, Point, Rotation, SnapCandidate } from "../core/types";

export type ControlState = "default" | "hover" | "pressed";

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

export type RotateControlView = {
  center: Point;
  radius: number;
  fill: string;
  scale: number;
};

export type DominoHalfView = {
  half: DominoHalf;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  content: Content;
};

export type DominoView = {
  id: string;
  x: number;
  y: number;
  rotation: Rotation;
  width: number;
  height: number;
  halves: [DominoHalfView, DominoHalfView];
  rotateControl: RotateControlView;
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

export type BoardView = {
  rect: BoardRect;
  dominoes: DominoView[];
  linkControls: LinkControlView[];
  snapHighlight: SnapHighlightView | null;
};
