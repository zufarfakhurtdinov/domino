import { expect, test } from "@playwright/test";

test("renders the default SVG board", async ({ page }) => {
  await page.goto("/domino/");

  await expect(page.locator(".board-svg")).toBeVisible();
  await expect(page.getByRole("button", { name: "Import activity", exact: true })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "Activity editor" })).toBeVisible();
});

test("renders the explicit SVG board", async ({ page }) => {
  await page.goto("/domino/?fixture=basic&renderer=svg");

  await expect(page.locator(".board-svg")).toBeVisible();

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.map((domino) => domino.id)).toEqual(["cat", "dog"]);
});

test("centers SVG domino text vertically inside each half", async ({ page }) => {
  await page.goto("/domino/?fixture=basic&renderer=svg");
  await expect(page.locator(".board-svg")).toBeVisible();

  const halfBoxes = await page.locator("[data-domino-id='cat'] path").evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return { y: box.y, height: box.height };
    }),
  );
  const textBoxes = await page.locator("[data-domino-id='cat'] text").evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return { y: box.y, height: box.height };
    }),
  );

  expect(textBoxes).toHaveLength(halfBoxes.length);
  halfBoxes.forEach((halfBox, index) => {
    const textBox = textBoxes[index];

    expect(textBox.y + textBox.height / 2).toBeCloseTo(halfBox.y + halfBox.height / 2, 0);
  });
});

test("renders the DOM board", async ({ page }) => {
  await page.goto("/domino/?fixture=basic&renderer=dom");

  await expect(page.locator(".board-dom")).toBeVisible();

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.map((domino) => domino.id)).toEqual(["cat", "dog"]);
});
