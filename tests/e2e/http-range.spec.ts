import { expect, test } from "@playwright/test";

test("Range lesson is searchable and restores the received ranges", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/ssh");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("Range");
  await page.getByRole("link", { name: /^HTTP Range/ }).click();
  await expect(page).toHaveURL(/#\/http-range$/);
  await page.goto("/#/http-range?step=3");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "second-206");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "second-206");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("Content-Range：bytes 100-199/1000");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "combine");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test("Range lesson layout fits " + width + "x" + height, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/http-range?step=4");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "combine");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth ||
        [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
          const box = el.getBoundingClientRect();
          return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
        }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("http-range.png"), fullPage: true });
  });
}
