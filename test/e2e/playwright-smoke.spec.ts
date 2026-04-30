import { expect, test } from "@playwright/test";

test("runs browser interaction tests", async ({ page }) => {
  await page.setContent(`
    <button id="rotate" type="button">Rotate</button>
    <output id="angle">0</output>
    <script>
      const output = document.querySelector("#angle");
      document.querySelector("#rotate").addEventListener("click", () => {
        output.textContent = String((Number(output.textContent) + 90) % 360);
      });
    </script>
  `);

  await page.getByRole("button", { name: "Rotate" }).click();

  await expect(page.locator("#angle")).toHaveText("90");
});
