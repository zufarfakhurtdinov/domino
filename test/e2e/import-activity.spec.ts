import { expect, test } from "@playwright/test";
import JSZip from "jszip";
import { writeFile } from "node:fs/promises";

test("imports an activity zip and renders a generated board", async ({ page }, testInfo) => {
  const zipPath = testInfo.outputPath("activity.zip");
  await writeFile(zipPath, Buffer.from(await createActivityZip()));

  await page.goto("/domino/");
  await expect(page.locator(".board-svg")).toBeVisible();

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import activity" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(zipPath);

  await expect.poll(async () => (await page.evaluate(() => window.__DOMINO_TEST__.getState())).dominoes.length).toBe(3);

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.map((domino) => domino.id)).toEqual(["activity-1", "activity-2", "activity-3"]);
  expect(countBy(state.dominoes.flatMap((domino) => [domino.a.key, domino.b.key]))).toEqual({
    "1": 2,
    "2": 2,
    "3": 2,
  });
});

async function createActivityZip(): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file(
    "activity/activity.json",
    JSON.stringify({
      title: "activity",
      pairs: [
        { id: 1, items: [{ type: "text", value: "cat" }, { type: "image", src: "cat.png" }] },
        { id: 2, items: [{ type: "text", value: "dog" }, { type: "audio", src: "dog.mp3" }] },
        { id: 3, items: [{ type: "text", value: "owl" }, { type: "image", src: "owl.png" }] },
      ],
    }),
  );
  zip.file("activity/cat.png", "cat image");
  zip.file("activity/dog.mp3", "dog audio");
  zip.file("activity/owl.png", "owl image");
  return zip.generateAsync({ type: "arraybuffer" });
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}
