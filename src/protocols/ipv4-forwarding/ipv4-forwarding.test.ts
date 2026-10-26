import { expect, it } from "vitest";
import { ipv4Forwarding } from "./index";

const scenario = ipv4Forwarding.scenarios[0];
const steps = scenario.steps;

it("compares direct delivery with forwarding over exactly two links", () => {
  expect(scenario.topology?.kind).toBe("path");
  expect(scenario.topology?.links.map((link) => [link.from, link.to])).toEqual([
    ["host", "router"],
    ["router", "target"],
  ]);
  expect(steps.map((step) => step.id)).toEqual([
    "direct-decision", "direct-frame", "direct-receive",
    "remote-decision", "to-gateway", "route-lookup", "to-target",
  ]);
  expect(steps[1]).toMatchObject({ kind: "message", from: "host", to: "router" });
  expect(steps[2]).toMatchObject({ kind: "local", node: "router" });
  expect(steps[4]).toMatchObject({ kind: "message", from: "host", to: "router" });
  expect(steps[6]).toMatchObject({ kind: "message", from: "router", to: "target" });
  expect(steps[0].fields).toContain("次ホップIP：192.0.2.1");
  expect(steps[3].fields).toContain("次ホップIP：192.0.2.1");
  expect(steps[5].fields).toContain("次ホップIP：198.51.100.20");
});

it("keeps the remote IP destination while Ethernet MACs and TTL change", () => {
  const first = steps[4], last = steps[6];
  expect(first.wire).toContain("IPv4 192.0.2.10 → 198.51.100.20, TTL=64");
  expect(last.wire).toContain("IPv4 192.0.2.10 → 198.51.100.20, TTL=63");
  expect(first.fields).toContain("Ethernet宛先MAC：02:00:00:00:01:01");
  expect(last.fields).toContain("Ethernet宛先MAC：02:00:00:00:02:20");
  expect(first.fields).toContain("Ethernet送信元MAC：02:00:00:00:01:10");
  expect(last.fields).toContain("Ethernet送信元MAC：02:00:00:00:02:01");
  expect(steps[5].fields).toContain("TTL：64 → 63");
  for (const step of steps)
    expect(Object.keys(step.states ?? {}).sort()).toEqual(["host", "router", "target"]);
});
