import { expect, test } from "@playwright/test";
import { icmp } from "../../src/protocols/icmp";

const url = "/#/icmp?scenario=ttl-exceeded";

test("TTL expiry restores the dropped datagram and router notification", async ({ page }) => {
  await page.clock.install();
  await page.goto(`${url}&step=2`);
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "ttl-zero-drop");
  await expect(page.locator(".topology-node")).toHaveCount(3);
  await expect(page.locator(".topology-link")).toHaveCount(2);
  await expect(page.locator(".topology-states")).toContainText("未到達");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "time-exceeded");
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("ICMP Type：11 / Code：0");
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "time-exceeded");
});

for (const [width, height] of [[320, 568], [1280, 720], [844, 390]]) {
  test(`TTL expiry fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.clock.install();
    await page.goto(url);
    for (const [index, step] of icmp.scenarios.find((scenario) => scenario.id === "ttl-exceeded")!.steps.entries()) {
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
        return errors;
      });
      expect(errors, step.id).toEqual([]);
      if (index === 2 || index === 3)
        await page.screenshot({ path: test.info().outputPath(`${step.id}.png`) });
      if (index < icmp.scenarios.find((scenario) => scenario.id === "ttl-exceeded")!.steps.length - 1)
        await page.getByRole("button", { name: "次へ", exact: true }).click();
    }
  });
}
