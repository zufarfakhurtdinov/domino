import { buildActivityExport } from "../src/activity/export";
import type { DraftPair } from "../src/activity/editor-types";

const file = (name: string, type: string) => new File(["content"], name, { type });

const pair = (items: DraftPair["items"]): DraftPair => ({ items });

describe("activity export builder", () => {
  it("rejects fewer than two rows", () => {
    expect(() =>
      buildActivityExport([
        pair([
          { kind: "text", text: "cat" },
          { kind: "text", text: "dog" },
        ]),
      ]),
    ).toThrow("at least 2");
  });

  it("rejects incomplete and blank rows", () => {
    expect(() =>
      buildActivityExport([
        pair([
          { kind: "text", text: "cat" },
          { kind: "text", text: "dog" },
        ]),
        pair([
          { kind: "text", text: "   " },
          { kind: "empty", text: "" },
        ]),
      ]),
    ).toThrow("invalid");
  });

  it("exports activity data with title and regenerated row ids", () => {
    const image = file("cat.png", "image/png");
    const audio = file("dog.mp3", "audio/mpeg");

    const result = buildActivityExport([
      pair([
        { kind: "text", text: " cat " },
        { kind: "image", file: image },
      ]),
      pair([
        { kind: "text", text: "dog" },
        { kind: "audio", file: audio },
      ]),
    ]);

    expect(result.activity).toEqual({
      title: "activity",
      pairs: [
        {
          id: 1,
          items: [
            { type: "text", value: "cat" },
            { type: "image", src: "cat.png" },
          ],
        },
        {
          id: 2,
          items: [
            { type: "text", value: "dog" },
            { type: "audio", src: "dog.mp3" },
          ],
        },
      ],
    });
  });

  it("preserves filenames while resolving duplicates case-insensitively", () => {
    const first = file("cat.png", "image/png");
    const second = file("Cat.png", "image/png");
    const third = file("CAT.PNG", "image/png");

    const result = buildActivityExport([
      pair([
        { kind: "image", file: first },
        { kind: "image", file: second },
      ]),
      pair([
        { kind: "text", text: "cat" },
        { kind: "image", file: third },
      ]),
    ]);

    expect(result.activity.pairs).toEqual([
      {
        id: 1,
        items: [
          { type: "image", src: "cat.png" },
          { type: "image", src: "Cat-2.png" },
        ],
      },
      {
        id: 2,
        items: [
          { type: "text", value: "cat" },
          { type: "image", src: "CAT-3.PNG" },
        ],
      },
    ]);
    expect(result.files.map((entry) => entry.name)).toEqual(["Cat-2.png", "CAT-3.PNG", "cat.png"]);
    expect(result.files.map((entry) => entry.file)).toEqual([second, third, first]);
  });
});
