import { expect, test } from "@playwright/test";

test("SNMP GET is searchable and restores the response from a direct URL", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/ssh");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("MIB");
  await page.getByRole("link", { name: /^SNMP GET/ }).click();
  await expect(page).toHaveURL(/#\/snmp-get$/);
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "get");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "lookup");
  await page.goto("/#/snmp-get?step=2");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "response");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "response");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("error-status：noError");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test(`SNMP GET layout fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/snmp-get?step=2");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "response");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth ||
        [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
          const box = el.getBoundingClientRect();
          return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
        }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("snmp-get.png"), fullPage: true });
  });
}
