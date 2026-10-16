import { expect, it } from "vitest";
import { createCatalog } from "../../app/catalog";
import { radius } from "./index";

it("requests access, checks conditions, and applies a matching accept", () => {
  expect(() => createCatalog([{ protocol: radius, publishedScenarioIds: ["access-accept"] }])).not.toThrow();
  const steps = radius.scenarios[0].steps;
  expect(steps.map((step) => step.id)).toEqual(["request", "verify", "accept", "service"]);
  expect(steps[0]).toMatchObject({ kind: "message", from: "nas", to: "server" });
  expect(steps[2]).toMatchObject({ kind: "message", from: "server", to: "nas" });
  expect(steps[0].fields).toContain("Identifier：7（教材用）");
  expect(steps[0].fields).toContain("NAS-Identifier：ネットワーク機器の識別子");
  expect(steps[0].fields).toContain("User-Password：隠蔽した値（非表示）");
  expect(steps[2].fields).toContain("Identifier：7（要求と同じ）");
  expect(steps[2].fields).toContain("Response Authenticator：NASが検証");
  expect(steps[3]).toMatchObject({ kind: "local", node: "nas" });
});
