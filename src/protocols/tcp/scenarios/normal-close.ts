import type { Scenario, Step } from "../../../domain/lesson";

const tcp = "https://www.rfc-editor.org/rfc/rfc9293.html";
const states = (client: string, server: string) => ({ client, server });

const steps: Step[] = [
  {
    kind: "message", from: "client", to: "server", id: "client-fin",
    phase: "片方向を閉じる", title: "端末が送信を終える",
    wire: "TCP FIN,ACK · SEQ=1001 · ACK=5001",
    displayWire: "FIN · 端末の送信終了",
    description: "端末はFINで、こちらからはもうデータを送らないと伝えます。サーバーは受信を終えますが、逆方向にはまだ送れます。",
    fields: ["SEQ=1001", "ACK=5001", "FINは番号を1つ使う", "端末→サーバーの送信終了"],
    protection: "TCP自体は暗号化しない", source: `${tcp}#section-3.6`,
    states: states("FIN-WAIT-1", "CLOSE-WAIT"),
  },
  {
    kind: "message", from: "server", to: "client", id: "client-fin-ack",
    phase: "片方向を閉じる", title: "端末のFINを確認する",
    wire: "TCP ACK · SEQ=5001 · ACK=1002",
    displayWire: "ACK=1002",
    description: "サーバーは端末のFINを確認します。端末はFIN-WAIT-2へ進み、サーバーからのデータとFINを待ちます。",
    fields: ["SEQ=5001", "ACK=1002", "データ長=0バイト", "サーバーはCLOSE-WAIT"],
    protection: "TCP自体は暗号化しない", source: `${tcp}#section-3.6`,
    states: states("FIN-WAIT-2", "CLOSE-WAIT"),
  },
  {
    kind: "message", from: "server", to: "client", id: "server-data",
    phase: "残る方向の通信", title: "サーバーはまだデータを送れる",
    wire: "TCP ACK · SEQ=5001 · ACK=1002 · 4 bytes",
    displayWire: "サーバーのデータ 4バイト",
    description: "端末はFIN-WAIT-2、サーバーはCLOSE-WAITです。端末側だけが送信を終えたので、サーバーは終了前の4バイトを送れます。",
    fields: ["SEQ=5001", "ACK=1002", "データ長=4バイト", "次に期待する番号=5005", "端末=FIN-WAIT-2 / サーバー=CLOSE-WAIT"],
    protection: "TCP自体は暗号化しない", source: `${tcp}#section-3.6.1`,
    states: states("FIN-WAIT-2", "CLOSE-WAIT"),
  },
  {
    kind: "message", from: "client", to: "server", id: "server-data-ack",
    phase: "残る方向の通信", title: "受け取ったデータを確認する",
    wire: "TCP ACK · SEQ=1002 · ACK=5005",
    displayWire: "ACK=5005",
    description: "端末は新しいデータを送らずに、サーバーの4バイトを確認します。ACKだけでは番号を使いません。",
    fields: ["SEQ=1002", "ACK=5005", "データ長=0バイト", "5001〜5004を確認済み"],
    protection: "TCP自体は暗号化しない", source: `${tcp}#section-3.4`,
    states: states("FIN-WAIT-2", "CLOSE-WAIT"),
  },
  {
    kind: "message", from: "server", to: "client", id: "server-fin",
    phase: "両方向を閉じる", title: "サーバーも送信を終える",
    wire: "TCP FIN,ACK · SEQ=5005 · ACK=1002",
    displayWire: "FIN · サーバーの送信終了",
    description: "サーバーも送信を終え、FINを送ります。端末は両方向の終了を確認し、TIME-WAITへ進みます。",
    fields: ["SEQ=5005", "ACK=1002", "FINは番号を1つ使う", "次に確認する番号=5006"],
    protection: "TCP自体は暗号化しない", source: `${tcp}#section-3.6`,
    states: states("TIME-WAIT", "LAST-ACK"),
  },
  {
    kind: "message", from: "client", to: "server", id: "server-fin-ack",
    phase: "両方向を閉じる", title: "最後のFINを確認する",
    wire: "TCP ACK · SEQ=1002 · ACK=5006",
    displayWire: "ACK=5006",
    description: "端末はTIME-WAITに残り、サーバーはCLOSEDになります。端末からのACKで、サーバーのFINを受け取ったことを確認します。",
    fields: ["SEQ=1002", "ACK=5006", "データ長=0バイト", "端末=TIME-WAIT / サーバー=CLOSED"],
    protection: "TCP自体は暗号化しない", source: `${tcp}#section-3.6`,
    states: states("TIME-WAIT", "CLOSED"),
  },
  {
    kind: "local", node: "client", id: "time-wait-end",
    phase: "終了", title: "TIME-WAITを終える",
    wire: "TIME-WAIT → CLOSED", displayWire: "待機後に終了",
    description: "端末は2×MSLのTIME-WAITが終わると接続を閉じます。ここでは実際の待ち時間を再現しません。",
    fields: ["端末=TIME-WAIT → CLOSED", "待機=2×MSL", "実測時間は表現しない"],
    protection: "端末内の処理", source: `${tcp}#section-3.6`,
    states: states("CLOSED", "CLOSED"),
    effect: { kind: "result", label: "接続の状態", prompt: "TCP> ", text: "CLOSED", pending: "TIME-WAIT", complete: "終了" },
  },
];

export const normalClose: Scenario = {
  id: "normal-close", title: "TCPの正常終了", badge: "TCP",
  sceneLabel: "端末 ↔ サーバー",
  nodes: [
    { id: "client", label: "端末", caption: "先に送信終了", image: "./pixels/client.svg" },
    { id: "server", label: "サーバー", caption: "後で送信終了", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "tcp", label: "TCPの接続確立" }],
  notes: [
    "接続確立済みで、端末が先に送信を終える正常例です。開始時の次の送信番号は端末1001、サーバー5001で、未確認データはありません。番号は説明用です。",
    "FINは番号を1つ使い、データのないACKは使いません。端末のFIN後もサーバーはデータを送れます。この例ではサーバーが4バイト送ってから終了します。",
    "同時切断、RST、FINやACKの損失・再送、オプションとアプリケーションの終了処理は扱いません。TIME-WAITの2×MSLをアニメーションの長さで表していません。",
  ],
  steps,
};
