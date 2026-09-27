import { expect, it } from "vitest";
import { peering } from "./scenarios/peering";
import { validateScenario } from "../../domain/lesson/validate";

const step = (id: string) => peering.steps.find((item) => item.id === id)!;
const index = (id: string) => peering.steps.findIndex((item) => item.id === id);

it("establishes TCP and both BGP directions before exchanging routes", () => {
  expect(peering.steps.slice(1, 4).map((item) => item.id)).toEqual([
    "tcp-syn",
    "tcp-syn-ack",
    "tcp-ack",
  ]);
  expect(step("tcp-syn").fields).toContain("宛先TCPポート=179");
  expect(["open-r1", "open-r2", "confirm-r1", "confirm-r2"].map(index)).toEqual(
    [4, 5, 6, 7],
  );
  expect(step("open-r1")).toMatchObject({ from: "r1", to: "r2" });
  expect(step("open-r2")).toMatchObject({ from: "r2", to: "r1" });
  expect(step("confirm-r1").states).toEqual({
    r1: "OpenConfirm",
    r2: "Established",
  });
  expect(step("confirm-r2").states).toEqual({
    r1: "Established",
    r2: "Established",
  });
  expect(index("confirm-r2")).toBeLessThan(index("advertise"));
});

it("exchanges both LAN routes, then withdraws only R1's route", () => {
  expect(peering.networks).toEqual([
    { id: "r1-lan", node: "r1", label: "R1側LAN", prefix: "203.0.113.0/24" },
    { id: "r2-lan", node: "r2", label: "R2側LAN", prefix: "198.51.100.0/24" },
  ]);
  expect(index("select-export")).toBeLessThan(index("advertise"));
  expect(index("advertise")).toBeLessThan(index("accept-route"));
  expect(index("accept-route")).toBeLessThan(index("select-export-r2"));
  expect(index("select-export-r2")).toBeLessThan(index("advertise-r2"));
  expect(index("advertise-r2")).toBeLessThan(index("accept-route-r1"));
  expect(index("origin-unavailable")).toBeLessThan(index("withdraw"));
  expect(index("withdraw")).toBeLessThan(index("remove-route"));
  expect(step("advertise")).toMatchObject({
    kind: "message",
    from: "r1",
    to: "r2",
    networkAction: { networkId: "r1-lan", kind: "advertise" },
  });
  expect(step("advertise").fields).toEqual([
    "NLRI=203.0.113.0/24",
    "ORIGIN=IGP / AS_PATH=65001",
    "NEXT_HOP=192.0.2.1",
  ]);
  expect(step("advertise-r2")).toMatchObject({
    kind: "message",
    from: "r2",
    to: "r1",
    networkAction: { networkId: "r2-lan", kind: "advertise" },
  });
  expect(step("advertise-r2").fields).toEqual([
    "NLRI=198.51.100.0/24",
    "ORIGIN=IGP / AS_PATH=65002",
    "NEXT_HOP=192.0.2.2",
  ]);
  expect(step("withdraw").fields).toEqual([
    "WITHDRAWN ROUTES=203.0.113.0/24",
    "Path Attributes=なし / NLRI=なし",
  ]);
  expect(step("withdraw").networkAction).toEqual({
    networkId: "r1-lan",
    kind: "withdraw",
  });
  for (const id of ["origin-unavailable", "withdraw", "remove-route"])
    expect(step(id).networkStates).toEqual({ "r1-lan": "down" });
  expect(step("keepalive").networkStates).toBeUndefined();
  expect(step("withdraw").states?.r2).toBe("撤回を受信");
  expect(step("remove-route").states).toEqual({
    r1: "Established",
    r2: "直結経路のみ",
  });
});

it("shows direct and BGP routes in both tables as exchange progresses", () => {
  expect(peering.routingTables).toEqual([
    {
      node: "r1",
      title: "R1の経路表",
      initialStatus: "交換前",
      emptyText: "経路なし",
      initialEntries: [
        { destination: "203.0.113.0/24", learnedVia: "直結", nextHop: "-" },
      ],
    },
    {
      node: "r2",
      title: "R2の経路表",
      initialStatus: "交換前",
      emptyText: "経路なし",
      initialEntries: [
        { destination: "198.51.100.0/24", learnedVia: "直結", nextHop: "-" },
      ],
    },
  ]);
  expect(step("advertise").routingTables?.r2.entries).toEqual([
    { destination: "198.51.100.0/24", learnedVia: "直結", nextHop: "-" },
  ]);
  for (const id of [
    "accept-route",
    "select-export-r2",
    "advertise-r2",
    "accept-route-r1",
    "keepalive",
    "origin-unavailable",
    "withdraw",
  ])
    expect(step(id).routingTables?.r2.entries).toEqual([
      { destination: "198.51.100.0/24", learnedVia: "直結", nextHop: "-" },
      { destination: "203.0.113.0/24", learnedVia: "BGP", nextHop: "R1" },
    ]);
  for (const id of ["accept-route-r1", "keepalive"])
    expect(step(id).routingTables?.r1.entries).toEqual([
      { destination: "203.0.113.0/24", learnedVia: "直結", nextHop: "-" },
      { destination: "198.51.100.0/24", learnedVia: "BGP", nextHop: "R2" },
    ]);
  for (const id of ["origin-unavailable", "withdraw", "remove-route"])
    expect(step(id).routingTables?.r1.entries).toEqual([
      { destination: "198.51.100.0/24", learnedVia: "BGP", nextHop: "R2" },
    ]);
  expect(step("remove-route").routingTables?.r2).toEqual({
    status: "R1の経路を削除",
    entries: [
      { destination: "198.51.100.0/24", learnedVia: "直結", nextHop: "-" },
    ],
  });
});

it("rejects an action for an unknown or opposite-side LAN", () => {
  for (const networkId of ["missing", "r2-lan"])
    expect(() =>
      validateScenario({
        ...peering,
        steps: [
          {
            ...step("advertise"),
            networkAction: { networkId, kind: "advertise" },
          },
        ],
      }),
    ).toThrow("invalid network action");
});

it("rejects a connection state for an unknown LAN", () => {
  expect(() =>
    validateScenario({
      ...peering,
      steps: [
        { ...step("withdraw"), networkStates: { missing: "down" } },
      ],
    }),
  ).toThrow("invalid network state");
});

it("rejects an invalid routing-table snapshot", () => {
  expect(() =>
    validateScenario({
      ...peering,
      steps: [
        {
          ...step("accept-route"),
          routingTables: {
            r2: {
              status: "選択済み",
              entries: [
                {
                  destination: "203.0.113.0/24",
                  learnedVia: "BGP",
                  nextHop: "",
                },
              ],
            },
          },
        },
      ],
    }),
  ).toThrow("invalid routing table");
});
