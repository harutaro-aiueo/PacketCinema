import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const oasis = "https://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html";
const connection = "TCP接続（この例では暗号化なし）";

const scenario: Scenario = {
  id: "qos1-publish",
  title: "MQTT QoS 1で発行",
  badge: "MQTT",
  sceneLabel: "発行クライアント ↔ ブローカー",
  nodes: [
    { id: "publisher", label: "発行クライアント", caption: "温度を発行", image: "./pixels/client.svg" },
    { id: "broker", label: "ブローカー", caption: "メッセージを受信", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "tcp", label: "TCP接続" }],
  notes: [
    "MQTT 3.1.1の成功例です。TCP接続は確立済みで、Clean Sessionを1にした新しいセッションを使います。認証、TLS、購読者への配送は扱いません。",
    "QoS 1のPUBACKはブローカーが発行メッセージを受け取った確認です。購読者への到着を保証する応答ではありません。再送時には重複し得ますが、この例では再送を省きます。",
    "図はMQTTの論理メッセージを示します。実際のTCPパケット分割、切断手順、通信にかかる時間は表しません。温度の値は架空です。",
  ],
  steps: [
    { kind: "message", from: "publisher", to: "broker", id: "connect", phase: "接続", title: "セッションを始める", wire: "CONNECT ClientId=sensor1 CleanSession=1", displayWire: "CONNECT", description: "クライアントはCONNECTを送り、新しいMQTTセッションを求めます。", fields: ["Protocol Level：4（MQTT 3.1.1）", "ClientId：sensor1", "Clean Session：1"], protection: connection, source: oasis + "#_Toc398718030" },
    { kind: "message", from: "broker", to: "publisher", id: "connack", phase: "接続", title: "接続を受け入れる", wire: "CONNACK SessionPresent=0 ReturnCode=0", displayWire: "CONNACK 成功", description: "ブローカーは接続を受け入れ、CONNACKで成功を知らせます。新しいセッションなのでSession Presentは0です。", fields: ["Return Code：0（受け入れ）", "Session Present：0"], protection: connection, source: oasis + "#_Toc398718035" },
    { kind: "message", from: "publisher", to: "broker", id: "publish", phase: "発行", title: "温度を発行する", wire: "PUBLISH sensors/room1/temp 22.5 QoS=1 PacketId=7", displayWire: "PUBLISH 温度", description: "クライアントはトピック名と温度データをQoS 1で送ります。未使用のPacket Identifier 7を付け、確認が来るまで未確認として扱います。", fields: ["Topic Name：sensors/room1/temp", "Payload：22.5（架空の値）", "QoS：1", "Packet Identifier：7", "DUP：0", "RETAIN：0"], protection: connection, source: oasis + "#_Toc398718101" },
    { kind: "message", from: "broker", to: "publisher", id: "puback", phase: "発行", title: "受信を確認する", wire: "PUBACK PacketId=7", displayWire: "PUBACK #7", description: "ブローカーは同じPacket IdentifierのPUBACKを返します。クライアントはこの発行を確認済みとして扱えます。", fields: ["Packet Identifier：7", "確認範囲：ブローカーへのQoS 1発行"], protection: connection, source: oasis + "#_Toc398718043" },
    { kind: "message", from: "publisher", to: "broker", id: "disconnect", phase: "終了", title: "接続を終える", wire: "DISCONNECT", description: "クライアントはDISCONNECTを送ってからTCP接続を閉じます。TCPの切断は図では省略します。", fields: ["送信：クライアントからブローカー", "次の動作：TCP接続を閉じる"], protection: connection, source: oasis + "#_Toc398718094" },
  ],
};

export const mqtt: ProtocolDefinition = {
  id: "mqtt", title: "MQTT", description: "QoS 1でブローカーへメッセージを発行する",
  keywords: ["メッセージ", "発行", "ブローカー", "IoT", "PUBACK"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
