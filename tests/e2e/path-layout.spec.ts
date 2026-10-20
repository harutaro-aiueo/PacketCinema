import { expect, test } from "@playwright/test";

test("three-node path shows only real links and restores a hop", async ({ page }) => {
  await page.clock.install();
  await page.goto("/tests/fixtures/player.html?path=1#/path-example");
  await expect(page.locator(".topology-node")).toHaveCount(3);
  await expect(page.locator(".topology-link")).toHaveCount(2);
  await expect(page.getByRole("img", { name: "3台のノードとリンクの状態" })).toBeVisible();
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "forward");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "forward");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390], [667, 480], [667, 481]]) {
  test(`three-node path fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/tests/fixtures/player.html?path=1#/path-example?step=1");
    await expect(page.locator(".topology-node")).toHaveCount(3);
    const overflow = await page.evaluate(() => {
      const scene = document.querySelector(".scene")!.getBoundingClientRect();
      const diagram = document.querySelector(".topology")!.getBoundingClientRect();
      const callout = document.querySelector(".callout")!.getBoundingClientRect();
      return document.documentElement.scrollWidth > innerWidth ||
        diagram.left < 0 || diagram.right > innerWidth ||
        callout.left < 0 || callout.right > innerWidth ||
        diagram.bottom > scene.bottom;
    });
    expect(overflow).toBe(false);
    await page.screenshot({ path: test.info().outputPath("path.png") });
  });
}
