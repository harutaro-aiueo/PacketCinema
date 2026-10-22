import { expect, it } from "vitest";
import { ethernet } from "./index";

it("learns source MAC addresses before forwarding to a known destination", () => {
  const steps = ethernet.scenarios[0].steps;
  expect(steps.map((step) => step.id)).toEqual([
    "first-frame", "learn-a", "unknown-forward", "reply", "learn-b", "known-forward",
  ]);
  expect(steps[1].fields).toContain("学習：VLAN 10 / 末尾0A → ポート1");
  expect(steps[2]).toMatchObject({ kind: "message", from: "sw", to: "b" });
  expect(steps[4].fields).toContain("VLAN 10：末尾0B → ポート2");
  expect(steps[5]).toMatchObject({ kind: "message", from: "sw", to: "a" });
});

it("keeps a frame in its ingress VLAN without modeling a cross-VLAN send", () => {
  const steps = ethernet.scenarios[1].steps;
  expect(steps.map((step) => step.id)).toEqual([
    "vlan10-frame", "vlan-boundary", "routing-needed",
  ]);
  expect(steps[0]).toMatchObject({ kind: "message", from: "a", to: "sw" });
  expect(steps.slice(1).every((step) => step.kind === "local" && step.node === "sw")).toBe(true);
  expect(steps[1].fields).toContain("ポート2：VLAN 20");
});
