import { expect, test } from "@playwright/test";
import JSZip from "jszip";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

test("imports an activity zip and renders a generated board", async ({ page }, testInfo) => {
  const zipPath = testInfo.outputPath("activity.zip");
  await writeFile(zipPath, Buffer.from(await createActivityZip()));

  await page.goto("/domino/");
  await expect(page.locator(".board-dom")).toBeVisible();

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import activity", exact: true }).click();
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

test("imports an unpacked activity directory and renders a generated board", async ({ page }, testInfo) => {
  const directoryPath = await createActivityDirectory(testInfo.outputPath("activity"));

  await page.goto("/domino/");
  await expect(page.locator(".board-dom")).toBeVisible();

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import activity folder" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(directoryPath);

  await expect.poll(async () => (await page.evaluate(() => window.__DOMINO_TEST__.getState())).dominoes.length).toBe(3);

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.map((domino) => domino.id)).toEqual(["activity-1", "activity-2", "activity-3"]);
  expect(countBy(state.dominoes.flatMap((domino) => [domino.a.key, domino.b.key]))).toEqual({
    "1": 2,
    "2": 2,
    "3": 2,
  });
});

test("playing imported audio does not rotate the domino", async ({ page }, testInfo) => {
  const zipPath = testInfo.outputPath("activity.zip");
  await writeFile(zipPath, Buffer.from(await createActivityZip()));

  await page.goto("/domino/");
  await expect(page.locator(".board-dom")).toBeVisible();

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import activity", exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(zipPath);
  await expect.poll(async () => (await page.evaluate(() => window.__DOMINO_TEST__.getState())).dominoes.length).toBe(3);

  await page.addInitScript(() => {
    window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  });
  const stateBefore = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  const audioDomino = stateBefore.dominoes.find((domino) => domino.a.content.type === "audio" || domino.b.content.type === "audio");
  expect(audioDomino).toBeDefined();

  await page.locator(`[data-domino-id="${audioDomino!.id}"] [aria-label="Play audio"]`).click();

  const stateAfter = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(stateAfter.dominoes.find((domino) => domino.id === audioDomino!.id)?.rotation).toBe(audioDomino!.rotation);
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

async function createActivityDirectory(directoryPath: string): Promise<string> {
  await mkdir(directoryPath, { recursive: true });
  await writeFile(
    join(directoryPath, "activity.json"),
    JSON.stringify({
      title: "activity",
      pairs: [
        { id: 1, items: [{ type: "text", value: "cat" }, { type: "image", src: "cat.png" }] },
        { id: 2, items: [{ type: "text", value: "dog" }, { type: "audio", src: "dog.mp3" }] },
        { id: 3, items: [{ type: "text", value: "owl" }, { type: "image", src: "owl.png" }] },
      ],
    }),
  );
  await writeFile(join(directoryPath, "cat.png"), "cat image");
  await writeFile(join(directoryPath, "dog.mp3"), "dog audio");
  await writeFile(join(directoryPath, "owl.png"), "owl image");
  return directoryPath;
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}
