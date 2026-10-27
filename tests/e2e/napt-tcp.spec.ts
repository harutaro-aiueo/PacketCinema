import { expect, test } from "@playwright/test";

test("TCP NAPT keeps the mapping through the handshake and direct URL", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/napt?scenario=tcp-outbound&step=3");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "outside-syn-ack");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("198.51.100.1:62000");
  await page.keyboard.press("Escape");
  await page.goto("/#/napt?scenario=tcp-outbound&step=4");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "inside-syn-ack");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("192.0.2.10:53000");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test(`TCP NAPT path fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/napt?scenario=tcp-outbound&step=7");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "mapping-remains");
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
    await page.screenshot({ path: test.info().outputPath("napt-tcp.png"), fullPage: true });
  });
}
