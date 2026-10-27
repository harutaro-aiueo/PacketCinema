import { expect, it } from "vitest";
import { icmp } from "./index";
import { createCatalog } from "../../app/catalog";
import { udp } from "../udp";
import { ipv4Forwarding } from "../ipv4-forwarding";
import { arp } from "../arp";

const steps = icmp.scenarios[0].steps;

it("returns an IPv4 Echo Reply with the request's identifier, sequence and data", () => {
  expect(() => createCatalog([
    { protocol: icmp, publishedScenarioIds: ["ipv4-echo"] },
    { protocol: udp, publishedScenarioIds: ["ipv4-datagram"] },
    { protocol: ipv4Forwarding, publishedScenarioIds: ["direct-and-gateway"] },
    { protocol: arp, publishedScenarioIds: ["ipv4-ethernet"] },
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
    { protocol: ipv4Forwarding, publishedScenarioIds: ["direct-and-gateway"] },
    { protocol: arp, publishedScenarioIds: ["ipv4-ethernet"] },
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

it("drops a TTL=1 datagram at the router and reports Time Exceeded to its source", () => {
  const ttl = icmp.scenarios.find((scenario) => scenario.id === "ttl-exceeded")!;
  expect(ttl.topology?.kind).toBe("path");
  expect(ttl.steps.map((step) => step.id)).toEqual([
    "prepare-low-ttl", "to-router", "ttl-zero-drop", "time-exceeded", "identify-hop",
  ]);
  expect(ttl.steps[1]).toMatchObject({ kind: "message", from: "sender", to: "router" });
  expect(ttl.steps[2]).toMatchObject({ kind: "local", node: "router" });
  expect(ttl.steps[2].fields).toContain("転送時TTL：0");
  expect(ttl.steps[2].fields).toContain("宛先への転送：なし");
  expect(ttl.steps[3]).toMatchObject({ kind: "message", from: "router", to: "sender" });
  expect(ttl.steps[3].fields).toContain("ICMP Type：11 / Code：0");
  expect(ttl.steps[3].fields).toContain("引用内宛先IPv4：198.51.100.20");
  expect(ttl.steps.some((step) => step.kind === "message" && step.to === "target")).toBe(false);
});
