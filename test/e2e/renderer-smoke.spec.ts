import { expect, test } from "@playwright/test";

test("renders the default Konva board", async ({ page }) => {
  await page.goto("/domino/");

  await expect(page.locator("#app canvas")).toBeVisible();

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.map((domino) => domino.id)).toEqual([
    "linked-dragged",
    "linked-target",
    "snap-dragged",
    "snap-target",
    "rotated-dragged",
    "rotated-target",
  ]);
});

test("renders the SVG board", async ({ page }) => {
  await page.goto("/domino/?fixture=basic&renderer=svg");

  await expect(page.locator(".board-svg")).toBeVisible();

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.map((domino) => domino.id)).toEqual(["cat", "dog"]);
});

test("renders the DOM board", async ({ page }) => {
  await page.goto("/domino/?fixture=basic&renderer=dom");

  await expect(page.locator(".board-dom")).toBeVisible();

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.map((domino) => domino.id)).toEqual(["cat", "dog"]);
});
