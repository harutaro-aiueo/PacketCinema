import { expect, it } from "vitest";
import { createCatalog } from "../../app/catalog";
import { tcp } from "../tcp";
import { mqtt } from "./index";

it("acknowledges a QoS 1 publish with the same packet identifier", () => {
  expect(() => createCatalog([
    { protocol: tcp, publishedScenarioIds: ["handshake"] },
    { protocol: mqtt, publishedScenarioIds: ["qos1-publish"] },
  ])).not.toThrow();
  const steps = mqtt.scenarios[0].steps;
  expect(steps.map((step) => step.id)).toEqual([
    "connect", "connack", "publish", "puback", "disconnect",
  ]);
  expect(steps[1]).toMatchObject({ kind: "message", from: "broker", to: "publisher" });
  expect(steps[1].wire).toContain("SessionPresent=0");
  expect(steps[2].wire).toContain("QoS=1 PacketId=7");
  expect(steps[3]).toMatchObject({ kind: "message", from: "broker", to: "publisher" });
  expect(steps[3].wire).toContain("PacketId=7");
  expect(steps[3].description).toContain("確認済み");
});
