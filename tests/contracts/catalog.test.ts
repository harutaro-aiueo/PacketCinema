import { expect, it } from "vitest";
import { createCatalog, catalog } from "../../src/app/catalog";
import {
  validateProtocols,
  validateScenario,
} from "../../src/domain/lesson/validate";
import { ssh } from "../../src/protocols/ssh";
import { tcp } from "../../src/protocols/tcp";
import { example, pathExample, threeNode } from "../fixtures/example";
it("validates published and unpublished scenarios", () =>
  expect(() => validateProtocols([ssh, tcp])).not.toThrow());
it("publishes the available protocol scenarios", () =>
  expect(catalog.map((p) => [p.id, p.scenarios.map((s) => s.id)])).toEqual([
    ["ssh", ["interactive"]],
    ["tcp", ["handshake", "data-retransmission", "normal-close"]],
    ["udp", ["ipv4-datagram"]],
    ["stp", ["convergence"]],
    ["https", ["tls13-http11"]],
    ["dns", ["authoritative-a", "recursive-cache", "negative-cache", "tcp-fallback"]],
    ["arp", ["ipv4-ethernet"]],
    ["icmp", ["ipv4-echo"]],
    ["dhcp", ["initial-lease", "lease-renewal", "rebinding-expiry"]],
    ["http-cache", ["etag-revalidation"]],
    ["smtp", ["one-message"]],
    ["http-redirect", ["post-see-other"]],
    ["http-basic", ["challenge-response"]],
    ["http-cookie", ["store-and-send"]],
    ["http-range", ["two-byte-ranges"]],
    ["sntp", ["unicast-clock"]],
    ["pop3", ["retrieve-one"]],
    ["ipv6-nd", ["neighbor-address"]],
    ["ipv6-slaac", ["router-advertisement"]],
    ["ftp", ["passive-retrieve"]],
    ["snmp-get", ["uptime-read"]],
    ["sctp", ["cookie-handshake"]],
    ["mqtt", ["qos1-publish"]],
    ["telnet", ["remote-echo"]],
    ["radius", ["access-accept"]],
    ["ipv4-fragmentation", ["two-fragments"]],
    ["ppp-lcp", ["link-open"]],
    ["imap", ["select-and-fetch"]],
    ["napt", ["udp-outbound"]],
    ["ethernet", ["same-vlan", "different-vlan"]],
  ]));
it("accepts independent protocols without renderer changes", () =>
  expect(
    createCatalog([
      { protocol: example, publishedScenarioIds: ["roundtrip", "alternate"] },
    ])[0].scenarios,
  ).toHaveLength(2));
it("models three nodes but rejects publication before renderer support", () => {
  expect(() => validateProtocols([threeNode])).not.toThrow();
  expect(() =>
    createCatalog([
      { protocol: threeNode, publishedScenarioIds: ["roundtrip"] },
    ]),
  ).toThrow("exactly 2 nodes");
});
it("publishes a three-node path and rejects a skipped hop", () => {
  expect(() => createCatalog([{ protocol: pathExample, publishedScenarioIds: ["roundtrip"] }])).not.toThrow();
  const scenario = pathExample.scenarios[0];
  expect(() => validateScenario({
    ...scenario,
    steps: [{ ...scenario.steps[0], to: "responder" }],
  })).toThrow("message needs a direct path link");
});
it("rejects invalid publication lists", () => {
  for (const ids of [
    [],
    ["missing"],
    ["roundtrip", "roundtrip"],
    ["roundtrip", "missing"],
  ])
    expect(() =>
      createCatalog([{ protocol: example, publishedScenarioIds: ids }]),
    ).toThrow();
});
it("rejects duplicate IDs, empty steps, invalid references and source URLs", () => {
  const scenario = example.scenarios[0];
  for (const invalid of [
    { ...scenario, steps: [] },
    { ...scenario, steps: [scenario.steps[0], scenario.steps[0]] },
    { ...scenario, nodes: [scenario.nodes[0], scenario.nodes[0]] },
    {
      ...scenario,
      steps: [
        {
          ...scenario.steps[0],
          kind: "message" as const,
          from: "unknown",
          to: "responder",
        },
      ],
    },
    { ...scenario, steps: [{ ...scenario.steps[0], description: "" }] },
    {
      ...scenario,
      steps: [{ ...scenario.steps[0], source: "javascript:alert(1)" }],
    },
  ])
    expect(() => validateScenario(invalid)).toThrow();
  expect(() => validateProtocols([example, example])).toThrow();
  expect(() =>
    validateProtocols([{ ...example, defaultScenarioId: "missing" }]),
  ).toThrow();
  expect(() =>
    validateProtocols([
      {
        ...example,
        scenarios: [
          {
            ...scenario,
            prerequisites: [{ protocol: "missing", label: "missing" }],
          },
        ],
      },
    ]),
  ).toThrow();
});
