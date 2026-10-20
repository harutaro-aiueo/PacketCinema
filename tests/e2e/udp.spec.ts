import { expect, test } from "@playwright/test";

test("UDP is searchable and restores the independent reply from a direct URL", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/ssh");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("データグラム");
  await page.getByRole("link", { name: /^UDP/ }).click();
  await expect(page).toHaveURL(/#\/udp$/);
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "prepare");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "send");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("Length：13バイト");
  await page.keyboard.press("Escape");
  await page.goto("/#/udp?step=4");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "reply");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "reply");
  await page.getByRole("button", { name: "最後に進む" }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "receive-reply");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test("UDP layout fits " + width + "x" + height, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/udp?step=4");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "reply");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth ||
        [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
          const box = el.getBoundingClientRect();
          return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
        }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("udp.png"), fullPage: true });
  });
}
