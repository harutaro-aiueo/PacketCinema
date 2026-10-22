import { expect, test } from "@playwright/test";

test("Ethernet forwarding and VLAN isolation restore from direct URLs", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/ethernet?step=5");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "known-forward");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("ポート1");
  await page.keyboard.press("Escape");
  await page.goto("/#/ethernet?scenario=different-vlan&step=1");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "vlan-boundary");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("VLAN 20");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test(`Ethernet path fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/ethernet?scenario=different-vlan&step=1");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "vlan-boundary");
    const overflow = await page.evaluate(() => {
      const failures = document.documentElement.scrollWidth > innerWidth
        ? [`document: ${document.documentElement.scrollWidth} > ${innerWidth}`] : [];
      for (const el of document.querySelectorAll(".scene, .callout, .controls")) {
        const box = el.getBoundingClientRect();
        if (box.left < 0 || box.right > innerWidth || el.scrollHeight > el.clientHeight + 2)
          failures.push(`${el.className}: left=${box.left}, right=${box.right}, scrollHeight=${el.scrollHeight}, clientHeight=${el.clientHeight}`);
      }
      return failures;
    });
    expect(overflow).toEqual([]);
    await page.screenshot({ path: test.info().outputPath("ethernet.png"), fullPage: true });
  });
}
