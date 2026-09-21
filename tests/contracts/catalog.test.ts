import { expect, it } from "vitest";
import { createCatalog, catalog } from "../../src/app/catalog";
import {
  validateProtocols,
  validateScenario,
} from "../../src/domain/lesson/validate";
import { ssh } from "../../src/protocols/ssh";
import { tcp } from "../../src/protocols/tcp";
import { example, threeNode } from "../fixtures/example";
it("validates published and unpublished scenarios", () =>
  expect(() => validateProtocols([ssh, tcp])).not.toThrow());
it("publishes only current SSH and TCP scenarios", () =>
  expect(catalog.map((p) => [p.id, p.scenarios.map((s) => s.id)])).toEqual([
    ["ssh", ["interactive"]],
    ["tcp", ["handshake"]],
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
