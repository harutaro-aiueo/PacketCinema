import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const macSource = "https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/lyr2-fwd/cdp-lldp-mac-udld/cdp-lldp-mac-udld-configuration-guide/c-configure-mac.html";
const vlanSource = "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst_microswitches/software/releases/15_2_7_e/configuration_guide/int_hw/b_1527e_int_and_hw_cms_cg/configuring_interface_characteristics.html";

const nodes = [
  { id: "a", label: "端末A", caption: "MAC末尾 0A", image: "./pixels/client.svg" },
  { id: "sw", label: "スイッチ", caption: "L2転送", image: "./pixels/server.svg" },
  { id: "b", label: "端末B", caption: "MAC末尾 0B", image: "./pixels/client.svg" },
];
const topology = {
  kind: "path" as const,
  links: [
    { id: "a-sw", from: "a", to: "sw", label: "ポート1" },
    { id: "sw-b", from: "sw", to: "b", label: "ポート2" },
  ],
};
const noEncryption = "Ethernetの転送は、この例では通信内容を暗号化しません。";

const sameVlan: Scenario = {
  id: "same-vlan", title: "Ethernetの転送", badge: "Ethernet / VLAN",
  sceneLabel: "端末A — スイッチ — 端末B",
  nodes, topology,
  prerequisites: [],
  notes: [
    "端末AとBは同じVLAN 10のアクセスポートにつながり、リンクとポートは転送可能な状態です。MACアドレス末尾0A・0Bは教材用の仮の値です。端末Aは端末BのMACアドレスを既に知っています。",
    "スイッチは受信フレームの送信元MACと受信ポートを学習します。宛先MACが未学習なら同じVLANの受信ポート以外へ転送します。図は該当する出力ポートを1本だけ描き、ほかの端末・ポートを省略します。",
    "フレームの内容、FCS検査、MAC表の期限、STP、タグ付きトランク、IPやARPの動作は扱いません。矢印は論理上のフレームの流れで、実測時間ではありません。",
  ],
  steps: [
    {
      kind: "message", from: "a", to: "sw", id: "first-frame", phase: "未学習の宛先",
      title: "端末AがB宛てに送る", wire: "Ethernet · src 0A → dst 0B",
      displayWire: "A → B のフレーム",
      description: "端末Aのフレームがポート1に届きます。宛先MACは端末Bですが、スイッチはまだBの接続先を知りません。",
      fields: ["送信元MAC：末尾0A", "宛先MAC：末尾0B", "受信ポート：1 / VLAN 10"],
      protection: noEncryption, source: macSource,
      states: { a: "送信済み", sw: "MAC表：空", b: "待受中" },
    },
    {
      kind: "local", node: "sw", id: "learn-a", phase: "未学習の宛先",
      title: "送信元Aをポート1に記録", wire: "VLAN 10 · 0A → port 1",
      description: "スイッチは受信フレームの送信元MACを見て、VLAN 10のMAC表にAとポート1の対応を記録します。宛先Bの場所はまだ不明です。",
      fields: ["学習：VLAN 10 / 末尾0A → ポート1", "宛先B：未学習"],
      protection: "スイッチ内の処理", source: macSource,
      effect: { kind: "stages", label: "MAC表", stages: [{ text: "0A → 1", status: "学習" }] },
      states: { a: "送信済み", sw: "0A → 1", b: "待受中" },
    },
    {
      kind: "message", from: "sw", to: "b", id: "unknown-forward", phase: "未学習の宛先",
      title: "同じVLANのポートへ転送", wire: "Ethernet · src 0A → dst 0B",
      displayWire: "宛先未学習 · 転送",
      description: "宛先Bが未学習なので、スイッチはVLAN 10の受信ポート以外へフレームを出します。図ではポート2からBへ届く1本を示します。",
      fields: ["宛先MAC：末尾0B", "VLAN 10の出力ポート：2", "送信元・宛先MACは変えない"],
      protection: noEncryption, source: macSource,
      states: { a: "送信済み", sw: "0A → 1", b: "受信" },
    },
    {
      kind: "message", from: "b", to: "sw", id: "reply", phase: "学習済みの宛先",
      title: "端末BがA宛てに返す", wire: "Ethernet · src 0B → dst 0A",
      displayWire: "B → A のフレーム",
      description: "この例では端末Bが別のフレームをAへ送ります。スイッチはポート2で受け取り、送信元Bの場所を学習できます。Ethernetが自動で返信するわけではありません。",
      fields: ["送信元MAC：末尾0B", "宛先MAC：末尾0A", "受信ポート：2 / VLAN 10"],
      protection: noEncryption, source: macSource,
      states: { a: "待受中", sw: "0A → 1", b: "送信済み" },
    },
    {
      kind: "local", node: "sw", id: "learn-b", phase: "学習済みの宛先",
      title: "送信元Bをポート2に記録", wire: "VLAN 10 · 0B → port 2",
      description: "スイッチはBとポート2の対応も記録します。宛先Aは既にポート1と分かっているため、次のフレームはそこだけへ転送できます。",
      fields: ["VLAN 10：末尾0A → ポート1", "VLAN 10：末尾0B → ポート2"],
      protection: "スイッチ内の処理", source: macSource,
      effect: { kind: "stages", label: "MAC表", stages: [{ text: "0B → 2", status: "学習" }] },
      states: { a: "待受中", sw: "0A→1 / 0B→2", b: "送信済み" },
    },
    {
      kind: "message", from: "sw", to: "a", id: "known-forward", phase: "学習済みの宛先",
      title: "Aのポートだけへ転送", wire: "Ethernet · src 0B → dst 0A",
      displayWire: "宛先学習済み · 転送",
      description: "宛先AのMAC表の記録を使い、スイッチはポート1だけへフレームを出します。端末AとBのMACアドレスは変わりません。",
      fields: ["宛先MAC：末尾0A", "VLAN 10 / 出力ポート：1", "送信元・宛先MACは変えない"],
      protection: noEncryption, source: macSource,
      states: { a: "受信", sw: "0A→1 / 0B→2", b: "送信済み" },
    },
  ],
};

const separatedVlan: Scenario = {
  id: "different-vlan", title: "VLANで分ける", badge: "Ethernet / VLAN",
  sceneLabel: "端末A — スイッチ — 端末B",
  nodes, topology,
  prerequisites: [{ protocol: "ethernet", label: "Ethernetの転送" }],
  notes: [
    "端末Aはアクセスポート1のVLAN 10、端末Bはアクセスポート2のVLAN 20です。両ポートは物理的につながっていますが、レイヤー2の転送先としては別々です。",
    "Aが送るフレームの宛先MACをBと知っている仮定にして、VLANによる転送範囲だけを示します。端末が通常この宛先を知る手順、VLAN間ルーティング、トランクの802.1Qタグ、IPアドレス設定は省略します。",
    "スイッチのレイヤー3機能は無効とします。VLAN間で通信するにはルーターなどのレイヤー3転送が別途必要です。アニメーションは実測時間ではありません。",
  ],
  steps: [
    {
      kind: "message", from: "a", to: "sw", id: "vlan10-frame", phase: "別々のVLAN",
      title: "AのフレームはVLAN 10へ入る", wire: "Ethernet · src 0A → dst 0B",
      displayWire: "VLAN 10のフレーム",
      description: "端末Aからポート1に入ったフレームは、ポートの設定によりVLAN 10に属します。宛先MACはBでも、出力先はVLAN 10内に限られます。",
      fields: ["ポート1：VLAN 10", "送信元MAC：末尾0A", "宛先MAC：末尾0B"],
      protection: noEncryption, source: vlanSource,
      states: { a: "VLAN 10", sw: "受信：VLAN 10", b: "VLAN 20" },
    },
    {
      kind: "local", node: "sw", id: "vlan-boundary", phase: "別々のVLAN",
      title: "VLAN 20のポートへは出さない", wire: "VLAN 10 ≠ VLAN 20",
      description: "ポート2はVLAN 20なので、このレイヤー2フレームの転送先になりません。宛先MACだけを見て、異なるVLANへ通すことはありません。",
      fields: ["受信側：ポート1 / VLAN 10", "ポート2：VLAN 20", "AからBへのレイヤー2転送：なし"],
      protection: "スイッチ内の判断", source: vlanSource,
      effect: { kind: "stages", label: "VLANの転送範囲", stages: [{ text: "10 ≠ 20", status: "転送しない" }] },
      states: { a: "VLAN 10", sw: "VLAN 10のみ", b: "VLAN 20" },
    },
    {
      kind: "local", node: "sw", id: "routing-needed", phase: "通信するには",
      title: "VLAN間はルーティングが必要", wire: "VLAN 10 → L3 → VLAN 20",
      description: "別VLANの端末Bと通信するには、ルーターなどがIPパケットを受け、VLAN 20側へ新しいリンク層フレームとして送る必要があります。この図ではその経路は描きません。",
      fields: ["同じVLAN：レイヤー2で転送", "別VLAN：レイヤー3の経路が必要"],
      protection: "経路の概念説明", source: vlanSource,
      effect: { kind: "stages", label: "次に学ぶこと", stages: [{ text: "ルーティング", status: "この図では省略" }] },
      states: { a: "VLAN 10", sw: "L3転送なし", b: "VLAN 20" },
    },
  ],
};

export const ethernet: ProtocolDefinition = {
  id: "ethernet", title: "EthernetとVLAN",
  description: "スイッチのMAC学習と転送、VLANで分かれる範囲を学ぶ",
  keywords: ["LAN", "スイッチ", "MACアドレス", "VLAN", "転送"],
  defaultScenarioId: sameVlan.id, scenarios: [sameVlan, separatedVlan],
};
