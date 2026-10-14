import { expect, test } from "@playwright/test";

test("POP3 is searchable and restores the deletion state", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/ssh");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("受信");
  await page.getByRole("link", { name: /^POP3/ }).click();
  await expect(page).toHaveURL(/#\/pop3$/);
  await page.goto("/#/pop3?step=10");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "marked");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "marked");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("削除予定：1番");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "quit");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test("POP3 layout fits " + width + "x" + height, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/pop3?step=8");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "message");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth ||
        [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
          const box = el.getBoundingClientRect();
          return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
        }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("pop3.png"), fullPage: true });
  });
}
