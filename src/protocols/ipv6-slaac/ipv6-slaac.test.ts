import { expect, it } from "vitest";
import { ipv6Slaac } from "./index";
import { ipv6Nd } from "../ipv6-nd";
import { arp } from "../arp";
import { createCatalog } from "../../app/catalog";

it("discovers a router and makes an address usable only after duplicate detection", () => {
  expect(() => createCatalog([
    { protocol: arp, publishedScenarioIds: ["ipv4-ethernet"] },
    { protocol: ipv6Nd, publishedScenarioIds: ["neighbor-address"] },
    { protocol: ipv6Slaac, publishedScenarioIds: ["router-advertisement"] },
  ])).not.toThrow();
  const steps = ipv6Slaac.scenarios[0].steps;
  expect(steps.map((step) => step.id)).toEqual(["rs", "ra", "router-list", "tentative", "usable"]);
  expect(steps[0]).toMatchObject({ kind: "message", from: "host", to: "router" });
  expect(steps[0].fields).toContain("宛先IPv6：ff02::2");
  expect(steps[1]).toMatchObject({ kind: "message", from: "router", to: "host" });
  expect(steps[1].fields).toContain("宛先IPv6：ff02::1");
  expect(steps[1].fields).toContain("A=1 / L=1");
  expect(steps[2].fields).toContain("デフォルトルーター：fe80::1");
  expect(steps[3].fields).toContain("状態：仮アドレス");
  expect(steps[4].fields).toContain("重複確認：成功と仮定");
});
