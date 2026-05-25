import { expect, test } from "@playwright/test";

test("renders the default DOM board", async ({ page }) => {
  await page.goto("/domino/");

  await expect(page.locator(".board-dom")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Import activity", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Open editor" })).toBeVisible();

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.map((domino) => domino.id)).toEqual([
    "one-two-a",
    "two-three",
    "one-two-b",
    "four-five",
    "one-five",
    "three-seven",
    "style-numbers",
    "style-image",
    "style-audio",
  ]);
});

test("opens the activity editor from the board", async ({ page }) => {
  await page.goto("/domino/");

  await page.getByRole("button", { name: "Open editor" }).click();

  await expect(page).toHaveURL(/mode=editor/);
  await expect(
    page.getByRole("heading", { name: "Activity editor" }),
  ).toBeVisible();
});
