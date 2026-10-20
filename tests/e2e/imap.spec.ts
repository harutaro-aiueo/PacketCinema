import { expect, test } from "@playwright/test";

test("IMAP can be found and restores a UID fetch", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/ssh");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("受信箱");
  await page.getByRole("link", { name: /^IMAP/ }).click();
  await expect(page).toHaveURL(/#\/imap$/);
  await page.goto("/#/imap?step=3");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "fetched");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "fetched");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("UID：42");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "logout");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test("IMAP layout fits " + width + "x" + height, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/imap?step=3");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "fetched");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth ||
        [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
          const box = el.getBoundingClientRect();
          return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
        }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("imap.png"), fullPage: true });
  });
}
