import { test, expect } from "@playwright/test";
test("一覧からSSHを開き、表示・方式を切り替え、TCPから復帰できる", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link")
    .filter({ hasText: "公開鍵認証 / パスワード認証" })
    .click();
  await expect(
    page.getByRole("heading", { name: "対応するSSHバージョンを伝える" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "次のステップ", exact: true }).click();
  await page.getByRole("button", { name: "技術的な詳細", exact: true }).click();
  await expect(page.locator(".technical")).toContainText(
    "SSH-2.0-example_server",
  );
  await page.getByLabel("認証方式").selectOption("password");
  await expect(
    page.getByRole("heading", { name: "ユーザー認証サービスを要求する" }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "12. 暗号化された通信路でパスワードを送る",
      exact: true,
    })
    .click();
  await expect(page.locator(".protection")).toContainText(
    "暗号化・完全性保護あり",
  );
  const original = page.url();
  await page.getByRole("button", { name: "TCP接続の詳細" }).click();
  await expect(
    page.getByRole("heading", { name: "接続を始めたいと伝える" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "SSHの続きに戻る" }).click();
  await expect(page).toHaveURL(original);
  await expect(page.getByLabel("認証方式")).toHaveValue("password");
  await expect(page.locator(".technical")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "▶ 再生", exact: true }),
  ).toBeVisible();
});
test("再生と停止、速度変更、終端、キーボード操作", async ({ page }) => {
  await page.goto("/#/tcp");
  await page.clock.install();
  await page.getByRole("button", { name: "▶ 再生", exact: true }).click();
  await page.clock.runFor(1200);
  const x = await page.locator(".packet").getAttribute("cx");
  expect(Number(x)).toBeGreaterThan(115);
  await page.getByRole("button", { name: "Ⅱ 停止", exact: true }).click();
  const pausedX = await page.locator(".packet").getAttribute("cx");
  await page.clock.runFor(4000);
  expect(await page.locator(".packet").getAttribute("cx")).toBe(pausedX);
  await page.getByLabel("再生速度").selectOption("2");
  await page.getByRole("button", { name: "▶ 再生", exact: true }).click();
  await page.clock.runFor(5000);
  await expect(
    page.getByRole("button", { name: "次のステップ", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "▶ 再生", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "最初に戻る", exact: true }).click();
  await page.locator("h1").click();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".counter")).toContainText("02");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".counter")).toContainText("01");
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Ⅱ 停止", exact: true }),
  ).toBeVisible();
});
test("再生中の詳細切り替えを維持し、最後のステップでもその場で停止できる", async ({
  page,
}) => {
  await page.goto("/#/tcp");
  await page.clock.install();
  await page.getByRole("button", { name: "▶ 再生", exact: true }).click();
  await page.getByRole("button", { name: "技術的な詳細", exact: true }).click();
  await page.clock.runFor(3500);
  await expect(page.locator(".technical")).toBeVisible();
  await expect(page.locator(".counter")).toContainText("02");
  await page.clock.runFor(3100);
  await expect(page.locator(".counter")).toContainText("03");
  await page.getByRole("button", { name: "Ⅱ 停止", exact: true }).click();
  await expect(page.locator(".counter")).toContainText("03");
});
test("直接アクセス、範囲外ステップ、履歴、動きを減らす設定", async ({
  page,
}) => {
  await page.goto("/#/ssh?step=999&auth=password&detail=1");
  await expect(
    page.getByRole("heading", { name: "チャネル終了に応答する" }),
  ).toBeVisible();
  await page.getByLabel("動きを減らす").check();
  await expect(page.locator(".packet")).toHaveCount(0);
  await page.getByRole("button", { name: "TCP接続の詳細" }).click();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "チャネル終了に応答する" }),
  ).toBeVisible();
  await page.goto("/#/missing");
  await expect(page.getByRole("status")).toContainText("見つかりません");
});
for (const width of [390, 1280])
  test(`幅${width}で図と詳細に欠落がない`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#/ssh?step=16&detail=1");
    await expect(page.locator(".technical")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "次のステップ", exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole("button", { name: "次のステップ", exact: true }),
    ).toBeInViewport();
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: `test-results/ssh-${width}.png`,
      fullPage: true,
    });
  });
