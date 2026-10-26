import { expect, test } from "@playwright/test";

test("TCP close keeps the half-closed and TIME-WAIT states on direct URLs", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/tcp?scenario=normal-close&step=2");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "server-data");
  await expect(page.locator(".scene")).toContainText("FIN-WAIT-2");
  await expect(page.locator(".scene")).toContainText("CLOSE-WAIT");
  await page.goto("/#/tcp?scenario=normal-close&step=5");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "server-fin-ack");
  await expect(page.locator(".scene")).toContainText("TIME-WAIT");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("ACK=5006");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test(`TCP close lesson fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/tcp?scenario=normal-close&step=5");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "server-fin-ack");
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > innerWidth ||
      [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
        const box = el.getBoundingClientRect();
        return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
      }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("tcp-close.png"), fullPage: true });
  });
}
