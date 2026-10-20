import { expect, test } from "@playwright/test";

test("IPv6 autoconfiguration restores its tentative state and completion", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/ipv6-slaac");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "rs");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "ra");
  await page.goto("/#/ipv6-slaac?step=3");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "tentative");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "tentative");
  await page.getByRole("button", { name: "最後に進む" }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "usable");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("重複確認：成功と仮定");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test(`IPv6 autoconfiguration layout fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/ipv6-slaac?step=1");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "ra");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth ||
        [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
          const box = el.getBoundingClientRect();
          return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
        }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("ipv6-slaac.png"), fullPage: true });
  });
}
