import type { ProtocolDefinition } from "../../domain/lesson";
export interface ViewState {
  protocol: string;
  scenario?: string;
  step: number;
}
export function decodeView(hash: string): ViewState {
  const [path, query] = hash.replace(/^#\/?/, "").split("?");
  const parameters = new URLSearchParams(query);
  const step = Number(parameters.get("step") || 0);
  return {
    protocol: path || "",
    scenario: parameters.get("scenario") || undefined,
    step: Number.isFinite(step) ? Math.max(0, Math.floor(step)) : 0,
  };
}
export function resolveView(
  view: ViewState,
  catalog: readonly ProtocolDefinition[],
  defaultProtocolId: string,
) {
  const protocol =
    catalog.find((item) => item.id === view.protocol) ??
    catalog.find((item) => item.id === defaultProtocolId);
  if (!protocol)
    throw new Error("Missing default protocol: " + defaultProtocolId);
  const scenario =
    protocol.scenarios.find((item) => item.id === view.scenario) ??
    protocol.scenarios.find((item) => item.id === protocol.defaultScenarioId);
  if (!scenario) throw new Error("Missing default scenario: " + protocol.id);
  return {
    protocol,
    scenario,
    index: Math.min(
      Math.max(0, Number.isFinite(view.step) ? Math.floor(view.step) : 0),
      scenario.steps.length - 1,
    ),
  };
}
export function encodeView(view: ViewState, defaultScenarioId: string): string {
  const parameters = new URLSearchParams();
  if (view.scenario && view.scenario !== defaultScenarioId)
    parameters.set("scenario", view.scenario);
  parameters.set("step", String(view.step));
  return "#/" + view.protocol + "?" + parameters;
}
