import type { ProtocolDefinition } from "../domain/lesson";
import { validateProtocols } from "../domain/lesson/validate";
import { assertSupportedLayout } from "../visualization/layouts/twoNode";
import { ssh } from "../protocols/ssh";
import { tcp } from "../protocols/tcp";
import { stp } from "../protocols/stp";
import { https } from "../protocols/https";
import { dns } from "../protocols/dns";
import { arp } from "../protocols/arp";
import { icmp } from "../protocols/icmp";
import { dhcp } from "../protocols/dhcp";
import { httpCache } from "../protocols/http-cache";

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
  { protocol: https, publishedScenarioIds: ["tls13-http11"] },
  { protocol: dns, publishedScenarioIds: ["authoritative-a"] },
  { protocol: arp, publishedScenarioIds: ["ipv4-ethernet"] },
  { protocol: icmp, publishedScenarioIds: ["ipv4-echo"] },
  { protocol: dhcp, publishedScenarioIds: ["initial-lease"] },
  { protocol: httpCache, publishedScenarioIds: ["etag-revalidation"] },
]);
