import { expect, test } from "@playwright/test";

test("303 lesson is searchable and restores the GET step", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/ssh");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("303");
  await page.getByRole("link", { name: /^HTTPリダイレクト/ }).click();
  await expect(page).toHaveURL(/#\/http-redirect$/);
  await page.goto("/#/http-redirect?step=3");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "follow-get");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "follow-get");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("POST本文：再送しない");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "result-200");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test("303 lesson layout fits " + width + "x" + height, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/http-redirect?step=3");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "follow-get");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth ||
        [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
          const box = el.getBoundingClientRect();
          return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
        }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("http-redirect.png"), fullPage: true });
  });
}
