import type { ActivityData, ContentData } from "./types";
import type { DraftContent, DraftPair } from "./editor-types";
import { isDraftPairValid } from "./editor-state";

export type ActivityExportFile = {
  name: string;
  file: File;
};

export type ActivityExport = {
  activity: ActivityData;
  files: ActivityExportFile[];
};

type MediaNameAllocator = {
  allocate(file: File): string;
  files(): ActivityExportFile[];
};

const createMediaNameAllocator = (): MediaNameAllocator => {
  const used = new Set<string>();
  const files: ActivityExportFile[] = [];

  return {
    allocate(file) {
      const name = nextAvailableName(file.name, used);
      used.add(name.toLocaleLowerCase());
      files.push({ name, file });
      return name;
    },
    files() {
      return [...files].sort((a, b) => a.name.localeCompare(b.name));
    },
  };
};

export const buildActivityExport = (pairs: DraftPair[]): ActivityExport => {
  if (pairs.length < 2) {
    throw new Error("Cannot export activity with fewer than at least 2 rows.");
  }

  if (!pairs.every(isDraftPairValid)) {
    throw new Error("Cannot export activity with invalid rows.");
  }

  const media = createMediaNameAllocator();

  return {
    activity: {
      title: "activity",
      pairs: pairs.map((pair, index) => ({
        id: index + 1,
        items: [toContentData(pair.items[0], media), toContentData(pair.items[1], media)],
      })),
    },
    files: media.files(),
  };
};

const toContentData = (content: DraftContent, media: MediaNameAllocator): ContentData => {
  if (content.kind === "text") {
    return { type: "text", value: content.text.trim() };
  }

  if (content.kind === "image") {
    return { type: "image", src: media.allocate(content.file) };
  }

  if (content.kind === "audio") {
    return { type: "audio", src: media.allocate(content.file) };
  }

  throw new Error("Cannot export empty content.");
};

const nextAvailableName = (name: string, used: Set<string>): string => {
  if (!used.has(name.toLocaleLowerCase())) {
    return name;
  }

  const { base, extension } = splitExtension(name);
  let index = 2;
  let candidate = `${base}-${index}${extension}`;

  while (used.has(candidate.toLocaleLowerCase())) {
    index += 1;
    candidate = `${base}-${index}${extension}`;
  }

  return candidate;
};

const splitExtension = (name: string): { base: string; extension: string } => {
  const lastDot = name.lastIndexOf(".");

  if (lastDot <= 0) {
    return { base: name, extension: "" };
  }

  return { base: name.slice(0, lastDot), extension: name.slice(lastDot) };
};
