import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const source = "https://www.rfc-editor.org/rfc/rfc826.html";

const scenario: Scenario = {
  id: "ipv4-ethernet",
  title: "ARP：宛先を探す",
  badge: "ARP / IPv4",
  sceneLabel: "端末A ↔ 同じLANの端末B",
  nodes: [
    { id: "a", label: "端末A", caption: "192.0.2.10", image: "./pixels/client.svg" },
    { id: "b", label: "端末B", caption: "192.0.2.20", image: "./pixels/server.svg" },
  ],
  prerequisites: [],
  notes: [
    "IPv4を使う2台が同じEthernetのLANにあり、端末Aは端末BのMACアドレスをまだ知らない例です。IPアドレスは文書用の192.0.2.0/24、MACアドレスは教材用の仮の値です。",
    "ARP要求はLAN内にブロードキャストされます。図は2台だけを描き、ほかの受信端末を省略します。応答は要求元の端末Aに送られます。",
    "成功する1回の問い合わせだけを示します。キャッシュの期限や再確認、再送、無応答、ルーター越え、IPv6、アドレス重複検出は扱いません。アニメーションの時間は実測時間ではありません。",
  ],
  steps: [
    {
      kind: "local", node: "a", id: "lookup", phase: "準備",
      title: "宛先のMACアドレスを調べる",
      wire: "192.0.2.20 → MACアドレス未登録",
      description: "端末Aは同じLANの192.0.2.20に送るため、アドレス対応表を調べます。この例では対応するMACアドレスが見つからず、ARP要求を作ります。",
      fields: ["宛先IPv4：192.0.2.20", "対応するMAC：未登録"],
      protection: "端末内の確認", source,
      effect: { kind: "stages", label: "アドレス対応表", stages: [{ text: "192.0.2.20", status: "未登録" }] },
    },
    {
      kind: "message", from: "a", to: "b", id: "request", phase: "問い合わせ",
      title: "LANにARP要求を放送する",
      wire: "ARP REQUEST · Who has 192.0.2.20? Tell 192.0.2.10",
      displayWire: "ARP要求 · 192.0.2.20は誰？",
      description: "端末AはARP要求をEthernetのブロードキャストで送ります。送信元のIPv4とMAC、調べたい宛先IPv4を載せます。宛先MACはまだ分かっていません。図の矢印は端末Bへの到達を表します。",
      fields: ["Ethernet宛先：ブロードキャスト", "opcode：REQUEST (1)", "送信元：192.0.2.10 / 02:00:00:00:00:10", "対象IPv4：192.0.2.20", "対象MAC：未指定"],
      protection: "この例ではARPメッセージの認証を扱いません。", source,
    },
    {
      kind: "local", node: "b", id: "match", phase: "受信側",
      title: "対象IPv4が自分か確認する",
      wire: "target IPv4 = 192.0.2.20",
      description: "端末Bは要求の対象IPv4が自分のアドレスと一致することを確認します。RFC 826の受信処理例では、送信元のIPv4とMACも対応表に登録してから応答します。",
      fields: ["対象IPv4：192.0.2.20", "端末BのIPv4：192.0.2.20", "端末Aの対応：192.0.2.10 → 02:00:00:00:00:10"],
      protection: "端末内の確認", source,
      effect: { kind: "stages", label: "受信側の確認", stages: [{ text: "192.0.2.20", status: "自分のアドレス" }] },
    },
    {
      kind: "message", from: "b", to: "a", id: "reply", phase: "応答",
      title: "自分のMACアドレスを返す",
      wire: "ARP REPLY · 192.0.2.20 is at 02:00:00:00:00:20",
      displayWire: "ARP応答 · 02:00:00:00:00:20",
      description: "端末Bは自分のIPv4とMACアドレスを入れたARP応答を、要求元の端末AのMACアドレスに送ります。",
      fields: ["Ethernet宛先：02:00:00:00:00:10", "opcode：REPLY (2)", "送信元：192.0.2.20 / 02:00:00:00:00:20", "対象：192.0.2.10 / 02:00:00:00:00:10"],
      protection: "この例ではARPメッセージの認証を扱いません。", source,
    },
    {
      kind: "local", node: "a", id: "remember", phase: "完了",
      title: "IPv4とMACの対応を記録する",
      wire: "192.0.2.20 → 02:00:00:00:00:20",
      description: "端末Aは応答の送信元IPv4とMACアドレスの対応を表に記録します。これで同じLANの端末Bへ送るEthernetフレームの宛先MACが分かります。実際のデータ送信は示しません。",
      fields: ["192.0.2.20 → 02:00:00:00:00:20"],
      protection: "端末内の記録", source,
      effect: { kind: "result", label: "アドレス対応表", prompt: "192.0.2.20 → ", text: "02:00:00:00:00:20", pending: "確認中", complete: "登録済み" },
    },
  ],
};

export const arp: ProtocolDefinition = {
  id: "arp", title: "ARP",
  description: "同じLANでIPv4アドレスからMACアドレスを調べる",
  keywords: ["アドレス解決", "MACアドレス", "ブロードキャスト", "LAN"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
