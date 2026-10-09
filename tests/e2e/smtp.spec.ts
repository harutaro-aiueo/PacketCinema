import { expect, test } from "@playwright/test";

test("SMTP is searchable and restores the DATA response", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/ssh");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("メール");
  await page.getByRole("link", { name: /^SMTP/ }).click();
  await expect(page).toHaveURL(/#\/smtp$/);
  await page.goto("/#/smtp?step=8");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "data-ready");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "data-ready");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("Reply：354");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "content");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test("SMTP layout fits " + width + "x" + height, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/smtp?step=9");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "content");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth ||
        [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
          const box = el.getBoundingClientRect();
          return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
        }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("smtp.png"), fullPage: true });
  });
}
