import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const rfc792 = "https://www.rfc-editor.org/rfc/rfc792.html#page-14";
const rfc1122 = "https://www.rfc-editor.org/rfc/rfc1122.html#section-3.2.2.6";

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

export const icmp: ProtocolDefinition = {
  id: "icmp", title: "ICMP",
  description: "Echo要求と応答で、IPv4ホストとの1往復を確かめる",
  keywords: ["ping", "疎通確認", "Echo", "応答"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
