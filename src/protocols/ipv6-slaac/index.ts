import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const nd = "https://www.rfc-editor.org/rfc/rfc4861.html";
const slaac = "https://www.rfc-editor.org/rfc/rfc4862.html";

const scenario: Scenario = {
  id: "router-advertisement",
  title: "IPv6自動設定",
  badge: "IPv6 / RS・RA",
  sceneLabel: "端末 ↔ 同じリンクのルーター",
  nodes: [
    { id: "host", label: "端末", caption: "fe80::10", image: "./pixels/client.svg" },
    { id: "router", label: "ルーター", caption: "fe80::1", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "ipv6-nd", label: "IPv6近隣探索" }],
  notes: [
    "家庭や企業LANに接続した端末が、同じリンクのルーターからプレフィックスとデフォルトルーターを知る成功例です。端末のリンクローカルアドレスfe80::10は設定済みで、重複確認も完了しています。2001:db8:1::/64は文書用の架空の値です。",
    "RSは全ルーター宛て、ここでのRAは全ノード宛てのマルチキャストです。図の矢印は、この例で登場する端末とルーターの間の論理的な流れを表します。RAはRSがなくても定期的に送られ、応答がユニキャストになる場合もあります。",
    "RAのプレフィックス情報ではA=1で自動アドレス作成、L=1でオンリンク判断を示します。端末のインターフェースIDは説明用に::10と固定します。重複アドレス検出の通信、DHCPv6、DNS情報、複数ルーター、期限切れや再送は扱いません。アニメーションは実測時間ではありません。",
  ],
  steps: [
    {
      kind: "message", from: "host", to: "router", id: "rs", phase: "ルーターを探す",
      title: "ルーターへ情報を求める",
      wire: "ICMPv6 RS · fe80::10 → ff02::2",
      displayWire: "RS · ルーターはいますか？",
      description: "端末は次の定期的な通知を待たずに設定を知るため、全ルーターのマルチキャストアドレスへRouter Solicitation（RS）を送ります。",
      fields: ["ICMPv6 Type：133（RS）", "送信元IPv6：fe80::10", "宛先IPv6：ff02::2"],
      protection: "この例では認証を扱いません。", source: `${nd}#section-6.3.7`,
    },
    {
      kind: "message", from: "router", to: "host", id: "ra", phase: "設定を知らせる",
      title: "プレフィックスとルーターを通知する",
      wire: "ICMPv6 RA · fe80::1 → ff02::1 · PIO 2001:db8:1::/64",
      displayWire: "RA · プレフィックスを通知",
      description: "ルーターは全ノード宛てにRouter Advertisement（RA）を送ります。Router Lifetimeが0でないため、このルーターはデフォルトルーターの候補です。プレフィックス情報のAフラグはアドレス自動作成を許可します。",
      fields: ["ICMPv6 Type：134（RA）", "送信元IPv6：fe80::1", "宛先IPv6：ff02::1", "Router Lifetime：1800秒", "Prefix：2001:db8:1::/64", "A=1 / L=1", "Preferred：3600秒 / Valid：7200秒"],
      protection: "この例では認証を扱いません。", source: `${nd}#section-4.2`,
    },
    {
      kind: "local", node: "host", id: "router-list", phase: "経路を記録",
      title: "デフォルトルーターを記録する",
      wire: "Default Router List ← fe80::1",
      description: "端末はRAの送信元fe80::1をデフォルトルーターの一覧に登録します。プレフィックスのLフラグが1なので、2001:db8:1::/64を同じリンクの宛先として扱います。",
      fields: ["デフォルトルーター：fe80::1", "Router Lifetime：1800秒", "オンリンク：2001:db8:1::/64"],
      protection: "端末内の設定", source: `${nd}#section-6.3.4`,
      effect: { kind: "stages", label: "受け取った設定", stages: [{ text: "fe80::1", status: "デフォルトルーター" }, { text: "2001:db8:1::/64", status: "同じリンク" }] },
    },
    {
      kind: "local", node: "host", id: "tentative", phase: "アドレスを作る",
      title: "プレフィックスから候補を作る",
      wire: "2001:db8:1::/64 + ::10 → 2001:db8:1::10",
      description: "端末はA=1のプレフィックスと、この例のインターフェースIDを組み合わせます。できたアドレスは重複確認が終わるまで仮の状態です。",
      fields: ["Prefix：2001:db8:1::/64", "Interface ID：::10", "候補：2001:db8:1::10", "状態：仮アドレス"],
      protection: "端末内の設定", source: `${slaac}#section-5.5.3`,
      effect: { kind: "stages", label: "アドレス設定", stages: [{ text: "2001:db8:1::10", status: "重複確認待ち" }] },
    },
    {
      kind: "local", node: "host", id: "usable", phase: "利用開始",
      title: "重複がなければ利用を始める",
      wire: "2001:db8:1::10 → 使用可能",
      description: "この例では重複アドレス検出に成功したものとして、端末が2001:db8:1::10を利用可能にします。検出で重複した場合は使えません。検出のNS通信はこの場面では省略しています。",
      fields: ["IPv6アドレス：2001:db8:1::10", "重複確認：成功と仮定", "状態：使用可能"],
      protection: "端末内の設定", source: `${slaac}#section-5.4`,
      effect: { kind: "result", label: "端末のIPv6", prompt: "設定結果：", text: "2001:db8:1::10", pending: "重複確認中", complete: "使用可能" },
    },
  ],
};

export const ipv6Slaac: ProtocolDefinition = {
  id: "ipv6-slaac", title: "IPv6自動設定",
  description: "RS・RAからルーターとプレフィックスを知り、IPv6アドレスを作る",
  keywords: ["SLAAC", "ルーター要請", "ルーター広告", "Router Solicitation", "Router Advertisement", "プレフィックス"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
