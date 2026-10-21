import type { ProtocolDefinition } from "../domain/lesson";
import { validateProtocols } from "../domain/lesson/validate";
import { assertSupportedLayout } from "../visualization/layouts/twoNode";
import { ssh } from "../protocols/ssh";
import { tcp } from "../protocols/tcp";
import { udp } from "../protocols/udp";
import { stp } from "../protocols/stp";
import { https } from "../protocols/https";
import { dns } from "../protocols/dns";
import { arp } from "../protocols/arp";
import { icmp } from "../protocols/icmp";
import { dhcp } from "../protocols/dhcp";
import { httpCache } from "../protocols/http-cache";
import { smtp } from "../protocols/smtp";
import { httpRedirect } from "../protocols/http-redirect";
import { httpBasic } from "../protocols/http-basic";
import { httpCookie } from "../protocols/http-cookie";
import { httpRange } from "../protocols/http-range";
import { pop3 } from "../protocols/pop3";
import { sntp } from "../protocols/sntp";
import { ipv6Nd } from "../protocols/ipv6-nd";
import { ipv6Slaac } from "../protocols/ipv6-slaac";
import { ftp } from "../protocols/ftp";
import { snmpGet } from "../protocols/snmp-get";
import { sctp } from "../protocols/sctp";
import { mqtt } from "../protocols/mqtt";
import { telnet } from "../protocols/telnet";
import { radius } from "../protocols/radius";
import { ipv4Fragmentation } from "../protocols/ipv4-fragmentation";
import { pppLcp } from "../protocols/ppp-lcp";
import { imap } from "../protocols/imap";
import { napt } from "../protocols/napt";

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
  { protocol: tcp, publishedScenarioIds: ["handshake", "data-retransmission"] },
  { protocol: udp, publishedScenarioIds: ["ipv4-datagram"] },
  { protocol: stp, publishedScenarioIds: ["convergence"] },
  { protocol: https, publishedScenarioIds: ["tls13-http11"] },
  { protocol: dns, publishedScenarioIds: ["authoritative-a", "recursive-cache"] },
  { protocol: arp, publishedScenarioIds: ["ipv4-ethernet"] },
  { protocol: icmp, publishedScenarioIds: ["ipv4-echo"] },
  { protocol: dhcp, publishedScenarioIds: ["initial-lease"] },
  { protocol: httpCache, publishedScenarioIds: ["etag-revalidation"] },
  { protocol: smtp, publishedScenarioIds: ["one-message"] },
  { protocol: httpRedirect, publishedScenarioIds: ["post-see-other"] },
  { protocol: httpBasic, publishedScenarioIds: ["challenge-response"] },
  { protocol: httpCookie, publishedScenarioIds: ["store-and-send"] },
  { protocol: httpRange, publishedScenarioIds: ["two-byte-ranges"] },
  { protocol: sntp, publishedScenarioIds: ["unicast-clock"] },
  { protocol: pop3, publishedScenarioIds: ["retrieve-one"] },
  { protocol: ipv6Nd, publishedScenarioIds: ["neighbor-address"] },
  { protocol: ipv6Slaac, publishedScenarioIds: ["router-advertisement"] },
  { protocol: ftp, publishedScenarioIds: ["passive-retrieve"] },
  { protocol: snmpGet, publishedScenarioIds: ["uptime-read"] },
  { protocol: sctp, publishedScenarioIds: ["cookie-handshake"] },
  { protocol: mqtt, publishedScenarioIds: ["qos1-publish"] },
  { protocol: telnet, publishedScenarioIds: ["remote-echo"] },
  { protocol: radius, publishedScenarioIds: ["access-accept"] },
  { protocol: ipv4Fragmentation, publishedScenarioIds: ["two-fragments"] },
  { protocol: pppLcp, publishedScenarioIds: ["link-open"] },
  { protocol: imap, publishedScenarioIds: ["select-and-fetch"] },
  { protocol: napt, publishedScenarioIds: ["udp-outbound"] },
]);
