import { expect, test } from "@playwright/test";

test("Telnet is searchable and restores the echo from a direct URL", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/ssh");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("遠隔端末");
  await page.getByRole("link", { name: /^Telnet/ }).click();
  await expect(page).toHaveURL(/#\/telnet$/);
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "will-echo");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "do-echo");
  await page.goto("/#/telnet?step=3");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "echo");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "echo");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("遠隔エコーを使用");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test(`Telnet layout fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/telnet?step=3");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "echo");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth ||
        [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
          const box = el.getBoundingClientRect();
          return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
        }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("telnet.png"), fullPage: true });
  });
}
