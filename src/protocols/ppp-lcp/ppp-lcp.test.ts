import { expect, it } from "vitest";
import { createCatalog } from "../../app/catalog";
import { pppLcp } from "./index";

it("acknowledges each peer's own LCP request before completion", () => {
  expect(() => createCatalog([{ protocol: pppLcp, publishedScenarioIds: ["link-open"] }])).not.toThrow();
  const steps = pppLcp.scenarios[0].steps;
  expect(steps.map((step) => step.id)).toEqual(["a-request", "b-request", "a-ack", "b-ack"]);
  expect(steps.map((step) => step.kind === "message" && `${step.from}->${step.to}`)).toEqual([
    "a->b", "b->a", "a->b", "b->a",
  ]);
  expect(steps.map((step) => step.wire.match(/ID=(\d)/)?.[1])).toEqual(["1", "2", "2", "1"]);
  expect(steps.slice(2).map((step) => step.wire)).toEqual([
    "LCP Configure-Ack · ID=2 · Options=なし", "LCP Configure-Ack · ID=1 · Options=なし",
  ]);
});
