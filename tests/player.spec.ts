import { test, expect } from "@playwright/test";
test("操作せずSSHの開始から終了まで連続再生し最後で止まる", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.clock.install();
  await page.goto("/");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "command");
  const seen: string[] = [];
  for (let i = 0; i < 40; i++) {
    seen.push((await page.locator(".scene").getAttribute("data-step"))!);
    await page.clock.fastForward(6050);
  }
  expect(new Set(seen).size).toBe(40);
  expect(seen).toContain("key-sign");
  expect(seen).toContain("exit-data");
  expect(seen.at(-1)).toBe("done");
  await expect(page.getByRole("status")).toHaveText("再生完了");
  await page.clock.runFor(12000);
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "done");
  await page.getByRole("button", { name: "最初から" }).click();
  await page.clock.runFor(6100);
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "syn");
});
test("公開鍵認証から操作・切断まで全ステップを手動で進める", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator(".callout h2").click();
  const ids: string[] = [];
  const next = page.getByRole("button", { name: "次へ" });
  for (let i = 0; i < 60; i++) {
    ids.push((await page.locator(".scene").getAttribute("data-step"))!);
    await expect(page.locator(".callout h2")).toBeVisible();
    if (await next.isDisabled()) break;
    await next.click();
  }
  expect(ids[0]).toBe("command");
  expect(ids.at(-1)).toBe("done");
  expect(ids.indexOf("newkeys-s")).toBeLessThan(ids.indexOf("key-sign"));
  expect(ids.indexOf("shell-ok")).toBeLessThan(ids.indexOf("whoami"));
  expect(ids.indexOf("output")).toBeLessThan(ids.indexOf("exit-data"));
  expect(ids.indexOf("close-c")).toBeLessThan(ids.indexOf("fin-c"));
  expect(ids).not.toContain("password");
  await expect(page.locator(".packet")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "done");
  await page.getByRole("button", { name: "最初から" }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "command");
});
test("段階移動、キーボード、範囲外URL、TCP直接アクセス", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/ssh?step=999");
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "done");
  await page.getByRole("button", { name: "03鍵交換" }).click();
  await expect(page.locator(".scene")).toHaveAttribute(
    "data-step",
    "version-c",
  );
  await page.locator("h1").click();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".scene")).toHaveAttribute(
    "data-step",
    "version-s",
  );
  await page.getByRole("link", { name: "TCP", exact: true }).click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "syn");
  await page.goBack();
  await expect(page.locator(".scene")).toHaveAttribute(
    "data-step",
    "version-s",
  );
});
for (const width of [320, 390, 1280])
  test(`幅${width}で解説と操作が収まる`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#/ssh?step=9");
    await expect(page.locator(".callout")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const bounds = await page.locator(".callout").boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `test-results/ssh-redesign-${width}.png`,
      fullPage: true,
    });
  });

test("移動中も解説が表示され、クリックでその位置に停止し再開する", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/#/ssh?step=1");
  await page.clock.runFor(1200);
  await expect(page.locator(".callout p")).toBeVisible();
  await page.locator(".callout h2").click();
  await expect(page.getByRole("status")).toHaveText("一時停止");
  const p = await page.locator(".packet").getAttribute("data-progress");
  expect(Number(p)).toBeGreaterThan(0);
  expect(Number(p)).toBeLessThan(1);
  await page.clock.runFor(10000);
  await expect(page.locator(".packet")).toHaveAttribute("data-progress", p!);
  await page.locator(".callout h2").click();
  await page.clock.runFor(600);
  expect(
    Number(await page.locator(".packet").getAttribute("data-progress")),
  ).toBeGreaterThan(Number(p));
  await page.locator("h1").click();
  await page.keyboard.press("Space");
  await expect(page.getByRole("status")).toHaveText("一時停止");
  await page.getByRole("button", { name: "もう一度" }).click();
  await expect(page.getByRole("status")).toHaveText("送信中");
  await page.clock.runFor(5200);
  await expect(page.getByRole("button", { name: "次へ" })).toBeEnabled();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "syn");
});

test("端末内の処理と到着後も停止でき、停止中の段階移動で勝手に再開しない", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.locator(".callout h2").click();
  await page.clock.runFor(20000);
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "command");
  await page.getByRole("button", { name: "次へ" }).click();
  await page.clock.runFor(20000);
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "syn");
  await page.locator(".callout h2").click();
  await page.clock.runFor(5200);
  await page.locator(".callout h2").click();
  await page.clock.runFor(20000);
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "syn");
  await page.locator(".callout h2").click();
  await page.clock.runFor(1000);
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "syn-ack");
});
