import { expect, it } from "vitest";
import { stp } from "./index";
import { validateScenario } from "../../domain/lesson/validate";
import { createCatalog } from "../../app/catalog";

const scenario = stp.scenarios[0];
it("publishes a validated triangle with only adjacent BPDU exchanges", () => {
  expect(() =>
    createCatalog([{ protocol: stp, publishedScenarioIds: ["convergence"] }]),
  ).not.toThrow();
  for (const step of scenario.steps.filter((s) => s.kind === "message")) {
    expect(
      scenario.topology!.links.some(
        (l) =>
          [l.from, l.to].includes(step.from) &&
          [l.from, l.to].includes(step.to),
      ),
    ).toBe(true);
    expect(step.wire).toContain("Configuration BPDU");
    expect(
      step.linkStates?.[
        scenario.topology!.links.find(
          (l) =>
            [l.from, l.to].includes(step.from) &&
            [l.from, l.to].includes(step.to),
        )!.id
      ],
    ).not.toBe("down");
  }
});
it("keeps the redundant segment blocked until failure and both transition states", () => {
  const index = (id: string) => scenario.steps.findIndex((s) => s.id === id);
  expect(index("port-roles")).toBeLessThan(index("listening"));
  expect(index("listening")).toBeLessThan(index("learning"));
  expect(index("learning")).toBeLessThan(index("forwarding"));
  const stable = scenario.steps[index("forwarding")];
  expect(stable.linkStates).toEqual({
    ab: "forwarding",
    ac: "forwarding",
    bc: "blocked",
  });
  expect(scenario.steps[index("blocked-bpdu")]).toMatchObject({
    kind: "message",
    from: "b",
    to: "c",
    linkStates: { bc: "blocked" },
  });
  expect(index("link-failure")).toBeLessThan(index("re-listening"));
  expect(index("re-listening")).toBeLessThan(index("re-learning"));
  expect(index("re-learning")).toBeLessThan(index("recovered"));
  expect(scenario.steps.at(-1)?.linkStates).toEqual({
    ab: "forwarding",
    ac: "down",
    bc: "forwarding",
  });
  expect(
    scenario.steps.every(
      (s) =>
        Object.values(s.linkStates ?? {}).filter((v) => v === "forwarding")
          .length <= 2,
    ),
  ).toBe(true);
});
it("shows bridge IDs, root path costs, and port roles on the topology", () => {
  expect(scenario.topology?.nodeDetails).toMatchObject({
    a: expect.stringContaining("BID 32768"),
    b: expect.stringContaining("BID 32768"),
    c: expect.stringContaining("BID 32768"),
  });
  const step = (id: string) => scenario.steps.find((item) => item.id === id)!;
  expect(step("port-roles").topologyAnnotations).toEqual({
    nodeDetails: {
      a: "Root cost 0",
      b: "Root cost 4",
      c: "Root cost 4",
    },
    portRoles: {
      ab: { from: "DP", to: "RP" },
      ac: { from: "DP", to: "RP" },
      bc: { from: "DP", to: "Blocking" },
    },
  });
  expect(step("recovered").topologyAnnotations?.nodeDetails?.c).toBe(
    "Root cost 8",
  );
  expect(step("recovered").topologyAnnotations?.portRoles?.bc).toEqual({
    from: "DP",
    to: "RP",
  });
});
it("rejects malformed topology and unknown link states", () => {
  expect(() =>
    validateScenario({
      ...scenario,
      topology: {
        kind: "triangle",
        links: [
          scenario.topology!.links[0],
          scenario.topology!.links[1],
          { ...scenario.topology!.links[0], id: "duplicate" },
        ],
      },
    }),
  ).toThrow("duplicate topology edge");
  expect(() =>
    validateScenario({
      ...scenario,
      steps: [{ ...scenario.steps[0], linkStates: { missing: "down" } }],
    }),
  ).toThrow("invalid link state");
});
