export interface LessonNode {
  id: string;
  label: string;
  caption: string;
  image: string;
}

export type LocalEffect =
  | {
      kind: "typing" | "result";
      text: string;
      prompt: string;
      pending: string;
      complete: string;
      label: string;
    }
  | {
      kind: "stages";
      stages: readonly { text: string; status: string }[];
      label: string;
    };

export interface RoutingTableEntry {
  destination: string;
  learnedVia: string;
  nextHop: string;
}

export interface RoutingTableSnapshot {
  status: string;
  entries: readonly RoutingTableEntry[];
}

export interface RoutingTableConfig {
  node: string;
  title: string;
  initialStatus: string;
  emptyText: string;
  initialEntries: readonly RoutingTableEntry[];
}

export interface StepContent {
  id: string;
  phase: string;
  title: string;
  wire: string;
  displayWire?: string;
  description: string;
  fields: readonly string[];
  protection: string;
  source: string;
  states?: Readonly<Record<string, string>>;
  linkStates?: Readonly<
    Record<string, "pending" | "forwarding" | "blocked" | "down">
  >;
  topologyAnnotations?: {
    nodeDetails?: Readonly<Record<string, string>>;
    portRoles?: Readonly<Record<string, { from: string; to: string }>>;
  };
  networkAction?: {
    networkId: string;
    kind: "advertise" | "withdraw";
  };
  networkStates?: Readonly<Record<string, "up" | "down">>;
  routingTables?: Readonly<Record<string, RoutingTableSnapshot>>;
}

export type Step = StepContent &
  (
    | { kind: "message"; from: string; to: string }
    | { kind: "local"; node: string; effect: LocalEffect }
  );

export interface Scenario {
  id: string;
  title: string;
  badge: string;
  sceneLabel: string;
  nodes: readonly LessonNode[];
  networks?: readonly {
    id: string;
    node: string;
    label: string;
    prefix: string;
  }[];
  routingTables?: readonly RoutingTableConfig[];
  topology?: {
    kind: "triangle";
    links: readonly { id: string; from: string; to: string; label: string }[];
    nodeDetails?: Readonly<Record<string, string>>;
  };
  prerequisites: readonly { protocol: string; label: string }[];
  notes: readonly string[];
  steps: readonly Step[];
}

export interface ProtocolDefinition {
  description?: string;
  keywords?: readonly string[];
  id: string;
  title: string;
  defaultScenarioId: string;
  scenarios: readonly Scenario[];
}

export function direction(step: Step, nodes: readonly LessonNode[]): string {
  if (step.kind === "local") return "端末内";
  const label = (id: string) =>
    nodes.find((node) => node.id === id)?.label ?? id;
  return `${label(step.from)} → ${label(step.to)}`;
}
