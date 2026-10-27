import type { ProtocolDefinition } from "../../domain/lesson";
import { handshake } from "./scenarios/handshake";
import { dataRetransmission } from "./scenarios/data-retransmission";
import { normalClose } from "./scenarios/normal-close";
import { flowControl } from "./scenarios/flow-control";
export { createConnection } from "./fragments/connection";
export { createDisconnection } from "./fragments/disconnection";
export const tcp: ProtocolDefinition = {
  id: "tcp",
  description: "接続確立、データ確認・再送、受信窓、正常終了を追う",
  keywords: ["接続確立", "ハンドシェイク", "SYN", "ACK", "FIN", "TIME-WAIT", "受信窓", "フロー制御", "トランスポート"],
  title: "TCP",
  defaultScenarioId: "handshake",
  scenarios: [handshake, dataRetransmission, flowControl, normalClose],
};
