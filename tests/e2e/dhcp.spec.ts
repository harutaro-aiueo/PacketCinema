import { expect, test } from "@playwright/test";

test("DHCP opens from search and restores the lease step", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/dns");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("自動設定");
  await page.getByRole("link", { name: /^DHCP/ }).click();
  await expect(page).toHaveURL(/#\/dhcp$/);
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "discover");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "offer");
  await page.getByRole("button", { name: "最後に進む" }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "bound");
  await page.goto("/#/dhcp?step=3");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "ack");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "ack");
});

for (const [width, height] of [
  [320, 568],
  [1280, 720],
  [844, 390],
]) {
  test(`DHCP layout fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/dhcp?step=2");
    await expect(page.locator(".scene")).toHaveAttribute(
      "data-step",
      "request",
    );
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth > innerWidth ||
        [...document.querySelectorAll(".scene, .callout, .controls")].some(
          (el) => {
            const box = el.getBoundingClientRect();
            return (
              box.left < 0 ||
              box.right > innerWidth ||
              el.scrollHeight > el.clientHeight + 2
            );
          },
        ),
    );
    expect(overflow).toBe(false);
  });
}
