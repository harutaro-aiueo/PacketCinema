import { expect, it } from "vitest";
import { arp } from "./index";
import { createCatalog } from "../../app/catalog";

const steps = arp.scenarios[0].steps;

it("resolves a missing IPv4 mapping with a broadcast request and direct reply", () => {
  expect(() => createCatalog([{ protocol: arp, publishedScenarioIds: ["ipv4-ethernet"] }])).not.toThrow();
  expect(steps.map((step) => step.id)).toEqual(["lookup", "request", "match", "reply", "remember"]);
  expect(steps[1]).toMatchObject({ kind: "message", from: "a", to: "b" });
  expect(steps[1].fields).toContain("Ethernet宛先：ブロードキャスト");
  expect(steps[1].fields).toContain("対象MAC：未指定");
  expect(steps[3]).toMatchObject({ kind: "message", from: "b", to: "a" });
  expect(steps[3].fields).toContain("Ethernet宛先：02:00:00:00:00:10");
  expect(steps[4].wire).toContain("192.0.2.20 → 02:00:00:00:00:20");
});
