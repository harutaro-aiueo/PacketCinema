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
  topology?: {
    kind: "triangle";
    links: readonly { id: string; from: string; to: string; label: string }[];
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
