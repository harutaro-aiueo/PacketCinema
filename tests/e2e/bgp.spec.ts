import { expect, test } from "@playwright/test";
import { peering } from "../../src/protocols/bgp/scenarios/peering";

test("BGP can be found, paused, inspected, and restored from a step URL", async ({
  page,
}) => {
  const r1Table = page.locator('.routing-table[data-node="r1"]');
  const r2Table = page.locator('.routing-table[data-node="r2"]');
  const expectRoute = async (
    table: typeof r1Table,
    destination: string,
    learnedVia: string,
    nextHop: string,
  ) => {
    const row = table.locator("tbody tr").filter({ hasText: destination });
    await expect(row.locator("td")).toHaveText([
      destination,
      learnedVia,
      nextHop,
    ]);
  };
  await page.clock.install();
  await page.goto("/#/ssh");
  await page.getByRole("button", { name: "プロトコルを探す" }).click();
  await page.getByRole("searchbox").fill("経路制御");
  await page.getByRole("link", { name: /^BGP/ }).click();
  await expect(page).toHaveURL(/#\/bgp$/);

  await page.goto(
    `/#/bgp?step=${peering.steps.findIndex((step) => step.id === "advertise")}`,
  );
  await expect(page.locator(".scene")).toHaveAttribute(
    "data-step",
    "advertise",
  );
  await expect(page.locator(".packet")).toBeVisible();
  await expect(page.locator(".network-lan")).toHaveCount(2);
  await expect(page.locator('[data-network="r1-lan"]')).toContainText(
    "203.0.113.0/24",
  );
  await expect(page.locator('[data-network="r1-lan"]')).toHaveAttribute(
    "data-active",
    "true",
  );
  await expect(page.locator('[data-network="r2-lan"]')).toContainText(
    "198.51.100.0/24",
  );
  await expect(page.locator('[data-network="r2-lan"]')).toHaveAttribute(
    "data-active",
    "false",
  );
  await expect(page.locator(".network-diagram")).toHaveAttribute(
    "data-network-action",
    "advertise",
  );
  await expect(page.locator(".network-diagram-caption")).toHaveText(
    "203.0.113.0/24 → R2へ広告",
  );
  await expect(r1Table.locator("caption")).toContainText("R1の経路表");
  await expectRoute(r1Table, "203.0.113.0/24", "直結", "-");
  await expect(r2Table.locator("caption")).toContainText("R2の経路表");
  await expect(r2Table.locator("caption")).toContainText("R1から受信中");
  await expectRoute(r2Table, "198.51.100.0/24", "直結", "-");
  await expect(r2Table.locator("tbody tr")).toHaveCount(1);
  await page.locator(".callout h2").click();
  const progress = await page.locator(".packet").getAttribute("data-progress");
  await page.clock.runFor(7000);
  await expect(page.locator(".packet")).toHaveAttribute(
    "data-progress",
    progress!,
  );
  await page.getByRole("button", { name: "詳しく見る ↗" }).click();
  await expect(page.getByRole("dialog")).toContainText("AS_PATH=65001");
  await expect(page.locator(".model-notes p")).toHaveCount(5);
  await expect(page.locator(".model-notes p").first()).toContainText(
    "ASはネットワークの管理単位です",
  );
  await page.keyboard.press("Escape");

  await page.goto(
    `/#/bgp?step=${peering.steps.findIndex((step) => step.id === "accept-route")}`,
  );
  await expectRoute(r2Table, "198.51.100.0/24", "直結", "-");
  await expectRoute(r2Table, "203.0.113.0/24", "BGP", "R1");
  await page.reload();
  await expectRoute(r2Table, "203.0.113.0/24", "BGP", "R1");

  await page.goto(
    `/#/bgp?step=${peering.steps.findIndex((step) => step.id === "advertise-r2")}`,
  );
  await expect(page.locator(".network-diagram-caption")).toHaveText(
    "198.51.100.0/24 → R1へ広告",
  );
  await expect(r1Table.locator("tbody tr")).toHaveCount(1);

  await page.goto(
    `/#/bgp?step=${peering.steps.findIndex((step) => step.id === "accept-route-r1")}`,
  );
  await expectRoute(r1Table, "203.0.113.0/24", "直結", "-");
  await expectRoute(r1Table, "198.51.100.0/24", "BGP", "R2");
  await expectRoute(r2Table, "198.51.100.0/24", "直結", "-");
  await expectRoute(r2Table, "203.0.113.0/24", "BGP", "R1");
  await page.reload();
  await expect(r1Table.locator("tbody tr")).toHaveCount(2);
  await expect(r2Table.locator("tbody tr")).toHaveCount(2);

  await page.goto(
    `/#/bgp?step=${peering.steps.findIndex((step) => step.id === "origin-unavailable")}`,
  );
  await expect(page.locator('[data-network-link="r1-lan"]')).toHaveAttribute(
    "data-state",
    "down",
  );
  await expect(page.locator(".network-peer-link")).toHaveAttribute(
    "data-state",
    "up",
  );
  await expect(page.locator(".network-diagram-caption")).toHaveText(
    "R1側LANは切断。R1–R2間は接続中",
  );
  await expect(r1Table.locator("tbody tr")).toHaveCount(1);
  await expectRoute(r1Table, "198.51.100.0/24", "BGP", "R2");
  await expectRoute(r2Table, "203.0.113.0/24", "BGP", "R1");

  await page.goto(
    `/#/bgp?step=${peering.steps.findIndex((step) => step.id === "withdraw")}`,
  );
  await expect(page.locator(".network-diagram")).toHaveAttribute(
    "data-network-action",
    "withdraw",
  );
  await expect(page.locator('[data-network-link="r1-lan"]')).toHaveAttribute(
    "data-state",
    "down",
  );
  await expect(page.locator(".network-peer-link")).toHaveAttribute(
    "data-state",
    "up",
  );
  await expect(page.locator(".network-diagram-caption")).toHaveText(
    "203.0.113.0/24 → R2へ撤回",
  );
  await expect(r1Table.locator("tbody tr")).toHaveCount(1);
  await expect(r2Table.locator("caption")).toContainText("撤回を受信中");
  await expectRoute(r2Table, "203.0.113.0/24", "BGP", "R1");
  await page.reload();
  await expect(page.locator(".network-diagram")).toHaveAttribute(
    "data-network-action",
    "withdraw",
  );
  await expect(page.locator('[data-network-link="r1-lan"]')).toHaveAttribute(
    "data-state",
    "down",
  );

  await page.getByRole("button", { name: "最後に進む" }).click();
  await expect(page.locator(".scene")).toHaveAttribute(
    "data-step",
    "remove-route",
  );
  await expect(page.locator(".callout")).toContainText(
    "経路を候補から除きます",
  );
  await expectRoute(r1Table, "198.51.100.0/24", "BGP", "R2");
  await expect(r1Table.locator("tbody tr")).toHaveCount(1);
  await expect(r2Table.locator("caption")).toContainText("R1の経路を削除");
  await expectRoute(r2Table, "198.51.100.0/24", "直結", "-");
  await expect(r2Table.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator('[data-network-link="r1-lan"]')).toHaveAttribute(
    "data-state",
    "down",
  );
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute(
    "data-step",
    "remove-route",
  );
  await expectRoute(r2Table, "198.51.100.0/24", "直結", "-");
});

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [1280, 720],
  [844, 390],
  [667, 480],
  [667, 481],
  [640, 360],
]) {
  test(`BGP scenes fit ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await page.goto("/#/bgp");
    const positions = await page.evaluate(() =>
      [
        '[data-network="r1-lan"]',
        '[data-router="r1"]',
        '[data-router="r2"]',
        '[data-network="r2-lan"]',
      ].map((selector) => {
        const bounds = document
          .querySelector(selector)!
          .getBoundingClientRect();
        return bounds.left + bounds.width / 2;
      }),
    );
    expect(
      positions.every((x, index) => index === 0 || positions[index - 1] < x),
    ).toBe(true);
    for (const step of peering.steps) {
      await expect(page.locator(".scene")).toHaveAttribute(
        "data-step",
        step.id,
      );
      const errors = await page.evaluate(() => {
        const errors: string[] = [];
        for (const selector of [
          ".scene",
          ".network-diagram",
          ".routing-tables",
          ".callout",
          ".controls",
          ".masthead",
        ]) {
          const element = document.querySelector(selector)!;
          const bounds = element.getBoundingClientRect();
          if (
            bounds.left < 0 ||
            bounds.right > innerWidth ||
            bounds.bottom > innerHeight ||
            element.scrollHeight > element.clientHeight + 2
          )
            errors.push(selector);
        }
        if (document.documentElement.scrollWidth > innerWidth)
          errors.push("horizontal scroll");
        const callout = document
          .querySelector(".callout")!
          .getBoundingClientRect();
        const controls = document
          .querySelector(".controls")!
          .getBoundingClientRect();
        const diagram = document
          .querySelector(".network-diagram")!
          .getBoundingClientRect();
        if (diagram.bottom > callout.top - 2)
          errors.push("diagram overlaps callout");
        if (callout.bottom > controls.top - 2)
          errors.push("callout overlaps controls");
        const stageBottom = document
          .querySelector(".stage-bottom")!
          .getBoundingClientRect();
        if (callout.bottom > stageBottom.top - 2)
          errors.push(
            `callout overlaps stage hint: callout ${Math.round(callout.top)}–${Math.round(callout.bottom)}, hint ${Math.round(stageBottom.top)}, tables ${Math.round(document.querySelector(".routing-tables")!.getBoundingClientRect().top)}–${Math.round(document.querySelector(".routing-tables")!.getBoundingClientRect().bottom)}`,
          );
        const tables = [...document.querySelectorAll(".routing-table")];
        if (tables.length !== 2) errors.push("routing table count");
        const [r1, r2] = tables.map((element) =>
          element.getBoundingClientRect(),
        );
        const compactLandscape =
          (innerWidth > 650 && innerHeight <= 560) ||
          (innerWidth <= 650 && innerWidth > innerHeight);
        if (compactLandscape) {
          if (r1.bottom > r2.top - 2 || r1.right > callout.left - 2)
            errors.push("routing table placement");
        } else if (
          r1.right > r2.left - 2 ||
          r1.bottom > callout.top - 2 ||
          r2.bottom > callout.top - 2
        )
          errors.push(
            `routing table placement: R1 ${Math.round(r1.top)}–${Math.round(r1.bottom)}, R2 ${Math.round(r2.top)}–${Math.round(r2.bottom)}, callout ${Math.round(callout.top)}`,
          );
        if (diagram.bottom > Math.min(r1.top, r2.top) - 2)
          errors.push("diagram overlaps tables");
        for (const table of tables)
          if (table.scrollWidth > table.clientWidth + 2)
            errors.push("routing table text");
        for (const cell of document.querySelectorAll(".routing-table tbody td"))
          if (cell.scrollWidth > cell.clientWidth + 2)
            errors.push(
              `routing table cell text: ${cell.textContent} ${cell.clientWidth}/${cell.scrollWidth}`,
            );
        for (const lan of document.querySelectorAll(".network-lan")) {
          if (lan.scrollWidth > lan.clientWidth + 2) errors.push("LAN label");
        }
        return errors;
      });
      expect(errors, step.id).toEqual([]);
      if (
        [
          "advertise",
          "accept-route",
          "accept-route-r1",
          "withdraw",
          "remove-route",
        ].includes(step.id)
      )
        await page.screenshot({
          path: test.info().outputPath(`bgp-${step.id}.png`),
        });
      if (step.id !== "remove-route")
        await page.getByRole("button", { name: "次へ", exact: true }).click();
    }
    await page.screenshot({ path: test.info().outputPath("bgp.png") });
  });
}
