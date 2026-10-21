import { expect, it } from "vitest";
import { catalog } from "../../app/catalog";
import { napt } from "./index";

const scenario = napt.scenarios[0];
const steps = scenario.steps;

it("maps the outbound UDP tuple and reverses the destination on reply", () => {
  expect(catalog.find((protocol) => protocol.id === "napt")?.scenarios.map((item) => item.id)).toEqual(["udp-outbound"]);
  expect(steps.map((step) => step.id)).toEqual([
    "prepare", "inside-send", "create-mapping", "outside-send",
    "choose-reply", "outside-reply", "reverse-mapping", "inside-reply",
  ]);
  expect(steps.filter((step) => step.kind === "message").map((step) => [step.from, step.to])).toEqual([
    ["host", "router"], ["router", "server"], ["server", "router"], ["router", "host"],
  ]);
  expect(steps[1].fields).toContain("送信元：192.0.2.10:53000");
  expect(steps[3].fields).toContain("送信元：198.51.100.1:62000");
  expect(steps[5].fields).toContain("宛先：198.51.100.1:62000");
  expect(steps[7].fields).toContain("宛先：192.0.2.10:53000");
  expect(steps[3].fields).toContain("宛先：203.0.113.20:40000");
  expect(steps[7].fields).toContain("送信元：203.0.113.20:40000");
  expect(steps[2].states?.router).toContain("↔");
  expect(steps[7].states?.router).toBe(steps[2].states?.router);
});
