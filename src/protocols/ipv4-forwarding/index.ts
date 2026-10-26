import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const hostRouting = "https://www.rfc-editor.org/rfc/rfc1122.html#section-3.3.1.1";
const gatewaySelection = "https://www.rfc-editor.org/rfc/rfc1122.html#section-3.3.1.2";
const routerDelivery = "https://www.rfc-editor.org/rfc/rfc1812.html#section-5.2.3";
const routerForwarding = "https://www.rfc-editor.org/rfc/rfc1812.html#section-5.2.1.2";
const ethernet = "https://www.rfc-editor.org/rfc/rfc894.html";
const protection = "この例のIPv4転送とEthernetは、通信内容の暗号化や相手の認証を行いません。";

const scenario: Scenario = {
  id: "direct-and-gateway",
  title: "IPv4転送",
  badge: "IPv4 / Ethernet",
  sceneLabel: "端末 → ルーター → 宛先",
  nodes: [
    { id: "host", label: "端末", caption: "192.0.2.10", image: "./pixels/client.svg" },
    { id: "router", label: "ルーター", caption: "2つのLAN", image: "./pixels/server.svg" },
    { id: "target", label: "宛先", caption: "198.51.100.20", image: "./pixels/client.svg" },
  ],
  topology: {
    kind: "path",
    links: [
      { id: "lan1", from: "host", to: "router", label: "LAN1" },
      { id: "lan2", from: "router", to: "target", label: "LAN2" },
    ],
  },
  prerequisites: [{ protocol: "arp", label: "ARP：次ホップのMACアドレスを調べる" }],
  notes: [
    "端末は192.0.2.10/24、ルーターのLAN1側は192.0.2.1/24、LAN2側は198.51.100.1/24、宛先端末は198.51.100.20/24です。IPアドレスはRFC 5737の文書用範囲、MACアドレスは教材用の仮の値です。",
    "前半は同じLAN上のルーター自身（192.0.2.1）を宛先とする通信です。後半は別サブネットの端末（198.51.100.20）宛ての独立した通信で、前半のパケットを転送するわけではありません。",
    "端末にはデフォルトゲートウェイ192.0.2.1、ルーターには198.51.100.0/24への直結経路があります。各次ホップのMACアドレスはARPで解決済みとします。ARP交換は別教材で学べます。",
    "単一の成功例です。経路の取得方法、NAT、ファイアウォール、戻り通信、IPオプション、分割、ICMP Redirect、TTL切れは省略します。ルーターによるTTLの1減少だけ示し、ヘッダー検査和の再計算は省略します。アニメーションの時間は実測ではありません。",
  ],
  steps: [
    {
      kind: "local", node: "host", id: "direct-decision", phase: "同じサブネット",
      title: "同じ /24 の宛先を選ぶ",
      wire: "192.0.2.10/24 → 192.0.2.1 = same subnet",
      description: "端末は自分と宛先192.0.2.1に/24のマスクを当て、どちらも192.0.2.0になることを確認します。同じ接続先ネットワークなので、次ホップは宛先自身です。",
      fields: ["送信元：192.0.2.10/24", "宛先：192.0.2.1", "マスク後：ともに192.0.2.0", "次ホップIP：192.0.2.1"],
      states: { host: "直接送る", router: "宛先", target: "待機" },
      protection, source: hostRouting,
      effect: { kind: "stages", label: "宛先判定", stages: [{ text: "192.0.2.0 = 192.0.2.0", status: "同じ/24" }] },
    },
    {
      kind: "message", from: "host", to: "router", id: "direct-frame", phase: "同じサブネット",
      title: "宛先へ直接送る",
      wire: "Ethernet 02:00:00:00:01:10 → 02:00:00:00:01:01 | IPv4 192.0.2.10 → 192.0.2.1, TTL=64",
      displayWire: "IPv4 → 192.0.2.1",
      description: "端末は宛先IPがルーター自身のLAN1側アドレスなので、そのMACアドレスを宛先にしたEthernetフレームへIPv4データグラムを入れます。ほかのルーターを経由しません。",
      fields: ["IPv4送信元：192.0.2.10", "IPv4宛先：192.0.2.1", "次ホップIP：192.0.2.1", "Ethernet送信元MAC：02:00:00:00:01:10", "Ethernet宛先MAC：02:00:00:00:01:01", "TTL：64"],
      states: { host: "送信", router: "受信", target: "待機" },
      protection, source: ethernet,
    },
    {
      kind: "local", node: "router", id: "direct-receive", phase: "同じサブネット",
      title: "ルーター自身が受け取る",
      wire: "IPv4 dst=192.0.2.1 → local delivery",
      description: "宛先IPはルーターのLAN1側アドレスです。ルーターは自分宛てとして受け取り、LAN2へ転送しません。この通信ではTTLも転送によって減りません。",
      fields: ["受信インターフェース：LAN1", "IPv4宛先：192.0.2.1（ルーター自身）", "転送：なし"],
      states: { host: "送信済", router: "自分宛て", target: "待機" },
      protection, source: routerDelivery,
      effect: { kind: "result", label: "宛先判定", prompt: "結果：", text: "自分宛て", pending: "宛先IPを確認中", complete: "ローカル受信" },
    },
    {
      kind: "local", node: "host", id: "remote-decision", phase: "別サブネット",
      title: "デフォルトゲートウェイを選ぶ",
      wire: "198.51.100.20 outside 192.0.2.0/24 → gateway 192.0.2.1",
      displayWire: "次ホップ 192.0.2.1",
      description: "次の独立した通信では、宛先198.51.100.20は端末の192.0.2.0/24に含まれません。端末はデフォルトゲートウェイ192.0.2.1を次ホップに選びます。IPv4の宛先は198.51.100.20のままです。",
      fields: ["送信元：192.0.2.10/24", "最終宛先IP：198.51.100.20", "端末の接続先：192.0.2.0/24", "次ホップIP：192.0.2.1"],
      states: { host: "GWを選択", router: "中継予定", target: "待機" },
      protection, source: gatewaySelection,
      effect: { kind: "stages", label: "宛先判定", stages: [{ text: "198.51.100.20 は別/24", status: "ゲートウェイへ" }] },
    },
    {
      kind: "message", from: "host", to: "router", id: "to-gateway", phase: "別サブネット",
      title: "まずゲートウェイへ送る",
      wire: "Ethernet 02:00:00:00:01:10 → 02:00:00:00:01:01 | IPv4 192.0.2.10 → 198.51.100.20, TTL=64",
      displayWire: "IPv4 → 198.51.100.20",
      description: "最初のリンクでは、Ethernetの宛先MACはゲートウェイのLAN1側です。一方、IPv4の宛先は最終宛先198.51.100.20であり、ゲートウェイのIPには書き換わりません。",
      fields: ["最終宛先IP：198.51.100.20", "次ホップIP：192.0.2.1", "Ethernet送信元MAC：02:00:00:00:01:10", "Ethernet宛先MAC：02:00:00:00:01:01", "TTL：64"],
      states: { host: "送信", router: "受信", target: "待機" },
      protection, source: ethernet,
    },
    {
      kind: "local", node: "router", id: "route-lookup", phase: "ルーターで中継",
      title: "宛先側のリンクを選ぶ",
      wire: "198.51.100.20 ∈ 198.51.100.0/24 → LAN2, next hop 198.51.100.20; TTL 64 → 63",
      displayWire: "LAN2へ · TTL 63",
      description: "ルーターは自分宛てではないIPv4宛先を経路表で調べます。198.51.100.0/24はLAN2への直結経路なので、次ホップは宛先自身です。転送に際してTTLを64から63に減らします。",
      fields: ["IPv4宛先：198.51.100.20（不変）", "選択経路：198.51.100.0/24 → LAN2", "次ホップIP：198.51.100.20", "TTL：64 → 63"],
      states: { host: "送信済", router: "経路選択", target: "待機" },
      protection, source: routerForwarding,
      effect: { kind: "stages", label: "転送判断", stages: [{ text: "198.51.100.0/24 → LAN2", status: "TTLを1減らす" }] },
    },
    {
      kind: "message", from: "router", to: "target", id: "to-target", phase: "ルーターで中継",
      title: "新しいフレームで宛先へ",
      wire: "Ethernet 02:00:00:00:02:01 → 02:00:00:00:02:20 | IPv4 192.0.2.10 → 198.51.100.20, TTL=63",
      displayWire: "IPv4 → 198.51.100.20",
      description: "次のリンクではルーターのLAN2側MACから宛先端末のMACへ送ります。Ethernetの送受信MACは前のリンクから変わりますが、IPv4の送信元と宛先はそのままです。宛先端末に届きます。",
      fields: ["IPv4送信元：192.0.2.10（不変）", "IPv4宛先：198.51.100.20（不変）", "次ホップIP：198.51.100.20", "Ethernet送信元MAC：02:00:00:00:02:01", "Ethernet宛先MAC：02:00:00:00:02:20", "TTL：63"],
      states: { host: "送信済", router: "転送", target: "受信" },
      protection, source: routerForwarding,
    },
  ],
};

export const ipv4Forwarding: ProtocolDefinition = {
  id: "ipv4-forwarding",
  title: "IPv4の転送",
  description: "同じサブネットへ直接送る場合と、ゲートウェイ経由で送る場合を比べる",
  keywords: ["IPアドレス", "サブネット", "デフォルトゲートウェイ", "次ホップ", "MACアドレス", "LAN"],
  defaultScenarioId: scenario.id,
  scenarios: [scenario],
};
