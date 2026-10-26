import type { ProtocolDefinition } from "../../domain/lesson";
import { handshake } from "./scenarios/handshake";
import { dataRetransmission } from "./scenarios/data-retransmission";
import { normalClose } from "./scenarios/normal-close";
export { createConnection } from "./fragments/connection";
export { createDisconnection } from "./fragments/disconnection";
export const tcp: ProtocolDefinition = {
  id: "tcp",
  description: "接続確立からデータ確認・再送・正常終了までを追う",
  keywords: ["接続確立", "ハンドシェイク", "SYN", "ACK", "FIN", "TIME-WAIT", "トランスポート"],
  title: "TCP",
  defaultScenarioId: "handshake",
  scenarios: [handshake, dataRetransmission, normalClose],
};
