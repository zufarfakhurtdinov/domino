import type { Content } from "../core/types";

export type ActivityData = {
  title: string;
  pairs: PairData[];
};

export type PairData = {
  id: number;
  items: [ContentData, ContentData];
};

export type ContentData =
  | { type: "text"; value: string }
  | { type: "image"; src: string }
  | { type: "audio"; src: string };

export type LoadedActivity = {
  title: string;
  pairs: LoadedPair[];
};

export type LoadedPair = {
  id: number;
  items: [Content, Content];
};

export type GenerationSeed = {
  domino: string;
  layout: string;
  rotation: string;
};
