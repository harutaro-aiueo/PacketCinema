import type { Scenario } from "../../../domain/lesson";

const routerTtl = "https://www.rfc-editor.org/rfc/rfc1812.html#section-5.3.1";
const icmpTimeExceeded = "https://www.rfc-editor.org/rfc/rfc792.html#page-6";

export const ttlExceeded: Scenario = {
  id: "ttl-exceeded",
  title: "ICMP：TTL切れの通知",
  badge: "IPv4 / ICMP",
  sceneLabel: "端末 → ルーター → 宛先",
  nodes: [
    { id: "sender", label: "送信元", caption: "192.0.2.10", image: "./pixels/client.svg" },
    { id: "router", label: "ルーター", caption: "192.0.2.1", image: "./pixels/server.svg" },
    { id: "target", label: "宛先", caption: "198.51.100.20", image: "./pixels/client.svg" },
  ],
  topology: {
    kind: "path",
    links: [
      { id: "first-lan", from: "sender", to: "router", label: "LAN1" },
      { id: "second-lan", from: "router", to: "target", label: "LAN2" },
    ],
  },
  prerequisites: [{ protocol: "ipv4-forwarding", label: "IPv4の転送：次ホップを選ぶ" }],
  notes: [
    "IPv4の単一ユニキャストデータグラムをTTL=1で送る例です。アドレスは文書用の値です。送信元の経路と戻り経路は利用可能で、ルーターがICMP通知を返せるものとします。",
    "TTLはルーターで転送するときに少なくとも1減ります。この例では1から0になり、元のデータグラムは宛先へ届きません。ICMP通知はルーターが新たに作る別のIPデータグラムで、元のTTL=0を引き継ぎません。",
    "実際にはICMP通知がフィルタリングやレート制限で届かないこともあります。通知がないだけで経路上の位置や原因は確定できません。ARP、経路選択の詳細、IPヘッダー検査和、往復時間は省略します。アニメーションの時間は実測値ではありません。",
  ],
  steps: [
    {
      kind: "local", node: "sender", id: "prepare-low-ttl", phase: "送信準備",
      title: "TTLを1にして宛先へ送る準備をする",
      wire: "IPv4 192.0.2.10 → 198.51.100.20 / TTL=1",
      description: "送信元は別のネットワークにある宛先へ、TTL=1のIPv4データグラムを用意します。次ホップはデフォルトゲートウェイです。",
      fields: ["送信元IPv4：192.0.2.10", "宛先IPv4：198.51.100.20", "TTL：1", "次ホップ：192.0.2.1"],
      states: { sender: "送信準備", router: "転送待ち", target: "未到達" },
      protection: "送信元内の準備", source: routerTtl,
      effect: { kind: "stages", label: "IPヘッダー", stages: [{ text: "宛先 198.51.100.20 / TTL=1", status: "準備完了" }] },
    },
    {
      kind: "message", from: "sender", to: "router", id: "to-router", phase: "送信",
      title: "次ホップのルーターへ届く",
      wire: "IPv4 192.0.2.10 → 198.51.100.20 / TTL=1",
      displayWire: "IPv4 TTL=1",
      description: "データグラムはまずルーターへ届きます。IPの宛先は最終宛先のままで、ルーター自身ではありません。",
      fields: ["送信元IPv4：192.0.2.10", "宛先IPv4：198.51.100.20", "受信時TTL：1"],
      states: { sender: "送信済", router: "受信", target: "未到達" },
      protection: "この例ではIPデータグラムの認証を扱いません。", source: routerTtl,
    },
    {
      kind: "local", node: "router", id: "ttl-zero-drop", phase: "ルーター",
      title: "転送時にTTLが0になり破棄する",
      wire: "TTL 1 → 0 / 元のデータグラムを破棄",
      description: "ルーターは転送時にTTLを1減らします。0になったため元のデータグラムを破棄し、LAN2へは転送しません。",
      fields: ["受信時TTL：1", "転送時TTL：0", "元のデータグラム：破棄", "宛先への転送：なし"],
      states: { sender: "通知待ち", router: "TTL切れ・破棄", target: "未到達" },
      protection: "ルーター内の処理", source: routerTtl,
      effect: { kind: "result", label: "転送判定", prompt: "TTL：", text: "1 → 0、破棄", pending: "減算中", complete: "転送しない" },
    },
    {
      kind: "message", from: "router", to: "sender", id: "time-exceeded", phase: "通知",
      title: "ルーターがTime Exceededを返す",
      wire: "ICMP Time Exceeded / Type=11 / Code=0",
      displayWire: "ICMP TTL切れ",
      description: "ルーターは送信元へICMP Time Exceeded（Type 11、Code 0）を返します。通知には元のIPヘッダーとデータの先頭部分が入り、どの送信への通知か分かります。",
      fields: ["ICMP Type：11 / Code：0", "通知元IPv4：192.0.2.1", "通知先IPv4：192.0.2.10", "引用：元のIPヘッダーとデータ先頭64ビット", "引用内宛先IPv4：198.51.100.20"],
      states: { sender: "通知受信", router: "通知を送信", target: "未到達" },
      protection: "この例ではICMPメッセージの認証を扱いません。", source: icmpTimeExceeded,
    },
    {
      kind: "local", node: "sender", id: "identify-hop", phase: "確認",
      title: "元の送信と通知を対応付ける",
      wire: "引用されたIPv4データグラム → TTL切れを確認",
      description: "送信元は引用された元のデータグラムを見て、この通知を先ほどの送信と対応付けます。元のデータグラムは宛先に届いていません。",
      fields: ["通知元：192.0.2.1", "ICMP Type：11 / Code：0", "元の宛先：198.51.100.20", "結果：ルーターでTTL切れ"],
      states: { sender: "TTL切れを確認", router: "破棄済", target: "未到達" },
      protection: "送信元内の確認", source: icmpTimeExceeded,
      effect: { kind: "result", label: "送信結果", prompt: "通知：", text: "ルーターでTTL切れ", pending: "照合中", complete: "元の送信を特定" },
    },
  ],
};
