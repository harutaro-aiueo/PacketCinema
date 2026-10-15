import { expect, test } from "@playwright/test";

test("FTP is searchable and restores the data transfer step", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/ssh");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("ファイル転送");
  await page.getByRole("link", { name: /^FTP/ }).click();
  await expect(page).toHaveURL(/#\/ftp$/);
  await page.goto("/#/ftp?step=5");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "file");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "file");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("経路：データ接続");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "data-close");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test("FTP layout fits " + width + "x" + height, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/ftp?step=5");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "file");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth ||
        [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
          const box = el.getBoundingClientRect();
          return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
        }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("ftp.png"), fullPage: true });
  });
}
