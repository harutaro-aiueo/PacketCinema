import { expect, it } from "vitest";
import { ipv6Nd } from "./index";
import { createCatalog } from "../../app/catalog";
import { arp } from "../arp";

const steps = ipv6Nd.scenarios[0].steps;

it("resolves an IPv6 neighbor through multicast NS and solicited unicast NA", () => {
  expect(() => createCatalog([
    { protocol: arp, publishedScenarioIds: ["ipv4-ethernet"] },
    { protocol: ipv6Nd, publishedScenarioIds: ["neighbor-address"] },
  ])).not.toThrow();
  expect(steps.map((step) => step.id)).toEqual([
    "incomplete", "solicitation", "target-check", "advertisement", "reachable",
  ]);
  expect(steps[0].fields).toContain("近隣キャッシュ：INCOMPLETE");
  expect(steps[1]).toMatchObject({ kind: "message", from: "a", to: "b" });
  expect(steps[1].fields).toContain("IPv6宛先：ff02::1:ff00:20");
  expect(steps[1].fields).toContain("Source Link-Layer Address：02:00:00:00:00:10");
  expect(steps[3]).toMatchObject({ kind: "message", from: "b", to: "a" });
  expect(steps[3].fields).toContain("Solicited：1");
  expect(steps[4].fields).toContain("近隣キャッシュ：REACHABLE");
});
