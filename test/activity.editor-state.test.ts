import {
  createInitialDraftPairs,
  canExportDraftPairs,
  discardMedia,
  isDraftContentValid,
  isDraftPairValid,
  setAudioFile,
  setImageFile,
  setTextValue,
} from "../src/activity/editor-state";
import type { DraftPair } from "../src/activity/editor-types";

const file = (name: string, type: string) => new File(["content"], name, { type });

describe("activity editor draft state", () => {
  it("starts with two empty rows", () => {
    expect(createInitialDraftPairs()).toEqual([
      { items: [{ kind: "empty", text: "" }, { kind: "empty", text: "" }] },
      { items: [{ kind: "empty", text: "" }, { kind: "empty", text: "" }] },
    ]);
  });

  it("turns empty cells into text cells and clears blank text back to empty", () => {
    const text = setTextValue({ kind: "empty", text: "" }, " cat ");

    expect(text).toEqual({ kind: "text", text: " cat " });
    expect(setTextValue(text, "   ")).toEqual({ kind: "empty", text: "" });
  });

  it("lets media replace text", () => {
    const text = setTextValue({ kind: "empty", text: "" }, "cat");
    const image = file("cat.png", "image/png");
    const audio = file("cat.mp3", "audio/mpeg");

    expect(setImageFile(text, image)).toEqual({ kind: "image", file: image });
    expect(setAudioFile(text, audio)).toEqual({ kind: "audio", file: audio });
  });

  it("locks media cells until the discard button is used", () => {
    const image = file("cat.png", "image/png");
    const audio = file("cat.mp3", "audio/mpeg");
    const imageCell = setImageFile({ kind: "empty", text: "" }, image);
    const audioCell = setAudioFile({ kind: "empty", text: "" }, audio);

    expect(setTextValue(imageCell, "cat")).toBe(imageCell);
    expect(setAudioFile(imageCell, audio)).toBe(imageCell);
    expect(setImageFile(audioCell, image)).toBe(audioCell);
    expect(discardMedia(imageCell)).toEqual({ kind: "empty", text: "" });
    expect(discardMedia(audioCell)).toEqual({ kind: "empty", text: "" });
  });

  it("marks only non-blank text and media cells as valid", () => {
    const image = file("cat.png", "image/png");

    expect(isDraftContentValid({ kind: "empty", text: "" })).toBe(false);
    expect(isDraftContentValid({ kind: "text", text: "   " })).toBe(false);
    expect(isDraftContentValid({ kind: "text", text: "cat" })).toBe(true);
    expect(isDraftContentValid({ kind: "image", file: image })).toBe(true);
    expect(
      isDraftPairValid({
        items: [
          { kind: "text", text: "cat" },
          { kind: "image", file: image },
        ],
      }),
    ).toBe(true);
  });

  it("requires at least two valid rows before export", () => {
    const validPair = pair([
      { kind: "text", text: "cat" },
      { kind: "text", text: "dog" },
    ]);

    expect(canExportDraftPairs([validPair])).toBe(false);
    expect(canExportDraftPairs([validPair, validPair])).toBe(true);
    expect(canExportDraftPairs([validPair, { items: [{ kind: "empty", text: "" }, { kind: "empty", text: "" }] }])).toBe(
      false,
    );
  });
});

const pair = (items: DraftPair["items"]): DraftPair => ({ items });
