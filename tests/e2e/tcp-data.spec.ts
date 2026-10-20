import { expect, test } from "@playwright/test";

test("TCP data lesson restores the lost segment and ACK from URLs", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/tcp?scenario=data-retransmission&step=5");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "data-lost");
  await expect(page.getByText("データ 4バイト（消失）")).toBeVisible();
  await page.clock.fastForward(4000);
  await expect(page.getByRole("status")).toHaveText("途中で消失");
  await expect(page.locator(".packet")).toHaveCount(0);
  await page.goto("/#/tcp?scenario=data-retransmission&step=8");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "ack-retry");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("ACK=1009");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test(`TCP data lesson fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/tcp?scenario=data-retransmission&step=5");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "data-lost");
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > innerWidth ||
      [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
        const box = el.getBoundingClientRect();
        return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
      }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("tcp-data.png"), fullPage: true });
  });
}
