import { expect, test } from "@playwright/test";

test("renders the basic fixture with the DOM renderer", async ({ page }) => {
  await page.goto("/domino/?fixture=basic&renderer=dom");

  await expect(page.locator(".board-dom")).toBeVisible();
  await expect(page.locator(".domino[data-domino-id='cat']")).toBeVisible();
  await expect(page.locator(".domino[data-domino-id='dog']")).toBeVisible();

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.map((domino) => domino.id)).toEqual(["cat", "dog"]);
});

test("rotates a domino through the DOM rotate control", async ({ page }) => {
  await page.goto("/domino/?fixture=basic&renderer=dom");

  await page.locator("[data-role='rotate-control'][data-control-domino-id='cat']").click();

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.find((domino) => domino.id === "cat")?.rotation).toBe(90);
  const transform = await page.locator(".domino[data-domino-id='cat']").evaluate((element) => {
    return getComputedStyle(element).transform;
  });
  expect(transform).not.toBe("none");
});

test("drags a domino through the DOM renderer and updates board state", async ({ page }) => {
  await page.goto("/domino/?fixture=basic&renderer=dom");

  const domino = page.locator(".domino[data-domino-id='cat']");
  const box = await domino.boundingBox();
  expect(box).not.toBeNull();

  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 132, box!.y + box!.height / 2 + 76, {
    steps: 8,
  });
  await page.mouse.up();

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.find((domino) => domino.id === "cat")).toMatchObject({ x: 1, y: 1 });
});

test("snaps and detaches through the DOM renderer", async ({ page }) => {
  await page.goto("/domino/?fixture=snap&renderer=dom");

  const appBox = await page.locator("#app").boundingBox();
  expect(appBox).not.toBeNull();

  await page.mouse.move(appBox!.x + 494, appBox!.y + 70);
  await page.mouse.down();
  await page.mouse.move(appBox!.x + 250, appBox!.y + 70, { steps: 10 });
  await page.mouse.up();

  await expect.poll(async () => {
    const state = await page.evaluate(() => window.__DOMINO_TEST__?.getState() ?? null);
    return state?.links ?? null;
  }).toEqual([
    { dominoId1: "dragged", half1: "a", dominoId2: "target", half2: "a" },
  ]);

  await page.goto("/domino/?fixture=linked&renderer=dom");
  await page.locator("[data-role='detach-control']").click();

  await expect.poll(async () => {
    const state = await page.evaluate(() => window.__DOMINO_TEST__?.getState() ?? null);
    return state?.links ?? null;
  }).toEqual([]);
});
