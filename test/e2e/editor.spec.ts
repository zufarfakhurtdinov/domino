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
