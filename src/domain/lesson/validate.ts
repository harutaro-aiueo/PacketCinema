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
  const networks = scenario.networks ?? [];
  unique(
    networks.map((network) => network.id),
    `${context} networks`,
  );
  for (const network of networks)
    requireValue(
      nodes.has(network.node) && network.label.trim() && network.prefix.trim(),
      `${context}: invalid network`,
    );
  const routingTables = scenario.routingTables ?? [];
  unique(
    routingTables.map((table) => table.node),
    `${context} routing tables`,
  );
  for (const table of routingTables) {
    requireValue(
      networks.length > 0 &&
        nodes.has(table.node) &&
        table.title.trim() &&
        table.initialStatus.trim() &&
        table.emptyText.trim() &&
        table.initialEntries.every(
          (entry) =>
            entry.destination.trim() &&
            entry.learnedVia.trim() &&
            entry.nextHop.trim(),
        ),
      `${context}: invalid routing table`,
    );
    unique(
      table.initialEntries.map((entry) => entry.destination),
      `${context}/${table.node} routing table`,
    );
  }
  const links = scenario.topology?.links ?? [];
  unique(
    links.map((link) => link.id),
    `${context} links`,
  );
  if (scenario.topology) {
    requireValue(
      scenario.nodes.length === 3 && links.length === 3,
      `${context}: triangle needs three nodes and links`,
    );
    const pairs = new Set<string>();
    for (const link of links) {
      requireValue(
        nodes.has(link.from) &&
          nodes.has(link.to) &&
          link.from !== link.to &&
          link.label.trim(),
        `${context}: invalid link`,
      );
      pairs.add([link.from, link.to].sort().join("/"));
    }
    requireValue(pairs.size === 3, `${context}: duplicate topology edge`);
  }
  for (const step of scenario.steps) {
    for (const [node, snapshot] of Object.entries(step.routingTables ?? {})) {
      requireValue(
        routingTables.some((table) => table.node === node) &&
          snapshot.status.trim() &&
          snapshot.entries.every(
            (entry) =>
              entry.destination.trim() &&
              entry.learnedVia.trim() &&
              entry.nextHop.trim(),
          ),
        `${context}/${step.id}: invalid routing table`,
      );
      unique(
        snapshot.entries.map((entry) => entry.destination),
        `${context}/${step.id}/${node} routing table`,
      );
    }
    if (step.networkAction) {
      const network = networks.find(
        (item) => item.id === step.networkAction?.networkId,
      );
      requireValue(
        network && step.kind === "message" && step.from === network.node,
        `${context}/${step.id}: invalid network action`,
      );
    }
    requireValue(
      Object.entries(step.networkStates ?? {}).every(
        ([id, state]) =>
          networks.some((network) => network.id === id) &&
          ["up", "down"].includes(state),
      ),
      `${context}/${step.id}: invalid network state`,
    );
    requireValue(
      Object.entries(step.linkStates ?? {}).every(
        ([id, state]) =>
          links.some((link) => link.id === id) &&
          ["pending", "forwarding", "blocked", "down"].includes(state),
      ),
      `${context}/${step.id}: invalid link state`,
    );
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
