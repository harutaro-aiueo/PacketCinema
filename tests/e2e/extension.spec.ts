import { expect, test } from "@playwright/test";

// The nested test entry point uses the application's public pixel assets.
test.beforeEach(async ({ page }) => {
  await page.route("**/tests/fixtures/pixels/**", (route) => {
    const url = new URL(route.request().url());
    url.pathname = url.pathname.replace("/tests/fixtures/pixels/", "/pixels/");
    return route.continue({ url: url.href });
  });
});
test("new protocol with arbitrary node IDs plays without shared UI changes", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/tests/fixtures/player.html");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "架空プロトコル",
  );
  await expect(page.locator(".actor strong")).toHaveText([
    "READER",
    "RESPONDER",
  ]);
  await expect(page.locator(".callout-meta")).toContainText(
    "READER → RESPONDER",
  );
  await expect(page.locator(".device").first()).toHaveJSProperty(
    "complete",
    true,
  );
  expect(
    await page
      .locator(".device")
      .first()
      .evaluate((image) => (image as HTMLImageElement).naturalWidth),
  ).toBeGreaterThan(0);
  await page.clock.runFor(2500);
  const outbound = Number(
    await page.locator(".packet").getAttribute("data-progress"),
  );
  expect(outbound).toBeGreaterThan(0);
  await page.locator(".callout h2").click();
  await expect(page.getByRole("status")).toHaveText("一時停止");
  const frozen = await page.locator(".packet").getAttribute("data-progress");
  await page.clock.runFor(10000);
  expect(
    Number(await page.locator(".packet").getAttribute("data-progress")),
  ).toBe(Number(frozen));
  await page.locator(".callout h2").click();
  await page.clock.runFor(4000);
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "response");
  await expect(page.locator(".callout-meta")).toContainText(
    "RESPONDER → READER",
  );
  await page.clock.runFor(6100);
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "complete");
  await expect(page.locator(".packet")).toHaveCount(0);
  await page.clock.runFor(3300);
  await expect(page.getByRole("status")).toHaveText("再生完了");
  await page.getByRole("button", { name: "詳しい解説 ↗" }).click();
  await expect(page.locator(".model-note")).toHaveText(
    "拡張性検証専用の架空教材です。",
  );
});
test("non-default scenario persists through navigation and reload", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto(
    "/tests/fixtures/player.html#/example?scenario=alternate&step=0",
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "別シナリオ",
  );
  await page.getByRole("button", { name: "次へ" }).click();
  await expect(page).toHaveURL(/scenario=alternate&step=1$/);
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "response");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "別シナリオ",
  );
});
test("unknown and unpublished scenarios keep the current public defaults", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/#/ssh?scenario=exec-password&auth=password&detail=1");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "command");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".auth-badge")).toHaveText("公開鍵認証");
  await page.goto("/#/missing?step=999");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "done");
});
