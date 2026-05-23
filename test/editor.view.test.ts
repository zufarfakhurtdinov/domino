import { renderEditorHtml } from "../src/editor/view";
import type { DraftPair } from "../src/activity/editor-types";

const file = (name: string, type: string) => new File(["content"], name, { type });

const pair = (items: DraftPair["items"]): DraftPair => ({ items });

describe("editor view", () => {
  it("renders empty rows with disabled export", () => {
    const html = renderEditorHtml([
      pair([
        { kind: "empty", text: "" },
        { kind: "empty", text: "" },
      ]),
      pair([
        { kind: "empty", text: "" },
        { kind: "empty", text: "" },
      ]),
    ]);

    expect(html).toContain("Activity editor");
    expect(html).toContain('data-row-index="0"');
    expect(html).toContain('data-row-index="1"');
    expect(html).toContain('data-invalid="true"');
    expect(html).toContain('data-action="export" disabled');
  });

  it("enables export when all rows are valid", () => {
    const html = renderEditorHtml([
      pair([
        { kind: "text", text: "cat" },
        { kind: "text", text: "dog" },
      ]),
      pair([
        { kind: "text", text: "owl" },
        { kind: "text", text: "bird" },
      ]),
    ]);

    expect(html).toContain('data-action="export"');
    expect(html).not.toContain('data-action="export" disabled');
    expect(html).not.toContain('data-invalid="true"');
  });

  it("renders media cells as locked with preview controls", () => {
    const html = renderEditorHtml([
      pair([
        { kind: "image", file: file("cat.png", "image/png") },
        { kind: "audio", file: file("dog.mp3", "audio/mpeg") },
      ]),
      pair([
        { kind: "text", text: "owl" },
        { kind: "text", text: "bird" },
      ]),
    ]);

    expect(html).toContain('value="cat.png" disabled');
    expect(html).toContain('data-action="discard-media"');
    expect(html).toContain('data-active="image"');
    expect(html).toContain("<img");
    expect(html).toContain('value="dog.mp3" disabled');
    expect(html).toContain('data-active="audio"');
    expect(html).toContain("<audio");
  });
});
