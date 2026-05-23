export type Rotation = 0 | 90 | 180 | 270;

export type Content =
  | { type: "text"; value: string }
  | { type: "image"; url: string }
  | { type: "audio"; url: string };

export type DominoSide = {
  key: string;
  content: Content;
};

export type Point = {
  x: number;
  y: number;
};

export type Rect = Point & {
  width: number;
  height: number;
};

export type DominoHalf = "a" | "b";

export type Domino = {
  id: string;
  a: DominoSide;
  b: DominoSide;
  x: number;
  y: number;
  rotation: Rotation;
};

export type Link = {
  dominoId1: string;
  half1: DominoHalf;
  dominoId2: string;
  half2: DominoHalf;
};

export type SnapCandidate = {
  draggedDominoId: string;
  draggedHalf: DominoHalf;
  targetDominoId: string;
  targetHalf: DominoHalf;
  snappedPosition: Point;
  distance: number;
};

export type Pair = {
  a: string;
  b: string;
};

export type BoardState = {
  dominoes: readonly Domino[];
  links: readonly Link[];
};
