import { expect, test } from "@playwright/test";

for (const width of [375, 1280]) {
  test(`home and lesson navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.clock.install();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "PacketCinema",
    );
    await expect(page.locator(".home-card")).toHaveCount(3);
    await expect(page.locator(".scene")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: test.info().outputPath("home.png"),
      fullPage: true,
    });
    await page.getByRole("link", { name: "TCP", exact: true }).click();
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "syn");
    await page.getByRole("link", { name: "トップページへ戻る" }).click();
    await expect(page.locator(".home")).toBeVisible();
    await page.goBack();
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "syn");
    await page.goBack();
    await expect(page.locator(".home")).toBeVisible();
    for (const id of ["ssh", "tcp", "stp"]) {
      await page.locator(`.home-card[href="#/${id}"]`).click();
      await expect(page.locator(".scene")).toBeVisible();
      await page.getByRole("link", { name: "トップページへ戻る" }).click();
    }
    await page.reload();
    await expect(page.locator(".home")).toBeVisible();
  });
}
