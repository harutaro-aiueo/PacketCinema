import type { Step } from "../../../domain/lesson";
export interface Composition {
  nodes?: { client: string; server: string };
  phase?: string;
  idPrefix?: string;
}
export function compose(steps: readonly Step[], options: Composition): Step[] {
  const node = (id: string) => options.nodes?.[id as "client" | "server"] ?? id;
  return steps.map((original) => {
    const step = structuredClone(original);
    const common = {
      ...step,
      id: (options.idPrefix ?? "") + step.id,
      phase: options.phase ?? step.phase,
      states: step.states
        ? Object.fromEntries(
            Object.entries(step.states).map(([id, state]) => [node(id), state]),
          )
        : undefined,
    };
    return step.kind === "message"
      ? { ...common, kind: "message", from: node(step.from), to: node(step.to) }
      : {
          ...common,
          kind: "local",
          node: node(step.node),
          effect: step.effect,
        };
  });
}
export function s(
  id: string,
  phase: string,
  title: string,
  wire: string,
  from: string,
  to: string,
  description: string,
  fields: string[],
  protection: string,
  source: string,
  states?: [string, string],
): Step {
  return {
    kind: "message",
    id,
    phase,
    title,
    wire,
    from,
    to,
    description,
    fields,
    protection,
    source,
    states: states ? { client: states[0], server: states[1] } : undefined,
  };
}
