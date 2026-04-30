export type Rotation = 0 | 90 | 180 | 270;

export type ContentKind = "text" | "image" | "audio";

export type Content = {
  kind: ContentKind;
  key: string;
  value: string;
};

export type DominoHalf = "a" | "b";

export type Domino = {
  id: string;
  a: Content;
  b: Content;
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

export type BoardState = {
  dominoes: Domino[];
  links: Link[];
};
