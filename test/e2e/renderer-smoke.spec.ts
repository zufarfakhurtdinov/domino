import { expect, test } from "@playwright/test";

test("renders the default SVG board", async ({ page }) => {
  await page.goto("/domino/");

  await expect(page.locator(".board-svg")).toBeVisible();

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.map((domino) => domino.id)).toEqual([
    "one-two-a",
    "two-three",
    "one-two-b",
    "four-five",
    "one-five",
    "three-seven",
  ]);
});

test("renders the explicit SVG board", async ({ page }) => {
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
