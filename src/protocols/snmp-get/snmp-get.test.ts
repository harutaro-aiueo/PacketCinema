import { expect, it } from "vitest";
import { createCatalog } from "../../app/catalog";
import { snmpGet } from "./index";

it("reads one MIB instance with matching request IDs and a successful response", () => {
  expect(() => createCatalog([{ protocol: snmpGet, publishedScenarioIds: ["uptime-read"] }])).not.toThrow();
  const steps = snmpGet.scenarios[0].steps;
  expect(steps.map((step) => step.id)).toEqual(["get", "lookup", "response"]);
  expect(steps[0]).toMatchObject({ kind: "message", from: "manager", to: "agent" });
  expect(steps[2]).toMatchObject({ kind: "message", from: "agent", to: "manager" });
  expect(steps[0].fields).toContain("OID：1.3.6.1.2.1.1.3.0（sysUpTime.0）");
  expect(steps[0].fields).toContain("request-id：41（教材用）");
  expect(steps[2].fields).toContain("request-id：41");
  expect(steps[2].fields).toContain("error-status：noError");
  expect(steps[2].fields).toContain("error-index：0");
});
