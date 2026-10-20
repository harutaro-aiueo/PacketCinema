import { expect, it } from "vitest";
import { createCatalog } from "../../app/catalog";
import { udp } from "./index";

const steps = udp.scenarios[0].steps;

it("sends independent UDP datagrams and delivers them by destination port", () => {
  expect(() => createCatalog([{ protocol: udp, publishedScenarioIds: ["ipv4-datagram"] }])).not.toThrow();
  expect(steps.map((step) => step.id)).toEqual([
    "prepare", "send", "deliver", "choose-reply", "reply", "receive-reply",
  ]);
  expect(steps[1]).toMatchObject({ kind: "message", from: "sender", to: "receiver" });
  expect(steps[1].fields).toContain("宛先ポート：40000");
  expect(steps[1].fields).toContain("Length：13バイト");
  expect(steps[2].fields).toContain("チェックサム：検証成功");
  expect(steps[4]).toMatchObject({ kind: "message", from: "receiver", to: "sender" });
  expect(steps[4].fields).toContain("宛先ポート：53000");
  expect(steps[4].fields).toContain("Length：10バイト");
  expect(steps[4].description).toContain("UDPの確認応答ではありません");
});
