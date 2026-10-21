import { expect, test } from "@playwright/test";

test("NAPT shows mapping and restores the return path from a direct URL", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/napt");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "prepare");
  await page.goto("/#/napt?step=3");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "outside-send");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("198.51.100.1:62000");
  await page.keyboard.press("Escape");
  await page.goto("/#/napt?step=7");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "inside-reply");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("192.0.2.10:53000");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test(`NAPT path fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/napt?step=6");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "reverse-mapping");
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
    await page.screenshot({ path: test.info().outputPath("napt.png"), fullPage: true });
  });
}
