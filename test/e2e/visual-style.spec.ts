import { expect, test } from "@playwright/test";
import JSZip from "jszip";
import { writeFile } from "node:fs/promises";

test("svg renderer uses the ivory ceramic and blue-gray felt style", async ({ page }) => {
  await page.goto("/domino/?fixture=basic&renderer=svg");

  await expect(page.locator(".board-svg")).toBeVisible();
  await expect(page.locator(".board-background")).toHaveAttribute("href", /blue-gray-felt-background/);
  await expect(page.locator(".board-background")).toHaveAttribute("preserveAspectRatio", "xMidYMid slice");
  await expect(page.locator("[data-domino-id='cat'] .domino-tile-base")).toHaveCount(1);
  await expect(page.locator("[data-domino-id='cat'] .domino-half-surface")).toHaveCount(2);
  await expect(page.locator("[data-domino-id='cat'] .domino-divider")).toHaveCount(1);
  await expect(page.locator("[data-domino-id='cat'] text").first()).toHaveAttribute("fill", "#27313a");
});

test("dom renderer uses the same tabletop tile structure", async ({ page }) => {
  await page.goto("/domino/?fixture=basic&renderer=dom");

  await expect(page.locator(".board-dom")).toBeVisible();
  await expect(page.locator("[data-domino-id='cat'] .domino-half")).toHaveCount(2);
  await expect(page.locator("[data-domino-id='cat'] .domino-divider")).toHaveCount(1);

  const boardStyle = await page.locator(".board-surface").evaluate((node) => {
    const style = window.getComputedStyle(node);
    return {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
    };
  });
  expect(boardStyle.backgroundColor).toBe("rgb(105, 127, 132)");
  expect(boardStyle.backgroundImage).not.toBe("none");

  const dominoStyle = await page.locator("[data-domino-id='cat']").evaluate((node) => {
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

test("svg media halves use inset image frames and muted audio controls", async ({ page }, testInfo) => {
  const zipPath = testInfo.outputPath("activity.zip");
  await writeFile(zipPath, Buffer.from(await createMediaActivityZip()));

  await page.goto("/domino/?renderer=svg");
  await expect(page.locator(".board-svg")).toBeVisible();

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import activity", exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(zipPath);

  await expect.poll(async () => (await page.evaluate(() => window.__DOMINO_TEST__.getState())).dominoes.length).toBe(2);
  await expect(page.locator(".domino-content-image-frame")).toHaveCount(2);
  await expect(page.locator(".domino-content-image")).toHaveCount(2);
  await expect(page.locator(".domino-audio-button-svg .domino-audio-button-ring")).toHaveCount(1);
  await expect(page.locator(".domino-audio-button-svg circle")).toHaveAttribute("fill", "#eee7d8");
  await expect(page.locator(".domino-audio-button-svg path")).toHaveAttribute("fill", "#4f666d");
});

async function createMediaActivityZip(): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file(
    "activity/activity.json",
    JSON.stringify({
      title: "media style",
      pairs: [
        { id: 1, items: [{ type: "text", value: "cat" }, { type: "image", src: "cat.png" }] },
        { id: 2, items: [{ type: "audio", src: "dog.mp3" }, { type: "image", src: "dog.png" }] },
      ],
    }),
  );
  zip.file("activity/cat.png", "cat image");
  zip.file("activity/dog.png", "dog image");
  zip.file("activity/dog.mp3", "dog audio");
  return zip.generateAsync({ type: "arraybuffer" });
}
