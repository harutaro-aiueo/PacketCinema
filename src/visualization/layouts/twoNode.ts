import type { Scenario, Step } from "../../domain/lesson";
export function assertSupportedLayout(scenario: Scenario): void {
  if (scenario.networks?.length && scenario.topology)
    throw new Error("Network diagram requires two-node layout: " + scenario.id);
  if (scenario.topology?.kind === "triangle" && scenario.nodes.length === 3)
    return;
  if (scenario.nodes.length !== 2)
    throw new Error(
      "Two-node renderer requires exactly 2 nodes: " + scenario.id,
    );
  if (
    scenario.networks?.length &&
    (scenario.networks.length !== 2 ||
      scenario.nodes.some(
        (node) =>
          scenario.networks?.filter((network) => network.node === node.id)
            .length !== 1,
      ))
  )
    throw new Error("Network diagram needs one LAN per node: " + scenario.id);
}
export function twoNodeLayout(
  scenario: Scenario,
  step: Step,
  progress: number,
) {
  if (scenario.nodes.length !== 2) throw new Error("Expected two nodes");
  const source = step.kind === "local" ? step.node : step.from;
  const arrived = step.kind === "local" || progress >= 5 / 6;
  const active = step.kind === "local" || !arrived ? source : step.to;
  const side = (id: string) =>
    id === scenario.nodes[0].id ? "client" : "server";
  return {
    arrived,
    active,
    side: side(active),
    sourceSide: side(source),
    travel:
      side(source) === "client"
        ? 12 + 76 * Math.min(1, progress * 1.2)
        : 88 - 76 * Math.min(1, progress * 1.2),
  };
}
