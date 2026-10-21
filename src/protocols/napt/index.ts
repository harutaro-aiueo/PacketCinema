import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const overview = "https://www.rfc-editor.org/rfc/rfc3022.html#section-2.2";
const translation = "https://www.rfc-editor.org/rfc/rfc3022.html#section-4.1";
const udpMapping = "https://www.rfc-editor.org/rfc/rfc4787.html#section-4.1";

const noMapping = { host: "送信前", router: "対応表：空", server: "待受中" };
const mapped = {
  host: "送信元 53000",
  router: "62000 ↔ 53000",
  server: "待受 40000",
};

const scenario: Scenario = {
  id: "udp-outbound",
  title: "NAPTの往復",
  badge: "NAPT / UDP",
  sceneLabel: "家庭内端末 → NAPTルーター → 外部サーバー",
  nodes: [
    { id: "host", label: "家庭内端末", caption: "192.0.2.10", image: "./pixels/client.svg" },
    { id: "router", label: "NAPTルーター", caption: "外側 198.51.100.1", image: "./pixels/server.svg" },
    { id: "server", label: "外部サーバー", caption: "203.0.113.20", image: "./pixels/server.svg" },
  ],
  topology: {
    kind: "path",
    links: [
      { id: "lan", from: "host", to: "router", label: "家庭内LAN" },
      { id: "wan", from: "router", to: "server", label: "外側ネットワーク" },
    ],
  },
  prerequisites: [
    { protocol: "udp", label: "UDPのポート" },
    { protocol: "arp", label: "同一リンクでの送信" },
  ],
  notes: [
    "家庭内LANの端末がUDPを外へ送り、相手のアプリが返信する成功例です。192.0.2.0/24、198.51.100.0/24、203.0.113.0/24は文書用アドレスです。各ポートと返信内容も教材用の値です。",
    "NAPTはIPアドレスに加えてUDPポートも変換します。ここでは端末が外へ送ったときに対応表を作り、返信が届くまで保持する例を示します。外部から新しく通信を始める条件やフィルタリングは扱いません。",
    "経路選択、ARP、リンクごとのMAC、IPとUDPのチェックサム再計算、UDP対応表の期限、複数端末の競合、損失を省略します。アプリの返信は必須ではありません。アニメーションの時間は実測値ではありません。",
  ],
  steps: [
    {
      kind: "local", node: "host", id: "prepare", phase: "送信前",
      title: "外部サーバーを宛先にする",
      wire: "192.0.2.10:53000 → 203.0.113.20:40000",
      description: "家庭内端末のアプリが外部サーバーへUDPを送ります。宛先は外部サーバーのまま、まずルーターへ渡します。",
      fields: ["送信元：192.0.2.10:53000", "宛先：203.0.113.20:40000", "UDPデータ：hello"],
      protection: "端末内の準備", source: overview, states: noMapping,
      effect: { kind: "stages", label: "送信準備", stages: [{ text: "宛先を指定", status: "ルーターへ送る" }] },
    },
    {
      kind: "message", from: "host", to: "router", id: "inside-send", phase: "外向き",
      title: "端末のアドレスとポートで届く",
      wire: "UDP 192.0.2.10:53000 → 203.0.113.20:40000",
      displayWire: "UDP · 変換前",
      description: "ルーターの内側には、端末の送信元アドレスとポートを持つUDPデータグラムが届きます。IPの宛先は外部サーバーです。",
      fields: ["送信元：192.0.2.10:53000", "宛先：203.0.113.20:40000"],
      protection: "UDP自体は配送を保証しません。", source: overview, states: noMapping,
    },
    {
      kind: "local", node: "router", id: "create-mapping", phase: "変換",
      title: "内側と外側の対応を記録する",
      wire: "192.0.2.10:53000 ↔ 198.51.100.1:62000",
      description: "ルーターはこの送信に外側のポート62000を割り当て、端末の組と対応付けます。この例では返信まで対応表を保持します。",
      fields: ["内側：192.0.2.10:53000", "外側：198.51.100.1:62000", "プロトコル：UDP"],
      protection: "ルーター内の処理", source: udpMapping, states: mapped,
      effect: { kind: "stages", label: "対応表", stages: [{ text: "内側 ↔ 外側", status: "登録" }] },
    },
    {
      kind: "message", from: "router", to: "server", id: "outside-send", phase: "外向き",
      title: "外側のアドレスとポートで送る",
      wire: "UDP 198.51.100.1:62000 → 203.0.113.20:40000",
      displayWire: "UDP · 変換後",
      description: "ルーターは送信元IPと送信元ポートを外側の組へ変えます。宛先は外部サーバーのままです。サーバーにはルーターの外側の組が見えます。",
      fields: ["送信元：198.51.100.1:62000", "宛先：203.0.113.20:40000", "変換：送信元IP・送信元UDPポート"],
      protection: "アドレス変換は暗号化ではありません。", source: translation, states: mapped,
    },
    {
      kind: "local", node: "server", id: "choose-reply", phase: "返信",
      title: "アプリが返信を選ぶ",
      wire: "ok → 198.51.100.1:62000",
      description: "サーバーのアプリは、この例で返信を作ります。返信先は見えているルーターの外側のアドレスとポートです。UDPが自動で返信するわけではありません。",
      fields: ["返信先：198.51.100.1:62000", "UDPデータ：ok"],
      protection: "アプリ内の処理", source: overview, states: mapped,
      effect: { kind: "stages", label: "返信準備", stages: [{ text: "ok", status: "アプリが選択" }] },
    },
    {
      kind: "message", from: "server", to: "router", id: "outside-reply", phase: "返信",
      title: "外側のポートに返信が届く",
      wire: "UDP 203.0.113.20:40000 → 198.51.100.1:62000",
      displayWire: "UDP · 外側へ返信",
      description: "返信はルーターの外側アドレスとポート62000へ届きます。ルーターは保持している対応表から内側の送信元を探します。",
      fields: ["送信元：203.0.113.20:40000", "宛先：198.51.100.1:62000"],
      protection: "受け入れ条件は機器のフィルタリング設定にも依存します。", source: udpMapping, states: mapped,
    },
    {
      kind: "local", node: "router", id: "reverse-mapping", phase: "逆変換",
      title: "対応表から端末を見つける",
      wire: "198.51.100.1:62000 → 192.0.2.10:53000",
      description: "ルーターは宛先の外側の組を対応表で引き、宛先IPと宛先ポートを端末の組へ戻します。",
      fields: ["変換前の宛先：198.51.100.1:62000", "変換後の宛先：192.0.2.10:53000"],
      protection: "ルーター内の処理", source: translation, states: mapped,
      effect: { kind: "stages", label: "対応表", stages: [{ text: "外側 → 内側", status: "照合" }] },
    },
    {
      kind: "message", from: "router", to: "host", id: "inside-reply", phase: "完了",
      title: "端末へ返信を届ける",
      wire: "UDP 203.0.113.20:40000 → 192.0.2.10:53000",
      displayWire: "UDP · 逆変換後",
      description: "端末には宛先を元の組へ戻した返信が届きます。送信元は外部サーバーです。ルーターが返信を作ったわけではありません。",
      fields: ["送信元：203.0.113.20:40000", "宛先：192.0.2.10:53000", "UDPデータ：ok"],
      protection: "UDP自体は配送を保証しません。", source: translation, states: mapped,
    },
  ],
};

export const napt: ProtocolDefinition = {
  id: "napt", title: "NAPT",
  description: "家庭内端末の通信を、ルーターの外側アドレスとポートへ変換する",
  keywords: ["NAT", "IPマスカレード", "ポート変換", "家庭内LAN"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
