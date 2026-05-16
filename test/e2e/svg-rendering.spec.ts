import { expect, test } from "@playwright/test";

test("renders the basic fixture with the SVG renderer", async ({ page }) => {
  await page.goto("/domino/svg.html?fixture=basic");

  await expect(page.locator("#app svg.board-svg")).toBeVisible();
  await expect(page.locator(".domino[data-domino-id='cat']")).toBeVisible();
  await expect(page.locator(".domino[data-domino-id='dog']")).toBeVisible();

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.map((domino) => domino.id)).toEqual(["cat", "dog"]);
});

test("rotates a domino through the SVG rotate control", async ({ page }) => {
  await page.goto("/domino/svg.html?fixture=basic");

  await page.locator("[data-role='rotate-control'][data-control-domino-id='cat']").click();

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.find((domino) => domino.id === "cat")?.rotation).toBe(90);
  await expect(page.locator(".domino[data-domino-id='cat']")).toHaveAttribute(
    "transform",
    /rotate\(90\)/,
  );
});

test("drags a domino through the SVG renderer and updates board state", async ({ page }) => {
  await page.goto("/domino/svg.html?fixture=basic");

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

test("shows the rotated snap highlight in the SVG renderer", async ({ page }) => {
  await page.goto("/domino/svg.html?fixture=snap-rotated");

  const appBox = await page.locator("#app").boundingBox();
  expect(appBox).not.toBeNull();

  await page.mouse.move(appBox!.x + 470, appBox!.y + 160);
  await page.mouse.down();
  await page.mouse.move(appBox!.x + 210, appBox!.y + 160, { steps: 10 });

  const candidate = await page.evaluate(() => window.__DOMINO_TEST__.getSnapCandidate());
  expect(candidate).toMatchObject({
    draggedDominoId: "dragged",
    targetDominoId: "target",
    snappedPosition: { x: 1, y: 0 },
  });
  await expect(page.locator(".snap-highlight")).toHaveAttribute("transform", /rotate\(90\)/);

  await page.mouse.up();
});

test("snaps a domino into place through the SVG renderer", async ({ page }) => {
  await page.goto("/domino/svg.html?fixture=snap");

  const appBox = await page.locator("#app").boundingBox();
  expect(appBox).not.toBeNull();

  await page.mouse.move(appBox!.x + 494, appBox!.y + 70);
  await page.mouse.down();
  await page.mouse.move(appBox!.x + 250, appBox!.y + 70, { steps: 10 });
  await page.mouse.up();

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.dominoes.find((domino) => domino.id === "dragged")).toMatchObject({ x: 1, y: 0 });
  expect(state.links).toEqual([
    { dominoId1: "dragged", half1: "a", dominoId2: "target", half2: "a" },
  ]);
});

test("detaches a linked pair through the SVG renderer", async ({ page }) => {
  await page.goto("/domino/svg.html?fixture=linked");

  await page.locator("[data-role='detach-control']").click();

  const state = await page.evaluate(() => window.__DOMINO_TEST__.getState());
  expect(state.links).toEqual([]);
});
