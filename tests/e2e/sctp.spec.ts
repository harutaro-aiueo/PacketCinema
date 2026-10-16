import { expect, test } from "@playwright/test";

test("SCTP is searchable and restores the cookie exchange", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/ssh");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("トランスポート");
  await page.getByRole("link", { name: /^SCTP/ }).click();
  await expect(page).toHaveURL(/#\/sctp$/);
  await page.goto("/#/sctp?step=2");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "cookie-echo");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "cookie-echo");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "cookie-ack");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test(`SCTP layout fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/sctp?step=2");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "cookie-echo");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth ||
        [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
          const box = el.getBoundingClientRect();
          return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
        }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("sctp.png"), fullPage: true });
  });
}
