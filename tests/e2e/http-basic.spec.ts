import { expect, test } from "@playwright/test";

test("Basic lesson is searchable and restores the credential step", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/ssh");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("Basic");
  await page.getByRole("link", { name: /^HTTP Basic認証/ }).click();
  await expect(page).toHaveURL(/#\/http-basic$/);
  await page.goto("/#/http-basic?step=3");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "authorized-get");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "authorized-get");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("Authorization：Basic <Base64>");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "authorized-200");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test("Basic lesson layout fits " + width + "x" + height, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/http-basic?step=3");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "authorized-get");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth ||
        [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
          const box = el.getBoundingClientRect();
          return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
        }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("http-basic.png"), fullPage: true });
  });
}
