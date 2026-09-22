import { expect, test } from "@playwright/test";
import { stp } from "../../src/protocols/stp";

test("STP is searchable and BPDU playback pauses and resumes", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("ループ防止");
  await page.getByRole("link", { name: /^STP/ }).click();
  await expect(page).toHaveURL(/#\/stp$/);
  await expect(page.locator(".topology-node")).toHaveCount(3);
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await page.clock.runFor(1000);
  const packet = page.locator(".topology-packet");
  expect(Number(await packet.getAttribute("data-progress"))).toBeGreaterThan(0);
  await page.locator(".callout h2").click();
  const position = await packet.getAttribute("cx");
  await page.clock.runFor(7000);
  await expect(packet).toHaveAttribute("cx", position!);
  await page.locator(".callout h2").click();
  await page.clock.runFor(500);
  expect(await packet.getAttribute("cx")).not.toBe(position);
  await page.getByRole("button", { name: "詳しい解説 ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("Root Path Cost=0");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "最後へ" }).click();
  await expect(page.locator('[data-link="ac"]')).toHaveAttribute(
    "data-state",
    "down",
  );
  await expect(page.locator('[data-link="bc"]')).toHaveAttribute(
    "data-state",
    "forwarding",
  );
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute(
    "data-step",
    "recovered",
  );
});

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [1280, 720],
  [844, 390],
  [667, 480],
  [667, 481],
]) {
  test(`STP scenes fit ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.clock.install();
    await page.goto("/#/stp");
    for (const step of stp.scenarios[0].steps) {
      await expect(page.locator(".scene")).toHaveAttribute(
        "data-step",
        step.id,
      );
      const errors = await page.evaluate(() => {
        const errors: string[] = [];
        for (const el of document.querySelectorAll(
          ".topology-states dt, .topology-states dd",
        )) {
          if (parseFloat(getComputedStyle(el).fontSize) < 12)
            errors.push("state text too small");
          const r = el.getBoundingClientRect();
          const parent = document
            .querySelector(".topology")!
            .getBoundingClientRect();
          if (
            r.left < parent.left ||
            r.right > parent.right ||
            r.top < parent.top ||
            r.bottom > parent.bottom
          )
            errors.push("state text overflow");
        }
        for (const selector of [
          ".topology",
          ".callout",
          ".controls",
          ".masthead",
        ]) {
          const el = document.querySelector(selector)!;
          const r = el.getBoundingClientRect();
          if (
            r.left < 0 ||
            r.right > innerWidth ||
            r.bottom > innerHeight ||
            el.scrollHeight > el.clientHeight + 2
          )
            errors.push(selector);
        }
        const callout = document
          .querySelector(".callout")!
          .getBoundingClientRect();
        const topology = document
          .querySelector(".topology")!
          .getBoundingClientRect();
        if (
          callout.left < topology.right &&
          callout.right > topology.left &&
          callout.top < topology.bottom &&
          callout.bottom > topology.top
        )
          errors.push("overlap");
        if (
          callout.bottom >
          document.querySelector(".stage-bottom")!.getBoundingClientRect().top
        )
          errors.push("bottom overlap");
        if (document.documentElement.scrollWidth > innerWidth)
          errors.push("horizontal scroll");
        return errors;
      });
      expect(errors, step.id).toEqual([]);
      if (step.id !== "recovered")
        await page.getByRole("button", { name: "次へ", exact: true }).click();
    }
    await page.screenshot({ path: test.info().outputPath("stp.png") });
  });
}
