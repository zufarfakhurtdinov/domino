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
