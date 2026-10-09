import { expect, test } from "@playwright/test";

test("HTTP cache is searchable and restores the 304 step", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/ssh");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("304");
  await page.getByRole("link", { name: /^HTTPキャッシュ/ }).click();
  await expect(page).toHaveURL(/#\/http-cache$/);
  await page.goto("/#/http-cache?step=5");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "not-modified");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "not-modified");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("Content：なし");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "reuse");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test("HTTP cache layout fits " + width + "x" + height, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/http-cache?step=5");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "not-modified");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth ||
        [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
          const box = el.getBoundingClientRect();
          return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
        }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("http-cache.png"), fullPage: true });
  });
}
