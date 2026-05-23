export type DraftContent =
  | { kind: "empty"; text: "" }
  | { kind: "text"; text: string }
  | { kind: "image"; file: File }
  | { kind: "audio"; file: File };

export type DraftPair = {
  items: [DraftContent, DraftContent];
};
