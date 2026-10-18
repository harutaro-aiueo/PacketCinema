import { expect, test } from "@playwright/test";

test("IPv4 fragmentation is searchable and restores reassembly from URL", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/ssh");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("MTU");
  await page.getByRole("link", { name: /^IPv4の分割/ }).click();
  await expect(page).toHaveURL(/#\/ipv4-fragmentation$/);
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "split");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "first");
  await page.goto("/#/ipv4-fragmentation?step=3");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "reassemble");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "reassemble");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test("IPv4 fragmentation layout fits " + width + "x" + height, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/ipv4-fragmentation?step=2");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "last");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth ||
        [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
          const box = el.getBoundingClientRect();
          return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
        }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("ipv4-fragmentation.png"), fullPage: true });
  });
}
