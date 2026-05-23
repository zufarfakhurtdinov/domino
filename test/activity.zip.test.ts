import JSZip from "jszip";
import { createActivityZip } from "../src/activity/zip";
import type { ActivityExport } from "../src/activity/export";

const file = (name: string, content: string) => new File([content], name);

describe("activity zip writer", () => {
  it("writes activity.json and media files inside the activity directory", async () => {
    const activityExport: ActivityExport = {
      activity: {
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
      },
      files: [
        { name: "cat.png", file: file("cat.png", "image") },
        { name: "dog.mp3", file: file("dog.mp3", "audio") },
      ],
    };

    const blob = await createActivityZip(activityExport);
    const zip = await JSZip.loadAsync(blob);

    expect(Object.keys(zip.files)).toEqual(["activity/", "activity/activity.json", "activity/cat.png", "activity/dog.mp3"]);
    expect(JSON.parse(await zip.file("activity/activity.json")!.async("string"))).toEqual(activityExport.activity);
    expect(await zip.file("activity/cat.png")!.async("string")).toBe("image");
    expect(await zip.file("activity/dog.mp3")!.async("string")).toBe("audio");
  });
});
