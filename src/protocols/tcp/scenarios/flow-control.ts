import type { Scenario, Step } from "../../../domain/lesson";

const windowSource = "https://www.rfc-editor.org/rfc/rfc9293.html#section-3.8.6";
const updateSource = "https://www.rfc-editor.org/rfc/rfc9293.html#section-3.8.6.2.2";
const states = (client: string, server: string) => ({ client, server });
const protection = "TCP自体は暗号化しない";

const steps: Step[] = [
  {
    kind: "message", from: "server", to: "client", id: "window-four",
    phase: "受信可能な範囲", title: "受信側が4バイトの空きを知らせる",
    wire: "TCP ACK · SEQ=5001 · ACK=1001 · WIN=4",
    displayWire: "受信窓 4バイト",
    description: "接続済みのサーバーは、次に受け取る番号1001から4バイトを受け入れられると通知します。WINは受信側が示す受け入れ可能な範囲です。",
    fields: ["ACK=1001", "広告ウィンドウ=4バイト", "受信可能：1001〜1004"],
    states: states("4バイト送信可", "空き4バイト"), protection, source: windowSource,
  },
  {
    kind: "message", from: "client", to: "server", id: "fill-window",
    phase: "受信可能な範囲", title: "空きに収まる4バイトを送る",
    wire: "TCP ACK · SEQ=1001 · ACK=5001 · 4 bytes",
    displayWire: "データ 4バイト",
    description: "送信側は示された範囲に収まる4バイトを送ります。次のデータの番号は1005です。",
    fields: ["SEQ=1001", "データ長=4バイト", "送信した番号：1001〜1004"],
    states: states("確認待ち", "空き0バイト"), protection, source: windowSource,
  },
  {
    kind: "message", from: "server", to: "client", id: "window-zero",
    phase: "空きがなくなる", title: "受信確認と空き0を返す",
    wire: "TCP ACK · SEQ=5001 · ACK=1005 · WIN=0",
    displayWire: "ACK=1005 · WIN=0",
    description: "サーバーは4バイトを確認し、次に期待する番号1005を返します。受信バッファに空きがないため、広告ウィンドウは0です。ACKは受信済みの範囲、WINは今後受け入れられる範囲を表します。",
    fields: ["ACK=1005：1001〜1004を確認", "広告ウィンドウ=0バイト", "次のデータは送信待ち"],
    states: states("新規データを待機", "空き0バイト"), protection, source: windowSource,
  },
  {
    kind: "local", node: "client", id: "pause-send", phase: "空きがなくなる",
    title: "次のデータの送信を待つ", wire: "WIN=0 → 新しい4バイトを保留",
    description: "アプリから次の4バイトが渡されても、送信側はこの例では新しいデータを通常送信しません。受信可能な範囲が再び示されるのを待ちます。",
    fields: ["送信待ち：番号1005から4バイト", "受信側の広告ウィンドウ=0", "TCP接続は継続"],
    states: states("新規データを待機", "空き0バイト"), protection: "端末内の処理", source: windowSource,
    effect: { kind: "result", label: "送信判断", prompt: "TCP> ", text: "空きが戻るまで待機", pending: "受信窓を確認中", complete: "新規送信を保留" },
  },
  {
    kind: "local", node: "server", id: "app-read", phase: "空きが戻る",
    title: "受信アプリがデータを読み取る", wire: "受信バッファ 4 bytes → 0 bytes",
    description: "サーバーのアプリが受信済みの4バイトを読み取り、受信バッファに空きが戻ります。この処理はネットワーク上のメッセージではありません。",
    fields: ["アプリが読み取る：4バイト", "受信バッファの空き：4バイト"],
    states: states("新規データを待機", "空き4バイト"), protection: "端末内の処理", source: updateSource,
    effect: { kind: "stages", label: "受信側の空き", stages: [{ text: "アプリが4バイトを読む", status: "空き4バイト" }] },
  },
  {
    kind: "message", from: "server", to: "client", id: "window-update",
    phase: "空きが戻る", title: "同じACK番号で空きを知らせる",
    wire: "TCP ACK · SEQ=5001 · ACK=1005 · WIN=4",
    displayWire: "ACK=1005 · WIN=4",
    description: "サーバーはウィンドウ更新を送り、再び4バイト受け入れられると知らせます。新たなデータを受信したわけではないので、ACK番号は1005のままです。",
    fields: ["ACK=1005（変化なし）", "広告ウィンドウ=4バイト", "受信可能：1005〜1008"],
    states: states("4バイト送信可", "空き4バイト"), protection, source: updateSource,
  },
  {
    kind: "message", from: "client", to: "server", id: "send-after-update",
    phase: "送信を再開", title: "待っていた4バイトを送る",
    wire: "TCP ACK · SEQ=1005 · ACK=5001 · 4 bytes",
    displayWire: "データ 4バイト",
    description: "更新された受信可能範囲に収まるため、送信側は保留していた番号1005からの4バイトを送ります。",
    fields: ["SEQ=1005", "データ長=4バイト", "送信した番号：1005〜1008"],
    states: states("確認待ち", "空き0バイト"), protection, source: windowSource,
  },
  {
    kind: "message", from: "server", to: "client", id: "ack-after-update",
    phase: "送信を再開", title: "再開後のデータを確認する",
    wire: "TCP ACK · SEQ=5001 · ACK=1009 · WIN=0",
    displayWire: "ACK=1009",
    description: "サーバーは新しい4バイトを受信し、次に期待する番号1009を返します。この例ではバッファが再び満杯なのでWINは0です。",
    fields: ["ACK=1009：1005〜1008を確認", "広告ウィンドウ=0バイト"],
    states: states("新規データを待機", "空き0バイト"), protection, source: windowSource,
  },
];

export const flowControl: Scenario = {
  id: "flow-control", title: "TCP：受信窓と送信量", badge: "TCP",
  sceneLabel: "送信側 ↔ 受信側",
  nodes: [
    { id: "client", label: "端末", caption: "送信側", image: "./pixels/client.svg" },
    { id: "server", label: "サーバー", caption: "受信側", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "tcp", label: "TCPの接続確立とACK" }],
  notes: [
    "TCP接続が成立した後の一方向のデータ転送です。シーケンス番号1001/5001、受信バッファ4バイトは説明用の値です。ウィンドウ拡大オプションは使いません。",
    "ACK番号は次に期待するデータ番号、WINは今後受け入れられる範囲です。受信側アプリが読むと空きが戻る例です。実際のウィンドウ更新は実装の送信判断に左右されます。",
    "ゼロウィンドウ探査、ウィンドウ更新の損失、遅延ACK、SWS回避、輻輳制御、再送、切断は省略します。ウィンドウは受信側の空きの説明であり、ネットワークの混雑を示す値ではありません。アニメーションの時間は実測値ではありません。",
  ],
  steps,
};
