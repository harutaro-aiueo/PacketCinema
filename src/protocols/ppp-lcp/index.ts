import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const rfc = "https://www.rfc-editor.org/rfc/rfc1661.html";

const scenario: Scenario = {
  id: "link-open",
  title: "PPP：LCP接続設定",
  badge: "PPP",
  sceneLabel: "端末A ↔ 端末B",
  nodes: [
    { id: "a", label: "端末A", caption: "PPPの一方", image: "./pixels/client.svg" },
    { id: "b", label: "端末B", caption: "PPPの相手", image: "./pixels/server.svg" },
  ],
  prerequisites: [],
  notes: [
    "RFC 1661のLCPで、物理リンクが利用可能になった後、双方が既定値のまま接続設定を受け入れる一例です。オプションを指定しないConfigure-Requestを使います。",
    "双方向の要求と応答を見やすい順に並べた論理メッセージです。実際の送信順や時間を保証しません。再送、Nak/Reject、認証、NCPによるネットワーク層の設定、切断は省きます。",
    "双方の要求が承認されて初めてLCPの接続設定が完了します。ここでIP通信まで利用可能になったことは意味しません。",
  ],
  steps: [
    {
      kind: "message", from: "a", to: "b", id: "a-request", phase: "設定要求",
      title: "Aが設定を要求",
      wire: "LCP Configure-Request · ID=1 · Options=なし", displayWire: "A → B 設定要求",
      description: "端末AはLCPの接続設定を始めます。オプションを付けず、既定値を使う要求です。B側の設定はまだ承認されていません。",
      fields: ["Code：1（Configure-Request）", "Identifier：1", "Options：なし", "Length：4バイト"],
      protection: "認証前の設定交渉", source: rfc + "#section-5.1",
    },
    {
      kind: "message", from: "b", to: "a", id: "b-request", phase: "設定要求",
      title: "Bも設定を要求",
      wire: "LCP Configure-Request · ID=2 · Options=なし", displayWire: "B → A 設定要求",
      description: "端末Bも自分の設定要求を送ります。LCPでは両端がそれぞれ要求を送り、相手からの応答を待ちます。",
      fields: ["Code：1（Configure-Request）", "Identifier：2", "Options：なし", "Length：4バイト"],
      protection: "認証前の設定交渉", source: rfc + "#section-3.4",
    },
    {
      kind: "message", from: "a", to: "b", id: "a-ack", phase: "設定承認",
      title: "AがBの要求を承認",
      wire: "LCP Configure-Ack · ID=2 · Options=なし", displayWire: "A → B 設定承認",
      description: "端末AはBの要求を受け入れ、同じIdentifierとオプション内容でAckを返します。A自身の要求へのAckはまだ届いていません。",
      fields: ["Code：2（Configure-Ack）", "Identifier：2（Bの要求に対応）", "Options：なし", "状態：AはBの要求を承認"],
      protection: "認証前の設定交渉", source: rfc + "#section-5.2",
    },
    {
      kind: "message", from: "b", to: "a", id: "b-ack", phase: "設定承認",
      title: "BもAの要求を承認",
      wire: "LCP Configure-Ack · ID=1 · Options=なし", displayWire: "B → A 設定承認",
      description: "端末BもAの要求を同じIdentifierと内容で承認します。双方の要求へのAckが届くと、LCPの設定交渉は完了します。",
      fields: ["Code：2（Configure-Ack）", "Identifier：1（Aの要求に対応）", "Options：なし", "状態：双方の要求を承認"],
      protection: "認証前の設定交渉", source: rfc + "#section-3.4",
    },
  ],
};

export const pppLcp: ProtocolDefinition = {
  id: "ppp-lcp", title: "PPPのLCP", description: "両端の設定要求と承認でリンクを開く",
  keywords: ["リンク制御", "PPP", "接続設定", "Configure-Ack"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
