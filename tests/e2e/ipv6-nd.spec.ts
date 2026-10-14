import { expect, test } from "@playwright/test";

test("IPv6 neighbor discovery appears in search and restores its reply", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/ssh");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("近隣広告");
  await page.getByRole("link", { name: /^IPv6近隣探索/ }).click();
  await expect(page).toHaveURL(/#\/ipv6-nd$/);
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "incomplete");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "solicitation");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("マルチキャスト");
  await page.keyboard.press("Escape");
  await page.goto("/#/ipv6-nd?step=3");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "advertisement");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "advertisement");
  await page.getByRole("button", { name: "最後に進む" }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "reachable");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test(`IPv6 neighbor layout fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/ipv6-nd?step=3");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "advertisement");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth ||
        [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
          const box = el.getBoundingClientRect();
          return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
        }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("ipv6-nd.png"), fullPage: true });
  });
}
