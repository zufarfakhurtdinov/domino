import { expect, test } from "@playwright/test";
import JSZip from "jszip";
import { writeFile } from "node:fs/promises";
import { defaultDragDominoId, openBoard } from "./boards";

test("dom renderer uses the same tabletop tile structure", async ({ page }) => {
  await openBoard(page);

  await expect(page.locator(".board-dom")).toBeVisible();
  await expect(page.locator(`[data-domino-id='${defaultDragDominoId}'] .domino-half`)).toHaveCount(2);
  await expect(page.locator(`[data-domino-id='${defaultDragDominoId}'] .domino-divider`)).toHaveCount(1);

  const boardStyle = await page.locator(".board-surface").evaluate((node) => {
    const style = window.getComputedStyle(node);
    return {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
    };
  });
  expect(boardStyle.backgroundColor).toBe("rgb(105, 127, 132)");
  expect(boardStyle.backgroundImage).not.toBe("none");

  const dominoStyle = await page.locator(`[data-domino-id='${defaultDragDominoId}']`).evaluate((node) => {
    const style = window.getComputedStyle(node);
    return {
      backgroundColor: style.backgroundColor,
      borderRadius: style.borderRadius,
      boxShadow: style.boxShadow,
    };
  });
  expect(dominoStyle.backgroundColor).toBe("rgb(238, 231, 216)");
  expect(dominoStyle.borderRadius).toBe("10px");
  expect(dominoStyle.boxShadow).not.toBe("none");
});

test("media halves use inset image frames and muted audio controls", async ({ page }, testInfo) => {
  const zipPath = testInfo.outputPath("activity.zip");
  await writeFile(zipPath, Buffer.from(await createMediaActivityZip()));

  await page.goto("/domino/");
  await expect(page.locator(".board-dom")).toBeVisible();

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import activity", exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(zipPath);

  await expect.poll(async () => (await page.evaluate(() => window.__DOMINO_TEST__.getState())).dominoes.length).toBe(2);
  await expect(page.locator(".domino-content-image-frame")).toHaveCount(2);
  await expect(page.locator(".domino-content-image")).toHaveCount(2);
  await expect(page.locator(".domino-audio-button")).toHaveCount(1);
  await expect(page.locator(".domino-audio-button")).toHaveCSS(
    "color",
    "rgb(79, 102, 109)",
  );
});

async function createMediaActivityZip(): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file(
    "activity/activity.json",
    JSON.stringify({
      title: "media style",
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
            { type: "audio", src: "dog.mp3" },
            { type: "image", src: "dog.png" },
          ],
        },
      ],
    }),
  );
  zip.file("activity/cat.png", "cat image");
  zip.file("activity/dog.png", "dog image");
  zip.file("activity/dog.mp3", "dog audio");
  return zip.generateAsync({ type: "arraybuffer" });
}
