import { expect, test } from "@playwright/test";

test("TCP flow control restores zero window and window update from URLs", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/tcp?scenario=flow-control&step=3");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "pause-send");
  await expect(page.locator(".scene")).toContainText("次のデータの送信を待つ");
  await page.goto("/#/tcp?scenario=flow-control&step=5");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "window-update");
  await expect(page.locator(".scene")).toContainText("同じACK番号で空きを知らせる");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("ACK=1005（変化なし）");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test(`TCP flow control fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/tcp?scenario=flow-control&step=5");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "window-update");
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > innerWidth ||
      [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
        const box = el.getBoundingClientRect();
        return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
      }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("tcp-flow-control.png"), fullPage: true });
  });
}
