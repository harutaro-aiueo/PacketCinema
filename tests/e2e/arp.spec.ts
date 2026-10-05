import { expect, test } from "@playwright/test";

test("ARP appears in search and restores its reply from a direct URL", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/ssh");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("MACアドレス");
  await page.getByRole("link", { name: /^ARP/ }).click();
  await expect(page).toHaveURL(/#\/arp$/);
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "lookup");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "request");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("ブロードキャスト");
  await page.keyboard.press("Escape");
  await page.goto("/#/arp?step=3");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "reply");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "reply");
  await page.getByRole("button", { name: "最後に進む" }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "remember");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test(`ARP layout fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/arp?step=3");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "reply");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth ||
        [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
          const box = el.getBoundingClientRect();
          return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
        }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("arp.png"), fullPage: true });
  });
}
