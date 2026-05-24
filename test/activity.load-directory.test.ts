import { loadActivityDirectory } from "../src/activity/load-directory";

const objectUrls = new Map<string, Blob>();
const originalCreateObjectUrl = URL.createObjectURL;

beforeEach(() => {
  objectUrls.clear();
  URL.createObjectURL = (blob: Blob) => {
    const url = `blob:directory-${objectUrls.size}`;
    objectUrls.set(url, blob);
    return url;
  };
});

afterEach(() => {
  URL.createObjectURL = originalCreateObjectUrl;
});

describe("activity directory loader", () => {
  it("loads activity data and media from a selected activity directory", async () => {
    const activity = await loadActivityDirectory([
      fileAt(
        "animals-a1/activity.json",
        JSON.stringify({
          title: "activity",
          pairs: [
            {
              id: 1,
              items: [
                { type: "text", value: "cat" },
                { type: "image", src: "cat.svg" },
              ],
            },
            {
              id: 2,
              items: [
                { type: "audio", src: "dog.mp3" },
                { type: "text", value: "dog" },
              ],
            },
          ],
        }),
      ),
      fileAt("animals-a1/cat.svg", "<svg></svg>"),
      fileAt("animals-a1/dog.mp3", "audio"),
    ]);

    expect(activity.title).toBe("activity");
    expect(activity.pairs).toEqual([
      {
        id: 1,
        items: [{ type: "text", value: "cat" }, { type: "image", url: "blob:directory-0" }],
      },
      {
        id: 2,
        items: [{ type: "audio", url: "blob:directory-1" }, { type: "text", value: "dog" }],
      },
    ]);
    expect(objectUrls.get("blob:directory-0")?.type).toBe("image/svg+xml");
    expect(objectUrls.get("blob:directory-1")?.type).toBe("audio/mpeg");
  });

  it("loads activity json from the selected directory root", async () => {
    const activity = await loadActivityDirectory([
      fileAt(
        "activity.json",
        JSON.stringify({
          title: "activity",
          pairs: [
            {
              id: 1,
              items: [
                { type: "text", value: "bird" },
                { type: "image", src: "bird.png" },
              ],
            },
          ],
        }),
      ),
      fileAt("bird.png", "image"),
    ]);

    expect(activity.pairs[0].items).toEqual([
      { type: "text", value: "bird" },
      { type: "image", url: "blob:directory-0" },
    ]);
    expect(objectUrls.get("blob:directory-0")?.type).toBe("image/png");
  });

  it("ignores macOS metadata when detecting a single top-level activity directory", async () => {
    const activity = await loadActivityDirectory([
      fileAt(
        "animals-a1/activity.json",
        JSON.stringify({
          title: "activity",
          pairs: [
            {
              id: 1,
              items: [
                { type: "text", value: "owl" },
                { type: "audio", src: "owl.m4a" },
              ],
            },
          ],
        }),
      ),
      fileAt("animals-a1/owl.m4a", "audio"),
      fileAt("__MACOSX/animals-a1/._activity.json", "metadata"),
    ]);

    expect(activity.pairs[0].items).toEqual([
      { type: "text", value: "owl" },
      { type: "audio", url: "blob:directory-0" },
    ]);
    expect(objectUrls.get("blob:directory-0")?.type).toBe("audio/mp4");
  });

  it("rejects ambiguous selections with multiple top-level activity directories", async () => {
    await expect(
      loadActivityDirectory([
        fileAt("animals-a1/activity.json", "{}"),
        fileAt("animals-a2/activity.json", "{}"),
      ]),
    ).rejects.toThrow("single top-level directory");
  });

  it("reports missing activity json and missing referenced media", async () => {
    await expect(loadActivityDirectory([fileAt("animals-a1/cat.png", "image")])).rejects.toThrow(
      "activity.json",
    );

    await expect(
      loadActivityDirectory([
        fileAt(
          "animals-a1/activity.json",
          JSON.stringify({
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
        ),
      ]),
    ).rejects.toThrow("animals-a1/missing.png");
  });
});

function fileAt(path: string, content: string): File {
  const file = new File([content], path.split("/").at(-1) ?? path);
  Object.defineProperty(file, "webkitRelativePath", {
    value: path,
  });
  return file;
}
