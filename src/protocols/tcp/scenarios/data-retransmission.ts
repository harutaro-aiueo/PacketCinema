import type { Scenario, Step } from "../../../domain/lesson";
import { createConnection } from "../fragments/connection";

const tcp = "https://www.rfc-editor.org/rfc/rfc9293.html";
const timer = "https://www.rfc-editor.org/rfc/rfc6298.html#section-5";
const established = { client: "ESTABLISHED", server: "ESTABLISHED" };
const awaiting = { client: "ACK待ち", server: "ESTABLISHED" };

const steps: Step[] = [
  ...createConnection(),
  {
    kind: "message", from: "client", to: "server", id: "data-first",
    phase: "データと確認応答", title: "4バイトのデータを送る",
    wire: "TCP ACK · SEQ=1001 · ACK=5001 · 4 bytes",
    displayWire: "データ 4バイト",
    description: "接続後、クライアントはシーケンス番号1001から4バイトを送ります。サーバーが受け取ると次に期待する番号は1005です。",
    fields: ["SEQ=1001", "データ長=4バイト", "次に期待する番号=1005"],
    protection: "TCP自体は暗号化しない", source: tcp + "#section-3.4",
    states: awaiting,
  },
  {
    kind: "message", from: "server", to: "client", id: "ack-first",
    phase: "データと確認応答", title: "次は1005と確認する",
    wire: "TCP ACK · SEQ=5001 · ACK=1005 · 0 bytes",
    displayWire: "ACK=1005",
    description: "サーバーは次に受け取りたい番号1005をACKで返します。クライアントは1001からの4バイトが確認されたと分かります。",
    fields: ["ACK=1005", "データ長=0バイト", "1001〜1004を確認済み"],
    protection: "TCP自体は暗号化しない", source: tcp + "#section-3.1",
    states: established,
  },
  {
    kind: "message", from: "client", to: "server", delivery: "dropped",
    id: "data-lost", phase: "損失と再送", title: "次の4バイトが途中で失われる",
    wire: "TCP ACK · SEQ=1005 · ACK=5001 · 4 bytes",
    displayWire: "データ 4バイト（消失）",
    description: "クライアントは1005から4バイトを送りますが、この例では途中で失われ、サーバーに届きません。サーバーの次に期待する番号は1005のままです。",
    fields: ["SEQ=1005", "データ長=4バイト", "サーバーには未到着", "ACK=1009は返らない"],
    protection: "TCP自体は暗号化しない", source: tcp + "#section-3.8.1",
    states: awaiting,
  },
  {
    kind: "local", node: "client", id: "timeout", phase: "損失と再送",
    title: "確認がないまま再送タイマーが切れる",
    wire: "RTO expired", displayWire: "再送待ち時間が経過",
    description: "1005からのデータに対する確認が届かないまま再送タイマーが満了します。送信側は、未確認の最も古いセグメントを再送します。",
    fields: ["未確認の先頭=1005", "RTO：実測時間は表現しない", "次：同じ番号から再送"],
    protection: "端末内の処理", source: timer,
    effect: { kind: "result", text: "ACK=1009なし", prompt: "TCP> ", pending: "タイマー待ち", complete: "再送を決定", label: "送信側の再送判断" },
    states: awaiting,
  },
  {
    kind: "message", from: "client", to: "server", id: "data-retry",
    phase: "損失と再送", title: "同じ番号のデータを再送する",
    wire: "TCP ACK · SEQ=1005 · ACK=5001 · 4 bytes (retransmission)",
    displayWire: "データを再送",
    description: "クライアントは新しい番号を使わず、未確認だった1005からの4バイトを再送します。今回はサーバーに届きます。",
    fields: ["SEQ=1005（再送）", "データ長=4バイト", "次に期待する番号=1009"],
    protection: "TCP自体は暗号化しない", source: timer,
    states: awaiting,
  },
  {
    kind: "message", from: "server", to: "client", id: "ack-retry",
    phase: "損失と再送", title: "再送されたデータを確認する",
    wire: "TCP ACK · SEQ=5001 · ACK=1009 · 0 bytes",
    displayWire: "ACK=1009",
    description: "サーバーは次に必要な番号1009を返します。送信側は1005からの4バイトが確認されたと分かります。",
    fields: ["ACK=1009", "データ長=0バイト", "1005〜1008を確認済み"],
    protection: "TCP自体は暗号化しない", source: tcp + "#section-3.1",
    states: established,
  },
];

export const dataRetransmission: Scenario = {
  id: "data-retransmission", title: "TCP：データと再送", badge: "TCP",
  sceneLabel: "端末 ↔ サーバー",
  nodes: [
    { id: "client", label: "端末", caption: "送信側", image: "./pixels/client.svg" },
    { id: "server", label: "サーバー", caption: "受信側", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "tcp", label: "TCPの接続確立" }],
  notes: [
    "TCP接続が成立してから4バイトのデータを送る例です。番号1000/5000は説明用です。ACK番号は次に受け取りたいデータの番号で、確認応答だけでは番号を消費しません。",
    "2回目のデータが途中で失われる例です。消失位置と待ち時間は概念図で、実際のネットワークの位置や時間を示しません。重複ACKによる早期再送は扱いません。",
    "遅延ACK、ウィンドウ、輻輳制御、RTOの計算法、アプリケーションへの受け渡し、切断は省略します。TCPだけでは暗号化されません。",
  ],
  steps,
};
