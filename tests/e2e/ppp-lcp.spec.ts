import { expect, test } from "@playwright/test";

test("PPP LCP restores the final acknowledgment from a direct URL", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/ppp-lcp");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "a-request");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "b-request");
  await page.goto("/#/ppp-lcp?step=3");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "b-ack");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "b-ack");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("Identifier：1");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test(`PPP LCP layout fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/ppp-lcp?step=3");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "b-ack");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth ||
        [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
          const box = el.getBoundingClientRect();
          return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
        }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("ppp-lcp.png"), fullPage: true });
  });
}
