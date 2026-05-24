import { expect, test } from "@playwright/test";

test("renders the activity editor and enables export after two valid rows", async ({ page }) => {
  await page.goto("/domino/?mode=editor");

  await expect(page.locator("#app")).toHaveAttribute("aria-label", "Activity editor");
  await expect(page.getByRole("heading", { name: "Activity editor" })).toBeVisible();

  const exportButton = page.getByRole("button", { name: "Export" });
  await expect(exportButton).toBeDisabled();

  const inputs = page.locator(".activity-editor-input");
  await inputs.nth(0).fill("cat");
  await inputs.nth(1).fill("dog");
  await inputs.nth(2).fill("owl");
  await inputs.nth(3).fill("bird");

  await expect(exportButton).toBeEnabled();
});

test("places add row and export controls below the table aligned with item 1", async ({ page }) => {
  await page.goto("/domino/?mode=editor");

  const itemOneInput = page.locator(".activity-editor-cell[data-row-index='0'][data-item-index='0'] input");
  const addRowButton = page.getByRole("button", { name: "Add row" });
  const exportButton = page.getByRole("button", { name: "Export" });

  const itemOneBox = await itemOneInput.boundingBox();
  const addRowBox = await addRowButton.boundingBox();
  const exportBox = await exportButton.boundingBox();

  expect(itemOneBox).not.toBeNull();
  expect(addRowBox).not.toBeNull();
  expect(exportBox).not.toBeNull();
  expect(addRowBox!.x).toBeCloseTo(itemOneBox!.x, 0);
  expect(addRowBox!.y).toBeGreaterThan(itemOneBox!.y);
  expect(exportBox!.x).toBeGreaterThan(addRowBox!.x + addRowBox!.width);
  expect(exportBox!.y).toBeCloseTo(addRowBox!.y, 0);
});
