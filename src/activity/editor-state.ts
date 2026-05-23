import type { DraftContent, DraftPair } from "./editor-types";

export const createEmptyDraftContent = (): DraftContent => ({ kind: "empty", text: "" });

export const createInitialDraftPairs = (): DraftPair[] => [
  { items: [createEmptyDraftContent(), createEmptyDraftContent()] },
  { items: [createEmptyDraftContent(), createEmptyDraftContent()] },
];

export const setTextValue = (content: DraftContent, text: string): DraftContent => {
  if (content.kind === "image" || content.kind === "audio") {
    return content;
  }

  return text.trim() ? { kind: "text", text } : createEmptyDraftContent();
};

export const setImageFile = (content: DraftContent, file: File): DraftContent => {
  if (content.kind === "image" || content.kind === "audio") {
    return content;
  }

  return { kind: "image", file };
};

export const setAudioFile = (content: DraftContent, file: File): DraftContent => {
  if (content.kind === "image" || content.kind === "audio") {
    return content;
  }

  return { kind: "audio", file };
};

export const discardMedia = (content: DraftContent): DraftContent => {
  if (content.kind === "image" || content.kind === "audio") {
    return createEmptyDraftContent();
  }

  return content;
};

export const isDraftContentValid = (content: DraftContent): boolean => {
  if (content.kind === "text") {
    return Boolean(content.text.trim());
  }

  return content.kind === "image" || content.kind === "audio";
};

export const isDraftPairValid = (pair: DraftPair): boolean => pair.items.every(isDraftContentValid);
