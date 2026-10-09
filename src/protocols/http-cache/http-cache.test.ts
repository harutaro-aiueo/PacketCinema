import { expect, it } from "vitest";
import { createCatalog } from "../../app/catalog";
import { httpCache } from "./index";
import { tcp } from "../tcp";

it("revalidates a stored ETag and reuses the response body after 304", () => {
  expect(() => createCatalog([
    { protocol: tcp, publishedScenarioIds: ["handshake"] },
    { protocol: httpCache, publishedScenarioIds: ["etag-revalidation"] },
  ])).not.toThrow();
  const steps = httpCache.scenarios[0].steps;
  expect(steps.map((step) => step.id)).toEqual([
    "first-get", "first-200", "store", "stale", "conditional-get", "not-modified", "reuse",
  ]);
  expect(steps[1].fields).toContain('ETag："v1"');
  expect(steps[4]).toMatchObject({ kind: "message", from: "browser", to: "server" });
  expect(steps[4].fields).toContain('If-None-Match："v1"');
  expect(steps[5]).toMatchObject({ kind: "message", from: "server", to: "browser" });
  expect(steps[5].fields).toContain("Content：なし");
  expect(steps[6].fields).toContain("画像本体：保存済みのもの");
});
