import { expect, test } from "@playwright/test";

test("DNS appears in search and restores its answer from a direct URL", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/#/ssh");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("名前解決");
  await page.getByRole("link", { name: /^DNS/ }).click();
  await expect(page).toHaveURL(/#\/dns$/);
  await expect(page.locator(".scene")).toHaveAttribute(
    "data-step",
    "choose-question",
  );
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "query");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("RD=0");
  await page.keyboard.press("Escape");
  await page.goto("/#/dns?step=3");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "answer");
  await expect(page.locator(".callout")).toContainText("権威ある回答");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "answer");
  await page.getByRole("button", { name: "最後に進む" }).click();
  await expect(page.locator(".scene")).toHaveAttribute(
    "data-step",
    "use-answer",
  );
});

for (const [width, height] of [
  [320, 568],
  [1280, 720],
  [844, 390],
]) {
  test(`DNS layout fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/dns?step=3");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "answer");
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
