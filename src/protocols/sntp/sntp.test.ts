import { expect, it } from "vitest";
import { createCatalog } from "../../app/catalog";
import { sntp } from "./index";

const steps = sntp.scenarios[0].steps;

it("shows the unicast SNTPv4 exchange and four timestamp calculation", () => {
  expect(() => createCatalog([{ protocol: sntp, publishedScenarioIds: ["unicast-clock"] }])).not.toThrow();
  expect(steps.map((step) => step.id)).toEqual(["prepare", "request", "receive", "reply", "estimate"]);
  expect(steps[1]).toMatchObject({ kind: "message", from: "client", to: "server" });
  expect(steps[1].fields).toContain("Mode：3（client）");
  expect(steps[3]).toMatchObject({ kind: "message", from: "server", to: "client" });
  expect(steps[3].fields).toContain("Mode：4（server）");
  expect(steps[3].fields).toContain("Originate Timestamp T1：12:00:00.000");
  expect(steps[4].fields).toContain("往復遅延：(120−0)−(170−150) = 100ms");
  expect(steps[4].fields).toContain("時計のずれ：((150−0)+(170−120))/2 = +100ms");
});
