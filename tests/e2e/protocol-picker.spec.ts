import { expect, test } from "@playwright/test";

test("searches names and purposes, handles no matches, and navigates", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/#/ssh");
  await expect(page.locator(".masthead nav")).toHaveCount(0);
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  const dialog = page.getByRole("dialog", { name: "教材を探す" });
  const search = page.getByRole("searchbox", {
    name: "プロトコル名・用途で検索",
  });
  await expect(search).toBeFocused();
  await search.fill("リモート接続");
  await expect(dialog.getByRole("link")).toHaveCount(1);
  await expect(dialog.getByRole("link")).toContainText("SSH");
  await search.fill("存在しない教材");
  await expect(dialog.getByRole("link")).toHaveCount(0);
  await expect(dialog).toContainText("見つかりませんでした");
  await search.fill("ｔＣｐ");
  await expect(dialog.getByRole("link")).toHaveCount(1);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(dialog).not.toBeVisible();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "syn");
  await expect(page).toHaveURL(/#\/tcp$/);
  await page.goBack();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "command");
});

test("picker suspends the clock and restores focus and the prior playback state", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/#/ssh?step=1");
  await page.clock.runFor(1000);
  const trigger = page.getByRole("button", { name: "プロトコルを探す" });
  await trigger.click();
  const progress = await page.locator(".packet").getAttribute("data-progress");
  await page.clock.runFor(12000);
  await expect(page.locator(".packet")).toHaveAttribute(
    "data-progress",
    progress!,
  );
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(
    page.getByRole("dialog", { name: "教材を探す" }),
  ).not.toBeVisible();
  // Native dialog close events and React effects settle between clock advances.
  const frozenProgress = Number(progress);
  let resumedProgress = frozenProgress;
  for (
    let attempt = 0;
    attempt < 4 && resumedProgress <= frozenProgress;
    attempt++
  ) {
    await page.clock.runFor(250);
    await page.evaluate(
      () => new Promise<void>((resolve) => queueMicrotask(resolve)),
    );
    resumedProgress = Number(
      await page.locator(".packet").getAttribute("data-progress"),
    );
  }
  expect(resumedProgress).toBeGreaterThan(frozenProgress);
  await page.locator(".callout h2").click();
  await trigger.click();
  await page.getByRole("link", { name: /^SSH/ }).click();
  await expect(page).toHaveURL(/step=1$/);
  await expect(page.getByRole("status")).toHaveText("一時停止");
  const frozen = await page.locator(".packet").getAttribute("data-progress");
  await page.clock.runFor(12000);
  await expect(page.locator(".packet")).toHaveAttribute(
    "data-progress",
    frozen!,
  );
});

for (const [width, height] of [
  [320, 568],
  [1280, 720],
  [667, 375],
]) {
  test(
    "many protocols fit and remain searchable at " + width + "x" + height,
    async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.clock.install();
      await page.goto("/tests/fixtures/player.html?many=1#/example");
      await expect(page.locator(".masthead")).not.toContainText("教材 60");
      await page.getByRole("button", { name: "プロトコルを探す" }).click();
      const dialog = page.getByRole("dialog", { name: "教材を探す" });
      await expect(dialog.getByRole("link")).toHaveCount(61);
      const bounds = await dialog.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        await page
          .locator(".picker-results")
          .evaluate((element) => element.scrollHeight > element.clientHeight),
      ).toBe(true);
      await page.getByRole("searchbox").fill("目的60");
      await expect(dialog.getByRole("link")).toHaveCount(1);
      await page.screenshot({ path: test.info().outputPath("picker.png") });
      await dialog.getByRole("link").click();
      await expect(page).toHaveURL(/#\/demo-60$/);
      await expect(page.locator(".scene")).toHaveAttribute(
        "data-step",
        "request",
      );
    },
  );
}
