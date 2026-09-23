import { expect, test } from "@playwright/test";

const landscapeSizes = [
  { width: 844, height: 390 },
  { width: 667, height: 375 },
  { width: 640, height: 360 },
];

function overlaps(
  first: { x: number; y: number; width: number; height: number },
  second: { x: number; y: number; width: number; height: number },
) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

for (const size of landscapeSizes) {
  test(`landscape ${size.width}x${size.height} keeps the packet corridor clear`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.clock.install();
    await page.goto("/#/ssh?step=1");
    await page.clock.runFor(2500);

    const packet = await page.locator(".packet").boundingBox();
    const route = await page.locator(".route").boundingBox();
    const callout = await page.locator(".callout").boundingBox();
    expect(packet).not.toBeNull();
    expect(route).not.toBeNull();
    expect(callout).not.toBeNull();
    expect(
      overlaps(packet!, callout!),
      JSON.stringify({ packet, route, callout }),
    ).toBe(false);
    expect(overlaps(route!, callout!)).toBe(false);
    expect(await page.locator(".actor strong").allTextContents()).toEqual([
      "CLIENT",
      "SERVER",
    ]);
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBeLessThanOrEqual(size.height);
    await page.screenshot({ path: test.info().outputPath("mid-transit.png") });

    const networkPosition = { x: callout!.x, y: callout!.y };
    await page.getByRole("button", { name: "戻る" }).click();
    const localCallout = await page.locator(".callout").boundingBox();
    expect(localCallout).not.toBeNull();
    expect(localCallout).toMatchObject(networkPosition);
  });
}

for (const size of landscapeSizes) {
  test(`landscape ${size.width}x${size.height} fits every callout and footer`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#/ssh?step=0");
    await page.locator(".callout h2").click();

    for (let step = 0; step < 40; step++) {
      const callout = page.locator(".callout");
      expect(
        await callout.evaluate(
          (element) => element.scrollHeight <= element.clientHeight,
        ),
      ).toBe(true);
      const calloutBox = await callout.boundingBox();
      const footerBox = await page.locator(".stage-bottom").boundingBox();
      expect(calloutBox).not.toBeNull();
      expect(footerBox).not.toBeNull();
      expect(overlaps(calloutBox!, footerBox!)).toBe(false);
      if (step < 39) await page.getByRole("button", { name: "次へ" }).click();
    }
  });
}
