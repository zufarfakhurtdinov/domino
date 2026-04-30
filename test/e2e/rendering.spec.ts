import { expect, test } from "@playwright/test";

test("renders the fixed domino board to canvas", async ({ page }) => {
  await page.goto("http://127.0.0.1:5173/?fixture=basic");

  await expect(page.locator("#app canvas")).toBeVisible();

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.map((domino) => domino.id)).toEqual(["cat", "dog"]);

  const nonBackgroundPixels = await page.locator("#app canvas").first().evaluate((canvas) => {
    const context = canvas.getContext("2d");
    if (!context) {
      return 0;
    }

    const { width, height } = canvas;
    const pixels = context.getImageData(0, 0, width, height).data;
    let count = 0;

    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      if (!(red > 245 && green > 245 && blue > 245)) {
        count += 1;
      }
    }

    return count;
  });

  expect(nonBackgroundPixels).toBeGreaterThan(1000);
});
