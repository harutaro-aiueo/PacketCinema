import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const scenario: Scenario = {
  id: "neighbor-address",
  title: "IPv6近隣探索",
  badge: "IPv6 / ICMPv6",
  sceneLabel: "端末A ↔ 同じリンクの端末B",
  nodes: [
    { id: "a", label: "端末A", caption: "2001:db8::10", image: "./pixels/client.svg" },
    { id: "b", label: "端末B", caption: "2001:db8::20", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "arp", label: "IPv4のアドレス解決" }],
  notes: [
    "同じマルチキャスト対応Ethernetリンクにいる2台のIPv6端末で、端末Aが端末Bのリンク層アドレスを調べる成功例です。IPv6アドレスは文書用の2001:db8::/32、MACアドレスは教材用の仮の値です。",
    "近隣要請（NS）は端末Bの要請ノードマルチキャスト宛てです。図の矢印は受信する端末Bへの到達を表し、ほかの受信端末は描きません。近隣広告（NA）は端末Aへユニキャストで返します。",
    "近隣キャッシュのINCOMPLETEからREACHABLEへの移行だけを示します。重複アドレス検出、到達性の再確認、再送、無応答、ルーター、データ送信、認証は扱いません。アニメーションは実測時間を表しません。",
  ],
  steps: [
    {
      kind: "local", node: "a", id: "incomplete", phase: "準備",
      title: "近隣キャッシュを確認する",
      wire: "2001:db8::20 → INCOMPLETE",
      description: "端末Aは同じリンクの端末Bへ送るデータを持っていますが、端末BのMACアドレスを知りません。近隣キャッシュにINCOMPLETEの項目を作り、データを待機させます。",
      fields: ["対象IPv6：2001:db8::20", "近隣キャッシュ：INCOMPLETE", "データ：送信待ち"],
      protection: "端末内の確認", source: "https://www.rfc-editor.org/rfc/rfc4861.html#section-7.2.2",
      effect: { kind: "stages", label: "近隣キャッシュ", stages: [{ text: "2001:db8::20", status: "INCOMPLETE" }] },
    },
    {
      kind: "message", from: "a", to: "b", id: "solicitation", phase: "問い合わせ",
      title: "近隣要請を送る",
      wire: "ICMPv6 NS · target 2001:db8::20 · dst ff02::1:ff00:20",
      displayWire: "近隣要請 · 2001:db8::20は誰？",
      description: "端末Aは端末BのIPv6アドレスに対応する要請ノードマルチキャスト宛てに近隣要請を送ります。自分のMACアドレスをSource Link-Layer Addressオプションに入れます。",
      fields: ["ICMPv6 Type：135（NS）", "IPv6宛先：ff02::1:ff00:20", "Target Address：2001:db8::20", "Source Link-Layer Address：02:00:00:00:00:10"],
      protection: "この例では認証を扱いません。", source: "https://www.rfc-editor.org/rfc/rfc4861.html#section-7.2.2",
    },
    {
      kind: "local", node: "b", id: "target-check", phase: "受信側",
      title: "対象アドレスを確認する",
      wire: "target = 2001:db8::20",
      description: "端末Bは要請の対象が自分に割り当てられたIPv6アドレスだと確認します。送信元MACのオプションがあるので、端末Aの近隣キャッシュ項目を作るか更新できます。",
      fields: ["対象IPv6：2001:db8::20", "端末BのIPv6：2001:db8::20", "端末AのMAC：02:00:00:00:00:10"],
      protection: "端末内の確認", source: "https://www.rfc-editor.org/rfc/rfc4861.html#section-7.2.3",
      effect: { kind: "stages", label: "対象の確認", stages: [{ text: "2001:db8::20", status: "自分のアドレス" }] },
    },
    {
      kind: "message", from: "b", to: "a", id: "advertisement", phase: "応答",
      title: "近隣広告でMACを知らせる",
      wire: "ICMPv6 NA · target 2001:db8::20 · TLLA 02:00:00:00:00:20",
      displayWire: "近隣広告 · MACを通知",
      description: "端末Bは端末Aへユニキャストで近隣広告を返します。マルチキャストの要請への応答なので、端末BのMACアドレスをTarget Link-Layer Addressオプションに入れ、Solicitedフラグを立てます。",
      fields: ["ICMPv6 Type：136（NA）", "IPv6宛先：2001:db8::10", "Target Address：2001:db8::20", "Target Link-Layer Address：02:00:00:00:00:20", "Solicited：1"],
      protection: "この例では認証を扱いません。", source: "https://www.rfc-editor.org/rfc/rfc4861.html#section-7.2.4",
    },
    {
      kind: "local", node: "a", id: "reachable", phase: "完了",
      title: "近隣キャッシュを更新する",
      wire: "2001:db8::20 → 02:00:00:00:00:20 / REACHABLE",
      description: "端末Aは応答のMACアドレスを近隣キャッシュに記録します。Solicitedフラグが立っているため項目をREACHABLEにし、待機していたデータを送れる状態になります。データそのものの送信は示しません。",
      fields: ["対象IPv6：2001:db8::20", "MAC：02:00:00:00:00:20", "近隣キャッシュ：REACHABLE"],
      protection: "端末内の記録", source: "https://www.rfc-editor.org/rfc/rfc4861.html#section-7.2.5",
      effect: { kind: "result", label: "近隣キャッシュ", prompt: "2001:db8::20 → ", text: "02:00:00:00:00:20", pending: "解決中", complete: "REACHABLE" },
    },
  ],
};

export const ipv6Nd: ProtocolDefinition = {
  id: "ipv6-nd", title: "IPv6近隣探索",
  description: "近隣要請と近隣広告でIPv6アドレスからMACを調べる",
  keywords: ["NDP", "ICMPv6", "近隣要請", "近隣広告", "アドレス解決"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
