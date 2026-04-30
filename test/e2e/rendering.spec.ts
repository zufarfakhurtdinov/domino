import { expect, test } from "@playwright/test";

test("renders the fixed domino board to canvas", async ({ page }) => {
  await page.goto("http://127.0.0.1:5173/?fixture=basic");

  await expect(page.locator("#app canvas")).toBeVisible();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  await expect(page.locator("#app canvas")).toHaveJSProperty("width", viewport!.width);
  await expect(page.locator("#app canvas")).toHaveJSProperty("height", viewport!.height);

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

test("rotates a domino by clicking its canvas rotate control", async ({ page }) => {
  await page.goto("http://127.0.0.1:5173/?fixture=basic");

  const appBox = await page.locator("#app").boundingBox();
  expect(appBox).not.toBeNull();

  await page.mouse.move(appBox!.x + 278, appBox!.y + 50);
  expect(await page.evaluate(() => window.__DOMINO_TEST__.getRotateControlState("cat"))).toBe(
    "hover",
  );

  await page.mouse.down();
  expect(await page.evaluate(() => window.__DOMINO_TEST__.getRotateControlState("cat"))).toBe(
    "pressed",
  );
  await page.mouse.up();

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.find((domino) => domino.id === "cat")?.rotation).toBe(90);
});

test("drags a domino across the canvas and updates board state", async ({ page }) => {
  await page.goto("http://127.0.0.1:5173/?fixture=basic");

  const appBox = await page.locator("#app").boundingBox();
  expect(appBox).not.toBeNull();

  await page.mouse.move(appBox!.x + 164, appBox!.y + 70);
  await page.mouse.down();
  await page.mouse.move(appBox!.x + 296, appBox!.y + 146, { steps: 8 });
  await page.mouse.up();

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  const cat = state.dominoes.find((domino) => domino.id === "cat");

  expect({ x: cat?.x, y: cat?.y }).toEqual({ x: 1, y: 1 });
});

test("shows a snap candidate while dragging and applies it on release", async ({ page }) => {
  await page.goto("http://127.0.0.1:5173/?fixture=snap");

  const appBox = await page.locator("#app").boundingBox();
  expect(appBox).not.toBeNull();

  await page.mouse.move(appBox!.x + 494, appBox!.y + 70);
  await page.mouse.down();
  await page.mouse.move(appBox!.x + 250, appBox!.y + 70, { steps: 10 });

  const candidate = await page.evaluate(() => window.__DOMINO_TEST__.getSnapCandidate());
  expect(candidate).toMatchObject({
    draggedDominoId: "dragged",
    targetDominoId: "target",
    snappedPosition: { x: 1, y: 0 },
  });

  await page.mouse.up();

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.find((domino) => domino.id === "dragged")).toMatchObject({ x: 1, y: 0 });
  expect(state.links).toEqual([
    { dominoId1: "dragged", half1: "a", dominoId2: "target", half2: "a" },
  ]);
});

test("detaches linked dominoes from a canvas control", async ({ page }) => {
  await page.goto("http://127.0.0.1:5173/?fixture=linked");

  await expect.poll(async () => {
    const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
    return state.links.length;
  }).toBe(1);

  const appBox = await page.locator("#app").boundingBox();
  expect(appBox).not.toBeNull();

  await page.mouse.click(appBox!.x + 182, appBox!.y + 50);

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.links).toEqual([]);
});
