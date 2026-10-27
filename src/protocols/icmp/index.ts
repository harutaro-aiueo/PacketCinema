import type { ProtocolDefinition, Scenario } from "../../domain/lesson";
import { ttlExceeded } from "./scenarios/ttl-exceeded";

const rfc792 = "https://www.rfc-editor.org/rfc/rfc792.html#page-14";
const rfc1122 = "https://www.rfc-editor.org/rfc/rfc1122.html#section-3.2.2.6";
const rfc792Unreachable = "https://www.rfc-editor.org/rfc/rfc792.html#page-4";
const rfc1122Unreachable = "https://www.rfc-editor.org/rfc/rfc1122.html#section-3.2.2.1";
const rfc1122UdpPorts = "https://www.rfc-editor.org/rfc/rfc1122.html#section-4.1.3.1";
const rfc1122UdpErrors = "https://www.rfc-editor.org/rfc/rfc1122.html#section-4.1.3.3";

const scenario: Scenario = {
  id: "ipv4-echo",
  title: "ICMP：応答確認",
  badge: "IPv4",
  sceneLabel: "送信元 ↔ 宛先ホスト",
  nodes: [
    { id: "sender", label: "送信元", caption: "192.0.2.10", image: "./pixels/client.svg" },
    { id: "target", label: "宛先ホスト", caption: "192.0.2.20", image: "./pixels/server.svg" },
  ],
  prerequisites: [],
  notes: [
    "IPv4のユニキャスト宛てに、ICMP Echoを1回送って応答を受ける例です。192.0.2.0/24は文書用アドレスで、データの「hello」は教材用の値です。",
    "宛先まで通信でき、宛先がEcho要求を処理できる前提です。IPの経路選択、ARP、ファイアウォール、損失、再送、タイムアウトは描きません。応答がない場合の原因は、このやり取りだけでは特定できません。",
    "識別子とシーケンス番号は要求と応答の照合に使える値です。1往復だけを示し、実際の往復時間やツール固有の表示は扱いません。アニメーションの時間は実測値ではありません。",
  ],
  steps: [
    {
      kind: "local", node: "sender", id: "prepare", phase: "準備",
      title: "照合用の値を決める",
      wire: "Identifier=0x1234 / Sequence=1 / Data=hello",
      description: "送信元はEcho要求に識別子、シーケンス番号、データを入れます。この例では、あとで応答と照合できるように値を決めます。",
      fields: ["Identifier：0x1234", "Sequence Number：1", "Data：hello"],
      protection: "端末内の準備", source: rfc792,
      effect: { kind: "stages", label: "Echo要求の準備", stages: [{ text: "ID=0x1234 / Seq=1", status: "用意した値" }] },
    },
    {
      kind: "message", from: "sender", to: "target", id: "request", phase: "要求",
      title: "Echo要求を送る",
      wire: "ICMP Echo Request · Type=8 · Code=0 · ID=0x1234 · Seq=1 · Data=hello",
      displayWire: "ICMP Echo要求",
      description: "送信元から宛先ホストへEcho要求を送ります。Type 8、Code 0はIPv4のEcho要求を表します。",
      fields: ["送信元IPv4：192.0.2.10", "宛先IPv4：192.0.2.20", "Type：8 / Code：0", "Identifier：0x1234 / Sequence Number：1", "Data：hello"],
      protection: "この例ではICMPメッセージの認証を扱いません。", source: rfc792,
    },
    {
      kind: "local", node: "target", id: "receive", phase: "宛先",
      title: "要求を受け取り、応答を作る",
      wire: "Type 8 → Type 0 / Data=hello",
      description: "宛先ホストは自分宛てのEcho要求を受け取り、応答を作ります。識別子、シーケンス番号、受け取ったデータを応答へ引き継ぎます。",
      fields: ["応答のType：0 / Code：0", "Identifier：0x1234 / Sequence Number：1", "Data：hello"],
      protection: "ホスト内の処理", source: rfc1122,
      effect: { kind: "stages", label: "応答の準備", stages: [{ text: "ID=0x1234 / Seq=1 / hello", status: "応答へ引き継ぐ" }] },
    },
    {
      kind: "message", from: "target", to: "sender", id: "reply", phase: "応答",
      title: "Echo応答を返す",
      wire: "ICMP Echo Reply · Type=0 · Code=0 · ID=0x1234 · Seq=1 · Data=hello",
      displayWire: "ICMP Echo応答",
      description: "宛先ホストはIPの送信元と宛先を入れ替え、Type 0のEcho応答を返します。受け取ったデータをそのまま含めます。",
      fields: ["送信元IPv4：192.0.2.20", "宛先IPv4：192.0.2.10", "Type：0 / Code：0", "Identifier：0x1234 / Sequence Number：1", "Data：hello"],
      protection: "この例ではICMPメッセージの認証を扱いません。", source: rfc792,
    },
    {
      kind: "local", node: "sender", id: "match", phase: "確認",
      title: "応答を要求と照合する",
      wire: "ID=0x1234 / Seq=1 → 一致",
      description: "送信元は識別子とシーケンス番号を使い、届いた応答を先ほどの要求と対応付けます。この例では同じデータも確認して1往復を終えます。",
      fields: ["Identifier：0x1234", "Sequence Number：1", "Data：hello"],
      protection: "端末内の確認", source: rfc792,
      effect: { kind: "result", label: "Echoの結果", prompt: "応答：", text: "IDと番号が一致", pending: "照合中", complete: "応答を確認" },
    },
  ],
};

const portUnreachable: Scenario = {
  id: "udp-port-unreachable",
  title: "ICMP：UDPポート到達不能",
  badge: "IPv4 / UDP",
  sceneLabel: "送信元 ↔ 宛先ホスト",
  nodes: [
    { id: "sender", label: "送信元", caption: "192.0.2.10", image: "./pixels/client.svg" },
    { id: "target", label: "宛先ホスト", caption: "192.0.2.20", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "udp", label: "UDPの基本" }],
  notes: [
    "IPv4のユニキャストUDPデータグラムが宛先ホストまで届いたものの、宛先ポート9999で受け取るアプリがない例です。192.0.2.0/24は文書用アドレスです。",
    "この例では宛先ホストがICMP Destination Unreachableを返します。標準では送信がSHOULDであり、実際には設定やネットワークの状態によって返らないこともあります。応答がないだけでは原因を特定できません。",
    "IP経路、ARP、ファイアウォール、ICMPのレート制限、アプリごとのエラー表示は省きます。UDP自身は再送や到達保証を行いません。アニメーションの時間は実測値ではありません。",
  ],
  steps: [
    {
      kind: "local", node: "sender", id: "prepare-udp", phase: "準備",
      title: "UDPの宛先ポートを指定する",
      wire: "192.0.2.10:53000 → 192.0.2.20:9999",
      description: "送信元は宛先IPアドレスとUDPの宛先ポート9999を指定します。宛先ポートは、届いたデータをどのアプリへ渡すかを決めるための値です。",
      fields: ["送信元IPv4：192.0.2.10", "宛先IPv4：192.0.2.20", "UDP送信元ポート：53000", "UDP宛先ポート：9999"],
      protection: "端末内の準備", source: rfc1122UdpPorts,
      effect: { kind: "stages", label: "UDPの送信先", stages: [{ text: "192.0.2.20:9999", status: "宛先を指定" }] },
    },
    {
      kind: "message", from: "sender", to: "target", id: "send-udp", phase: "送信",
      title: "UDPデータグラムを送る",
      wire: "IPv4 / UDP · 53000 → 9999 · Data=hello",
      displayWire: "UDPデータグラム",
      description: "UDPデータグラムが宛先ホストへ届きます。IPの宛先はホスト、UDPの宛先ポートはその中の受け取り先を示します。",
      fields: ["送信元IPv4：192.0.2.10", "宛先IPv4：192.0.2.20", "UDP送信元ポート：53000", "UDP宛先ポート：9999", "Data：hello"],
      protection: "この例ではUDPデータの認証を扱いません。", source: rfc1122UdpPorts,
    },
    {
      kind: "local", node: "target", id: "no-listener", phase: "宛先",
      title: "ポート9999に受け取り先がない",
      wire: "UDP宛先ポート9999 → 待受なし",
      description: "宛先ホストはUDPの宛先ポートを調べます。この例ではポート9999で待ち受けるアプリがないため、データをアプリへ渡せません。",
      fields: ["UDP宛先ポート：9999", "待受アプリ：なし"],
      protection: "ホスト内の確認", source: rfc1122UdpPorts,
      effect: { kind: "stages", label: "ポートの確認", stages: [{ text: "9999: 待受なし", status: "配信できない" }] },
    },
    {
      kind: "message", from: "target", to: "sender", id: "unreachable", phase: "通知",
      title: "宛先ポートに届かない",
      wire: "ICMP Destination Unreachable · Type=3 · Code=3",
      displayWire: "ICMP ポート到達不能",
      description: "この例の宛先ホストは、ICMPのType 3・Code 3を送信元へ返します。通知には元のIPヘッダーとUDPヘッダーを含む先頭部分が入り、どの送信への通知か照合できます。",
      fields: ["送信元IPv4：192.0.2.20", "宛先IPv4：192.0.2.10", "ICMP Type：3 / Code：3", "引用：元のIPヘッダーとデータ先頭64ビット", "引用内UDP：53000 → 9999"],
      protection: "この例ではICMPメッセージの認証を扱いません。", source: rfc792Unreachable,
    },
    {
      kind: "local", node: "sender", id: "report-error", phase: "確認",
      title: "元のUDP送信と通知を対応付ける",
      wire: "引用内のUDP 53000 → 9999 → 送信を特定",
      description: "送信元は通知に含まれる元のデータグラム情報を使い、どのUDP送信へのエラーか対応付けます。アプリへの伝え方は実装によって異なり、この通知だけで別の通信の成功・失敗までは判断しません。",
      fields: ["ICMP Type：3 / Code：3", "元のUDP送信元ポート：53000", "元のUDP宛先ポート：9999", "結果：この送信の宛先ポートに受け取り先なし"],
      protection: "端末内の確認", source: rfc1122UdpErrors,
      effect: { kind: "result", label: "UDP送信の結果", prompt: "通知：", text: "ポート9999に待受なし", pending: "照合中", complete: "送信を特定" },
    },
  ],
};

export const icmp: ProtocolDefinition = {
  id: "icmp", title: "ICMP",
  description: "Echo応答、UDPポート到達不能、TTL切れの通知を学ぶ",
  keywords: ["ping", "疎通確認", "Echo", "応答", "ポート到達不能", "UDP", "エラー", "TTL", "経路"],
  defaultScenarioId: scenario.id, scenarios: [scenario, portUnreachable, ttlExceeded],
};
