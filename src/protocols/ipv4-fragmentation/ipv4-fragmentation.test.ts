import { expect, it } from "vitest";
import { ipv4Fragmentation } from "./index";

const steps = ipv4Fragmentation.scenarios[0].steps;

it("splits 2000 data bytes for MTU 1500 and reassembles at the target", () => {
  expect(steps.map((step) => step.id)).toEqual(["split", "first", "last", "reassemble"]);
  expect(steps[0]).toMatchObject({ kind: "local", node: "router" });
  expect(steps[1]).toMatchObject({ kind: "message", from: "router", to: "target" });
  expect(steps[2]).toMatchObject({ kind: "message", from: "router", to: "target" });
  expect(steps[1].fields).toEqual(expect.arrayContaining(["データ：1480バイト", "Fragment Offset：0", "MF：1", "全長：1500バイト"]));
  expect(steps[2].fields).toEqual(expect.arrayContaining(["データ：520バイト", "Fragment Offset：185（1480÷8）", "MF：0", "全長：540バイト"]));
  expect(steps[3]).toMatchObject({ kind: "local", node: "target" });
  expect(steps[3].fields).toContain("再構成したデータ：2000バイト");
});
