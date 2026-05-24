import JSZip from "jszip";
import { loadActivityZip } from "../src/activity/load-zip";

describe("activity zip loader", () => {
  it("loads activity data and resolves media src files to object URLs", async () => {
    const file = await createActivityZip({
      "activity/activity.json": JSON.stringify({
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
      }),
      "activity/cat.png": "image",
      "activity/dog.mp3": "audio",
    });

    const activity = await loadActivityZip(file);

    expect(activity.title).toBe("activity");
    expect(activity.pairs).toHaveLength(2);
    expect(activity.pairs[0]).toEqual({
      id: 1,
      items: [{ type: "text", value: "cat" }, { type: "image", url: expect.stringMatching(/^blob:/) }],
    });
    expect(activity.pairs[1]).toEqual({
      id: 2,
      items: [{ type: "text", value: "dog" }, { type: "audio", url: expect.stringMatching(/^blob:/) }],
    });
  });

  it("loads activity json from the zip root", async () => {
    const activity = await loadActivityZip(
      await createActivityZip({
        "activity.json": JSON.stringify({
          title: "activity",
          pairs: [
            {
              id: 1,
              items: [
                { type: "text", value: "cat" },
                { type: "image", src: "cat.png" },
              ],
            },
          ],
        }),
        "cat.png": "image",
      }),
    );

    expect(activity.pairs[0].items).toEqual([
      { type: "text", value: "cat" },
      { type: "image", url: expect.stringMatching(/^blob:/) },
    ]);
  });

  it("loads activity json from any single top-level directory and ignores macOS metadata", async () => {
    const activity = await loadActivityZip(
      await createActivityZip({
        "animals-a1/activity.json": JSON.stringify({
          title: "activity",
          pairs: [
            {
              id: 1,
              items: [
                { type: "text", value: "dog" },
                { type: "audio", src: "dog.mp3" },
              ],
            },
          ],
        }),
        "animals-a1/dog.mp3": "audio",
        "__MACOSX/animals-a1/._activity.json": "metadata",
      }),
    );

    expect(activity.pairs[0].items).toEqual([
      { type: "text", value: "dog" },
      { type: "audio", url: expect.stringMatching(/^blob:/) },
    ]);
  });

  it("rejects ambiguous zips with multiple top-level activity directories", async () => {
    await expect(
      loadActivityZip(
        await createActivityZip({
          "animals-a1/activity.json": "{}",
          "animals-a2/activity.json": "{}",
        }),
      ),
    ).rejects.toThrow("single top-level directory");
  });

  it("reports missing activity json and missing referenced media", async () => {
    await expect(loadActivityZip(await createActivityZip({}))).rejects.toThrow("activity.json");

    await expect(
      loadActivityZip(
        await createActivityZip({
          "activity/activity.json": JSON.stringify({
            title: "activity",
            pairs: [
              {
                id: 1,
                items: [
                  { type: "text", value: "cat" },
                  { type: "image", src: "missing.png" },
                ],
              },
            ],
          }),
        }),
      ),
    ).rejects.toThrow("activity/missing.png");
  });
});

async function createActivityZip(files: Record<string, string>): Promise<File> {
  const zip = new JSZip();

  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }

  const bytes = await zip.generateAsync({ type: "arraybuffer" });
  return new File([bytes], "activity.zip", { type: "application/zip" });
}
