import { expect, it } from "vitest";
import { icmp } from "./index";
import { createCatalog } from "../../app/catalog";

const steps = icmp.scenarios[0].steps;

it("returns an IPv4 Echo Reply with the request's identifier, sequence and data", () => {
  expect(() => createCatalog([{ protocol: icmp, publishedScenarioIds: ["ipv4-echo"] }])).not.toThrow();
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
