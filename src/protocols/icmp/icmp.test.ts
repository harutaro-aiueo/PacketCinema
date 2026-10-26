import { expect, it } from "vitest";
import { icmp } from "./index";
import { createCatalog } from "../../app/catalog";
import { udp } from "../udp";

const steps = icmp.scenarios[0].steps;

it("returns an IPv4 Echo Reply with the request's identifier, sequence and data", () => {
  expect(() => createCatalog([
    { protocol: icmp, publishedScenarioIds: ["ipv4-echo"] },
    { protocol: udp, publishedScenarioIds: ["ipv4-datagram"] },
  ])).not.toThrow();
  expect(steps.map((step) => step.id)).toEqual(["prepare", "request", "receive", "reply", "match"]);
  expect(steps[1]).toMatchObject({ kind: "message", from: "sender", to: "target" });
  expect(steps[1].fields).toContain("Type：8 / Code：0");
  expect(steps[3]).toMatchObject({ kind: "message", from: "target", to: "sender" });
  expect(steps[3].fields).toContain("Type：0 / Code：0");
  for (const field of ["Identifier：0x1234 / Sequence Number：1", "Data：hello"])
    expect(steps[3].fields).toContain(field);
  expect(steps[3].fields).toContain("送信元IPv4：192.0.2.20");
  expect(steps[3].fields).toContain("宛先IPv4：192.0.2.10");
});

it("reports an unopened UDP destination port with the original datagram identity", () => {
  expect(() => createCatalog([
    { protocol: icmp, publishedScenarioIds: ["ipv4-echo", "udp-port-unreachable"] },
    { protocol: udp, publishedScenarioIds: ["ipv4-datagram"] },
  ])).not.toThrow();
  const unreachable = icmp.scenarios.find((scenario) => scenario.id === "udp-port-unreachable")!;
  expect(unreachable.steps.map((step) => step.id)).toEqual([
    "prepare-udp", "send-udp", "no-listener", "unreachable", "report-error",
  ]);
  expect(unreachable.steps[1]).toMatchObject({ kind: "message", from: "sender", to: "target" });
  expect(unreachable.steps[2].fields).toContain("待受アプリ：なし");
  expect(unreachable.steps[3]).toMatchObject({ kind: "message", from: "target", to: "sender" });
  expect(unreachable.steps[3].fields).toContain("ICMP Type：3 / Code：3");
  expect(unreachable.steps[3].fields).toContain("引用内UDP：53000 → 9999");
  expect(unreachable.notes.join(" ")).toContain("SHOULD");
});
