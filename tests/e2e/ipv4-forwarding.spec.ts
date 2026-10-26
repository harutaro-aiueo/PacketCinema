import { expect, test } from "@playwright/test";
import { ipv4Forwarding } from "../../src/protocols/ipv4-forwarding";

test("IPv4 forwarding is searchable and restores the second hop", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/ssh");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("デフォルトゲートウェイ");
  await page.getByRole("link", { name: /^IPv4の転送/ }).click();
  await expect(page).toHaveURL(/#\/ipv4-forwarding$/);
  await expect(page.locator(".topology-node")).toHaveCount(3);
  await expect(page.locator(".topology-link")).toHaveCount(2);
  await page.goto("/#/ipv4-forwarding?step=6");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "to-target");
  await expect(page.locator(".topology-states")).toContainText("転送");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "to-target");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("02:00:00:00:02:20");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test(`IPv4 forwarding fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.clock.install();
    await page.goto("/#/ipv4-forwarding");
    for (const [index, step] of ipv4Forwarding.scenarios[0].steps.entries()) {
      await expect(page.locator(".scene")).toHaveAttribute("data-step", step.id);
      const errors = await page.evaluate(() => {
        const errors: string[] = [];
        if (document.documentElement.scrollWidth > innerWidth) errors.push("horizontal scroll");
        for (const selector of [".topology", ".callout", ".controls", ".masthead"]) {
          const el = document.querySelector(selector)!;
          const r = el.getBoundingClientRect();
          if (r.left < 0 || r.right > innerWidth || r.bottom > innerHeight || el.scrollHeight > el.clientHeight + 2)
            errors.push(selector);
        }
        const diagram = document.querySelector(".topology")!.getBoundingClientRect();
        const callout = document.querySelector(".callout")!.getBoundingClientRect();
        if (callout.left < diagram.right && callout.right > diagram.left && callout.top < diagram.bottom && callout.bottom > diagram.top)
          errors.push("diagram overlap");
        return errors;
      });
      expect(errors, step.id).toEqual([]);
      if (index === 0 || index === 6)
        await page.screenshot({ path: test.info().outputPath(`${step.id}.png`) });
      if (index < ipv4Forwarding.scenarios[0].steps.length - 1)
        await page.getByRole("button", { name: "次へ", exact: true }).click();
    }
  });
}
