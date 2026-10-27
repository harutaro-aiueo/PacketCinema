import type { Scenario } from "../../../domain/lesson";

const initiation = "https://www.rfc-editor.org/rfc/rfc5382.html#section-4.2";
const mapping = "https://www.rfc-editor.org/rfc/rfc5382.html#section-4.1";
const translation = "https://www.rfc-editor.org/rfc/rfc3022.html#section-4.1";
const waiting = { host: "接続前", router: "TCP対応表：空", server: "待受中" };
const opening = { host: "SYN送信", router: "TCP 62000 ↔ 53000", server: "SYNを受信" };
const established = { host: "接続済み", router: "TCP 62000 ↔ 53000", server: "接続済み" };

export const tcpOutbound: Scenario = {
  id: "tcp-outbound",
  title: "TCP接続とNAPT",
  badge: "NAPT / TCP",
  sceneLabel: "家庭内端末 → NAPTルーター → Webサーバー",
  nodes: [
    { id: "host", label: "家庭内端末", caption: "192.0.2.10", image: "./pixels/client.svg" },
    { id: "router", label: "NAPTルーター", caption: "外側 198.51.100.1", image: "./pixels/server.svg" },
    { id: "server", label: "Webサーバー", caption: "203.0.113.20", image: "./pixels/server.svg" },
  ],
  topology: {
    kind: "path",
    links: [
      { id: "lan", from: "host", to: "router", label: "家庭内LAN" },
      { id: "wan", from: "router", to: "server", label: "外側ネットワーク" },
    ],
  },
  prerequisites: [
    { protocol: "tcp", label: "TCPの接続確立" },
    { protocol: "ipv4-forwarding", label: "宛先IPと次ホップ" },
  ],
  notes: [
    "家庭内端末がWebサーバーのTCPポート443へ接続する成功例です。アドレスは文書用、ポート53000と62000は説明用の値です。TCPのSYN・SYN-ACK・ACKを先に学ぶと追いやすくなります。",
    "端末から始まる接続について、ルーターが最初のSYNで外側の対応を割り当て、以後の往復で使う例です。対応の再利用やフィルタリングは機器の方針に依存し、外側からの新規接続を許す意味ではありません。",
    "図の矢印は各リンクで見えるTCPセグメントの論理的な流れです。経路選択、ARP、MACアドレス、チェックサム更新、再送、接続終了、対応表の期限、TLSとHTTPは省略します。アニメーションは実測時間ではありません。",
  ],
  steps: [
    {
      kind: "message", from: "host", to: "router", id: "inside-syn", phase: "接続開始",
      title: "端末がSYNを送る",
      wire: "TCP SYN 192.0.2.10:53000 → 203.0.113.20:443",
      displayWire: "SYN · 変換前",
      description: "端末はWebサーバーへ接続を始めます。ルーターには、端末のアドレスとポートを送信元にしたSYNが届きます。宛先はWebサーバーのままです。",
      fields: ["送信元：192.0.2.10:53000", "宛先：203.0.113.20:443", "TCPフラグ：SYN"],
      protection: "TCP自体は暗号化しません。", source: initiation, states: waiting,
    },
    {
      kind: "local", node: "router", id: "tcp-map", phase: "変換",
      title: "TCPの対応を記録する",
      wire: "TCP 192.0.2.10:53000 ↔ 198.51.100.1:62000",
      description: "ルーターはこの内側の組に外側のポート62000を割り当てます。これから同じ接続の往復を変換するため、対応を保持します。",
      fields: ["プロトコル：TCP", "内側：192.0.2.10:53000", "外側：198.51.100.1:62000"],
      protection: "ルーター内の処理", source: mapping, states: opening,
      effect: { kind: "stages", label: "TCP対応表", stages: [{ text: "62000 ↔ 53000", status: "登録" }] },
    },
    {
      kind: "message", from: "router", to: "server", id: "outside-syn", phase: "接続開始",
      title: "外側の組でSYNを送る",
      wire: "TCP SYN 198.51.100.1:62000 → 203.0.113.20:443",
      displayWire: "SYN · 変換後",
      description: "ルーターは送信元IPとTCPポートを外側の組へ変えて転送します。Webサーバーには、ルーターの外側の組からの接続に見えます。",
      fields: ["送信元：198.51.100.1:62000", "宛先：203.0.113.20:443", "TCPフラグ：SYN"],
      protection: "NAPTは暗号化ではありません。", source: initiation, states: opening,
    },
    {
      kind: "message", from: "server", to: "router", id: "outside-syn-ack", phase: "応答",
      title: "SYN-ACKが外側の組へ戻る",
      wire: "TCP SYN-ACK 203.0.113.20:443 → 198.51.100.1:62000",
      displayWire: "SYN-ACK · 外側へ",
      description: "サーバーのSYN-ACKは、見えていたルーターの外側アドレスとポートを宛先にします。ルーターは保持したTCPの対応を調べます。",
      fields: ["送信元：203.0.113.20:443", "宛先：198.51.100.1:62000", "TCPフラグ：SYN, ACK"],
      protection: "受け入れは機器のフィルタリング方針にも依存します。", source: initiation, states: opening,
    },
    {
      kind: "message", from: "router", to: "host", id: "inside-syn-ack", phase: "逆変換",
      title: "宛先を端末の組に戻す",
      wire: "TCP SYN-ACK 203.0.113.20:443 → 192.0.2.10:53000",
      displayWire: "SYN-ACK · 逆変換後",
      description: "ルーターは対応表を使い、SYN-ACKの宛先IPとTCPポートを端末の組へ戻します。端末はサーバーからの応答を受け取ります。",
      fields: ["送信元：203.0.113.20:443", "宛先：192.0.2.10:53000", "TCPフラグ：SYN, ACK"],
      protection: "TCP自体は暗号化しません。", source: translation, states: opening,
    },
    {
      kind: "message", from: "host", to: "router", id: "inside-ack", phase: "接続確立",
      title: "端末がACKを返す",
      wire: "TCP ACK 192.0.2.10:53000 → 203.0.113.20:443",
      displayWire: "ACK · 変換前",
      description: "端末はSYN-ACKを確認してACKを送ります。このACKも同じTCP接続なので、ルーターは先ほどの対応を使います。",
      fields: ["送信元：192.0.2.10:53000", "宛先：203.0.113.20:443", "TCPフラグ：ACK"],
      protection: "TCP自体は暗号化しません。", source: initiation, states: opening,
    },
    {
      kind: "message", from: "router", to: "server", id: "outside-ack", phase: "接続確立",
      title: "同じ外側の組でACKを送る",
      wire: "TCP ACK 198.51.100.1:62000 → 203.0.113.20:443",
      displayWire: "ACK · 変換後",
      description: "ルーターはACKの送信元も外側の組へ変えます。WebサーバーはSYNと同じ組からACKを受け取り、接続が成立します。",
      fields: ["送信元：198.51.100.1:62000", "宛先：203.0.113.20:443", "TCPフラグ：ACK"],
      protection: "NAPTは暗号化ではありません。", source: initiation, states: established,
    },
    {
      kind: "local", node: "router", id: "mapping-remains", phase: "接続後",
      title: "後続のTCP通信にも対応を使う",
      wire: "TCP 192.0.2.10:53000 ↔ 198.51.100.1:62000",
      description: "接続が成立した後も、ルーターはこのTCPの対応を保持します。端末からのデータとサーバーからの返答にも、同じ組を使って変換します。",
      fields: ["内側：192.0.2.10:53000", "外側：198.51.100.1:62000", "相手：203.0.113.20:443"],
      protection: "ルーター内の処理", source: initiation, states: established,
      effect: { kind: "stages", label: "TCP対応表", stages: [{ text: "62000 ↔ 53000", status: "接続中" }] },
    },
  ],
};
