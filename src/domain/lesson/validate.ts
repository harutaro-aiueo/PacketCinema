import type { ProtocolDefinition, Scenario } from "./index";

function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function unique(ids: readonly string[], context: string) {
  requireValue(
    ids.every((id) => id.trim()),
    `${context}: empty ID`,
  );
  requireValue(new Set(ids).size === ids.length, `${context}: duplicate ID`);
}
export function validateScenario(scenario: Scenario): void {
  const context = scenario.id;
  requireValue(scenario.title.trim(), `${context}: missing title`);
  requireValue(scenario.nodes.length > 0, `${context}: no nodes`);
  requireValue(scenario.steps.length > 0, `${context}: no steps`);
  unique(
    scenario.nodes.map((node) => node.id),
    `${context} nodes`,
  );
  unique(
    scenario.steps.map((step) => step.id),
    `${context} steps`,
  );
  const nodes = new Set(scenario.nodes.map((node) => node.id));
  for (const step of scenario.steps) {
    requireValue(
      step.title.trim() &&
        step.phase.trim() &&
        step.description.trim() &&
        step.wire.trim() &&
        step.protection.trim() &&
        step.fields.length &&
        step.fields.every((field) => field.trim()),
      `${context}/${step.id}: missing content`,
    );
    const source = new URL(step.source);
    requireValue(
      ["http:", "https:"].includes(source.protocol),
      `${context}/${step.id}: invalid source`,
    );
    const references =
      step.kind === "local" ? [step.node] : [step.from, step.to];
    requireValue(
      references.every((id) => nodes.has(id)),
      `${context}/${step.id}: unknown node`,
    );
    requireValue(
      Object.keys(step.states ?? {}).every((id) => nodes.has(id)),
      `${context}/${step.id}: unknown state node`,
    );
    if (step.kind === "message")
      requireValue(
        step.from !== step.to,
        `${context}/${step.id}: use a local step`,
      );
    if (step.kind === "local" && step.effect.kind === "stages") {
      requireValue(
        step.effect.stages.length > 0,
        `${context}/${step.id}: no effect stages`,
      );
    }
  }
}

export function validateProtocols(
  protocols: readonly ProtocolDefinition[],
): void {
  unique(
    protocols.map((protocol) => protocol.id),
    "protocols",
  );
  const ids = new Set(protocols.map((protocol) => protocol.id));
  for (const protocol of protocols) {
    unique(
      protocol.scenarios.map((scenario) => scenario.id),
      protocol.id,
    );
    requireValue(
      protocol.scenarios.some(
        (scenario) => scenario.id === protocol.defaultScenarioId,
      ),
      `${protocol.id}: missing default scenario`,
    );
    for (const scenario of protocol.scenarios) {
      validateScenario(scenario);
      requireValue(
        scenario.prerequisites.every((item) => ids.has(item.protocol)),
        `${protocol.id}/${scenario.id}: unknown prerequisite`,
      );
    }
  }
}
