import type { ProtocolDefinition } from "../../domain/lesson";
import { handshake } from "./scenarios/handshake";
export { createConnection } from "./fragments/connection";
export { createDisconnection } from "./fragments/disconnection";
export const tcp: ProtocolDefinition = {
  id: "tcp",
  description: "3ウェイハンドシェイクで通信の接続を確立する",
  keywords: ["接続確立", "ハンドシェイク", "SYN", "ACK", "トランスポート"],
  title: "TCP",
  defaultScenarioId: "handshake",
  scenarios: [handshake],
};
