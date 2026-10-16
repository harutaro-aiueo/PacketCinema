import { expect, test } from "@playwright/test";

test("MQTT is searchable and restores the PUBACK step", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/ssh");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("ブローカー");
  await page.getByRole("link", { name: /^MQTT/ }).click();
  await expect(page).toHaveURL(/#\/mqtt$/);
  await page.goto("/#/mqtt?step=3");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "puback");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "puback");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("Packet Identifier：7");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "disconnect");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test("MQTT layout fits " + width + "x" + height, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/mqtt?step=2");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "publish");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth ||
        [...document.querySelectorAll(".scene, .callout, .controls")].some((el) => {
          const box = el.getBoundingClientRect();
          return box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2;
        }),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("mqtt.png"), fullPage: true });
  });
}
