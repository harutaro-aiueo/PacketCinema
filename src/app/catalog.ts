import type { ProtocolDefinition } from "../domain/lesson";
import { validateProtocols } from "../domain/lesson/validate";
import { assertSupportedLayout } from "../visualization/layouts/twoNode";
import { ssh } from "../protocols/ssh";
import { tcp } from "../protocols/tcp";
import { stp } from "../protocols/stp";

export interface CatalogEntry {
  protocol: ProtocolDefinition;
  publishedScenarioIds: readonly string[];
}
export function createCatalog(
  entries: readonly CatalogEntry[],
): readonly ProtocolDefinition[] {
  validateProtocols(entries.map((entry) => entry.protocol));
  return entries.map(({ protocol, publishedScenarioIds }) => {
    if (
      new Set(publishedScenarioIds).size !== publishedScenarioIds.length ||
      !publishedScenarioIds.includes(protocol.defaultScenarioId)
    )
      throw new Error(protocol.id + ": invalid publication list");
    const scenarios = publishedScenarioIds.map((id) => {
      const scenario = protocol.scenarios.find((item) => item.id === id);
      if (!scenario)
        throw new Error(protocol.id + ": unknown published scenario " + id);
      assertSupportedLayout(scenario);
      return scenario;
    });
    return { ...protocol, scenarios };
  });
}
export const catalog = createCatalog([
  { protocol: ssh, publishedScenarioIds: ["interactive"] },
  { protocol: tcp, publishedScenarioIds: ["handshake"] },
  { protocol: stp, publishedScenarioIds: ["convergence"] },
]);
