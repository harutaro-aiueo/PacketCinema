import { expect, it } from "vitest";
import { createCatalog } from "../../app/catalog";
import { dhcp } from "./index";

const steps = dhcp.scenarios[0].steps;

it("publishes the initial lease sequence with matching transaction and address", () => {
  expect(() =>
    createCatalog([
      { protocol: dhcp, publishedScenarioIds: ["initial-lease"] },
    ]),
  ).not.toThrow();
  expect(steps.map((step) => step.id)).toEqual([
    "discover",
    "offer",
    "request",
    "ack",
    "bound",
  ]);
  expect(
    steps.map((step) =>
      step.kind === "message"
        ? `${step.from}->${step.to}`
        : `local:${step.node}`,
    ),
  ).toEqual([
    "client->server",
    "server->client",
    "client->server",
    "server->client",
    "local:client",
  ]);
  expect(
    steps.slice(0, 4).every((step) => step.fields.includes("xid=0x12345678")),
  ).toBe(true);
  expect(steps[1].fields).toContain("yiaddr=192.0.2.10");
  expect(steps[2].fields).toEqual(
    expect.arrayContaining([
      "Option 54=192.0.2.1",
      "Option 50=192.0.2.10",
      "ciaddr=0.0.0.0",
    ]),
  );
  expect(steps[3].fields).toEqual(
    expect.arrayContaining(["yiaddr=192.0.2.10", "Option 51=3600秒"]),
  );
  expect(steps[4].fields).toContain("状態=BOUND");
});
