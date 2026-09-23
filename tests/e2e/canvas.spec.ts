import { test, expect } from "@playwright/test";
for (const [width, height] of [
  [320, 568],
  [390, 844],
  [1280, 720],
  [1024, 600],
  [844, 390],
]) {
  test(`キャンバス ${width}x${height} 全シーンがスクロールなしで収まる`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/ssh");
    await page.locator(".callout h2").click();
    await expect(page.getByRole("checkbox")).toHaveCount(0);
    await expect(page.locator(".controls button")).toHaveText([
      "最初から",
      "戻る",
      "もう一度",
      "次へ",
      "最後へ",
    ]);
    const sizes = await page.locator(".controls button").evaluateAll((nodes) =>
      nodes.map((n) => {
        const r = n.getBoundingClientRect();
        return [Math.round(r.width), Math.round(r.height)];
      }),
    );
    expect(new Set(sizes.map((s) => s.join(","))).size).toBe(1);
    await page.getByRole("button", { name: "最後へ" }).click();
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "done");
    await page.getByRole("button", { name: "最初から" }).click();
    await page.locator(".callout h2").click();
    for (let i = 0; i < 40; i++) {
      const errors = await page.evaluate(() => {
        const nodes = [
          ...document.querySelectorAll(
            ".callout,.actor,.controls button,.stage-bottom",
          ),
        ].filter((el) => el.getBoundingClientRect().width > 0);
        const bad = nodes
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return (
              r.top < 0 ||
              r.bottom > innerHeight ||
              r.left < 0 ||
              r.right > innerWidth ||
              el.scrollHeight > el.clientHeight + 2
            );
          })
          .map((el) => el.className || el.textContent);
        const callout = document
          .querySelector(".callout")!
          .getBoundingClientRect();
        const bottom = document
          .querySelector(".stage-bottom")!
          .getBoundingClientRect();
        if (callout.bottom > bottom.top) bad.push("解説が下部表示と重なる");
        if (
          document.documentElement.scrollHeight > innerHeight ||
          document.documentElement.scrollWidth > innerWidth
        )
          bad.push("ページスクロール");
        return bad;
      });
      expect(errors, `step ${i}`).toEqual([]);
      if (i < 39) await page.getByRole("button", { name: "次へ" }).click();
    }
    await page.screenshot({
      path: `test-results/canvas-${width}-${height}.png`,
    });
  });
}
test("詳細表示で時間が止まり、閉じると再開する。OSの動きを減らす設定でもパケットは動く", async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/ssh?step=1");
  await page.clock.runFor(1000);
  const p = Number(await page.locator(".packet").getAttribute("data-progress"));
  expect(p).toBeGreaterThan(0);
  await page.getByRole("button", { name: "詳しい解説 ↗" }).click();
  const frozen = await page.locator(".packet").getAttribute("data-progress");
  await page.clock.fastForward(15000);
  await expect(page.locator(".packet")).toHaveAttribute(
    "data-progress",
    frozen!,
  );
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const frozenProgress = Number(frozen);
  let resumedProgress = frozenProgress;
  for (
    let attempt = 0;
    attempt < 4 && resumedProgress <= frozenProgress;
    attempt++
  ) {
    await page.clock.runFor(250);
    await page.evaluate(
      () => new Promise<void>((resolve) => queueMicrotask(resolve)),
    );
    resumedProgress = Number(
      await page.locator(".packet").getAttribute("data-progress"),
    );
  }
  expect(resumedProgress).toBeGreaterThan(frozenProgress);
});

test("SSHコマンドを入力し、クリック停止・再開を経てTCP接続へ進む", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/#/ssh");
  await expect(
    page.getByRole("button", { name: "01SSH接続開始" }),
  ).toBeVisible();
  await page.clock.runFor(800);
  const typed = await page.locator(".command-line code").innerText();
  expect(typed.length).toBeGreaterThan(0);
  expect(typed.length).toBeLessThan("ssh learner@server".length);
  await page.locator(".command-terminal").click();
  const frozenInput = await page.locator(".command-line code").innerText();
  await page.clock.fastForward(10000);
  await expect(page.locator(".command-line code")).toHaveText(frozenInput);
  await page.locator(".command-terminal").click();
  await page.clock.runFor(1750);
  await expect(page.locator(".command-line code")).toHaveText(
    "ssh learner@server",
  );
  await expect(page.locator(".enter-line")).toContainText("Enter");
  await page.clock.runFor(1000);
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "syn");
});

test("端末内の全処理が進行し、停止でき、通信と同じウィンドウ位置を使う", async ({
  page,
}) => {
  const { ssh } = await import("../../src/protocols/ssh");
  const sshSteps = ssh.scenarios.find(
    (s) => s.id === ssh.defaultScenarioId,
  )!.steps;
  await page.clock.install();
  for (const step of sshSteps.filter((s) => s.kind === "local")) {
    const i = sshSteps.indexOf(step);
    await page.goto(`/#/ssh?step=${i}`);
    await page.reload();
    await page.clock.runFor(500);
    const before = await page
      .locator(".local-progress span")
      .getAttribute("style");
    await page.clock.runFor(600);
    expect(
      await page.locator(".local-progress span").getAttribute("style"),
    ).not.toBe(before);
    await page.locator(".command-terminal").click();
    const frozen = await page
      .locator(".local-progress span")
      .getAttribute("style");
    await page.clock.fastForward(6000);
    await expect(page.locator(".local-progress span")).toHaveAttribute(
      "style",
      frozen!,
    );
    await expect(page.locator(".packet")).toHaveCount(0);
  }
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/#/ssh?step=0");
    const local = await page.locator(".callout").boundingBox();
    await page.getByRole("button", { name: "次へ" }).click();
    const network = await page.locator(".callout").boundingBox();
    expect(network).toEqual(local);
  }
});
