import { expect, it } from "vitest";
import { createCatalog } from "../../app/catalog";
import { sctp } from "./index";

it("establishes an SCTP association only after the cookie exchange", () => {
  expect(() => createCatalog([
    { protocol: sctp, publishedScenarioIds: ["cookie-handshake"] },
  ])).not.toThrow();
  const steps = sctp.scenarios[0].steps;
  expect(steps.map((step) => [step.id, step.kind === "message" && step.from])).toEqual([
    ["init", "initiator"], ["init-ack", "responder"],
    ["cookie-echo", "initiator"], ["cookie-ack", "responder"],
  ]);
  expect(steps[1].states?.responder).toBe("未確立");
  expect(steps[2].states).toEqual({ initiator: "COOKIE-ECHOED", responder: "ESTABLISHED" });
  expect(steps[3].states).toEqual({ initiator: "ESTABLISHED", responder: "ESTABLISHED" });
});
