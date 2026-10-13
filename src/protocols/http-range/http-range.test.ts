import { expect, it } from "vitest";
import { httpRange } from "./index";

it("requests consecutive byte ranges and combines only matching strong validators", () => {
  const steps = httpRange.scenarios[0].steps;
  expect(steps.map((step) => step.id)).toEqual([
    "first-range", "first-206", "second-range", "second-206", "combine",
  ]);
  expect(steps[0]).toMatchObject({ kind: "message", from: "browser", to: "server" });
  expect(steps[0].wire).toContain("Range: bytes=0-99");
  expect(steps[1]).toMatchObject({ kind: "message", from: "server", to: "browser" });
  expect(steps[1].wire).toContain("Content-Range: bytes 0-99/1000");
  expect(steps[2].wire).toContain("Range: bytes=100-199");
  expect(steps[3].wire).toContain("Content-Range: bytes 100-199/1000");
  expect(steps[1].wire).toContain('ETag: "v1"');
  expect(steps[3].wire).toContain('ETag: "v1"');
  expect(steps[4]).toMatchObject({ kind: "local", node: "browser" });
});
