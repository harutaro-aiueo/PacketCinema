import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const rfc768 = "https://datatracker.ietf.org/doc/html/rfc768";
const rfc1122 = "https://www.rfc-editor.org/rfc/rfc1122.html#section-4.1";

const scenario: Scenario = {
  id: "ipv4-datagram",
  title: "UDPの基本",
  badge: "UDP / IPv4",
  sceneLabel: "送信アプリ ↔ 受信アプリ",
  nodes: [
    { id: "sender", label: "送信側", caption: "192.0.2.10", image: "./pixels/client.svg" },
    { id: "receiver", label: "受信側", caption: "192.0.2.20", image: "./pixels/server.svg" },
  ],
  prerequisites: [],
  notes: [
    "IPv4上のUDPで、短いデータを送って相手のアプリが返信する成功例です。192.0.2.0/24は文書用アドレスです。ポート53000と40000、データのhelloとokは教材用の値で、特定のアプリケーションプロトコルを表しません。",
    "TCPと違って、UDP自体には接続確立や応答の義務がありません。返信は受信側のアプリがこの例で選んだ動作です。到着、順序、重複排除、再送はUDPが保証せず、必要ならアプリ側で扱います。",
    "IPv4の経路、ARP、IP分割、損失、チェックサムの具体的な計算、ICMPエラーは省略します。チェックサムを使う例を示しますが、IPv4では送信時に無効化できる場合もあります。アニメーションの時間は実測値ではありません。",
  ],
  steps: [
    {
      kind: "local", node: "sender", id: "prepare", phase: "準備",
      title: "宛先とポートを決める",
      wire: "192.0.2.20:40000 / hello",
      description: "送信アプリは宛先IPv4アドレスと宛先ポートを指定し、5バイトのデータhelloをUDPに渡します。送信元ポートはこの例では53000を使います。",
      fields: ["送信元：192.0.2.10:53000", "宛先：192.0.2.20:40000", "データ：hello（5バイト）"],
      protection: "送信側アプリ内の準備", source: rfc768,
      effect: { kind: "stages", label: "送信の準備", stages: [{ text: "hello → 192.0.2.20:40000", status: "宛先を指定" }] },
    },
    {
      kind: "message", from: "sender", to: "receiver", id: "send", phase: "送信",
      title: "接続確立なしで送る",
      wire: "UDP · 53000 → 40000 · Length=13 · Data=hello",
      displayWire: "UDP · hello",
      description: "UDPは送信元と宛先のポート、長さ、チェックサムをヘッダーに載せてデータグラムを送ります。長さ13バイトは8バイトのヘッダーと5バイトのデータの合計です。",
      fields: ["送信元ポート：53000", "宛先ポート：40000", "Length：13バイト", "Checksum：使用", "Data：hello"],
      protection: "UDP自体は配送を保証しません。", source: rfc768,
    },
    {
      kind: "local", node: "receiver", id: "deliver", phase: "受信",
      title: "ポート40000のアプリへ渡す",
      wire: "Checksum確認 → Port 40000 → hello",
      description: "受信側はチェックサムを検証し、宛先ポート40000で待つアプリへデータを渡します。この例では検証に成功し、アプリが待ち受けています。",
      fields: ["宛先ポート：40000", "受信データ：hello", "チェックサム：検証成功"],
      protection: "チェックサムは認証や暗号化ではありません。", source: "https://www.rfc-editor.org/rfc/rfc1122.html#section-4.1.3.4",
      effect: { kind: "stages", label: "受信側の処理", stages: [{ text: "Port 40000 / hello", status: "アプリへ配送" }] },
    },
    {
      kind: "local", node: "receiver", id: "choose-reply", phase: "返信",
      title: "アプリが返信を選ぶ",
      wire: "ok → 192.0.2.10:53000",
      description: "受信側のアプリが、この例ではokという2バイトの返信を作ります。UDPが自動で応答するわけではありません。受信した送信元アドレスとポートを返信先に使います。",
      fields: ["返信先：192.0.2.10:53000", "データ：ok（2バイト）"],
      protection: "返信はアプリ側の動作", source: rfc768,
      effect: { kind: "stages", label: "返信の準備", stages: [{ text: "ok → 192.0.2.10:53000", status: "アプリが指定" }] },
    },
    {
      kind: "message", from: "receiver", to: "sender", id: "reply", phase: "返信",
      title: "別のデータグラムで返信する",
      wire: "UDP · 40000 → 53000 · Length=10 · Data=ok",
      displayWire: "UDP · ok",
      description: "受信側アプリの指示で、逆向きのUDPデータグラムを送ります。これは独立した送信であり、UDPの確認応答ではありません。長さ10バイトはヘッダー8バイトとデータ2バイトです。",
      fields: ["送信元ポート：40000", "宛先ポート：53000", "Length：10バイト", "Data：ok"],
      protection: "この返信もUDP自体は配送を保証しません。", source: rfc1122,
    },
    {
      kind: "local", node: "sender", id: "receive-reply", phase: "完了",
      title: "送信側アプリが返信を読む",
      wire: "Port 53000 → ok",
      description: "送信側のポート53000で待つアプリがokを受け取ります。この1往復は成功例で、UDPによる到着保証を意味しません。",
      fields: ["受信ポート：53000", "データ：ok"],
      protection: "端末内の処理", source: rfc768,
      effect: { kind: "result", label: "受信結果", prompt: "返信：", text: "ok", pending: "受信待ち", complete: "アプリが受信" },
    },
  ],
};

export const udp: ProtocolDefinition = {
  id: "udp", title: "UDP",
  description: "接続確立なしで送るデータグラムと、ポートによる受け渡し",
  keywords: ["データグラム", "ポート", "コネクションレス", "チェックサム"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
