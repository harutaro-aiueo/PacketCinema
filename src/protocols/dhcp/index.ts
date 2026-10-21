import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const allocation = "https://www.rfc-editor.org/rfc/rfc2131.html#section-3.1";
const client = "https://www.rfc-editor.org/rfc/rfc2131.html#section-4.4.1";
const renewal = "https://www.rfc-editor.org/rfc/rfc2131.html#section-4.4.5";
const requestRules = "https://www.rfc-editor.org/rfc/rfc2131.html#section-4.3.2";

const scenario: Scenario = {
  id: "initial-lease",
  title: "DHCP：IPv4取得",
  badge: "DHCP / IPv4",
  sceneLabel: "端末 ↔ 同じLANのDHCPサーバー",
  nodes: [
    {
      id: "client",
      label: "端末",
      caption: "まだアドレスなし",
      image: "./pixels/client.svg",
    },
    {
      id: "server",
      label: "DHCPサーバー",
      caption: "192.0.2.1",
      image: "./pixels/server.svg",
    },
  ],
  prerequisites: [],
  notes: [
    "IPv4の新規取得を、同じLANにある1台のサーバーからの正常な応答で示します。192.0.2.0/24は文書用の架空のネットワークです。リレーエージェントや複数サーバーは登場しません。",
    "端末は起動時にアドレスを持たず、返信を受け取れるようブロードキャストフラグを設定した例です。OfferとACKはこの設定に従ってブロードキャストされます。描画上の矢印は論理的な送信元と受信先を表します。",
    "ACK後のアドレス重複確認は問題がない前提で省略します。競合時のDHCPDECLINE、DHCPNAK、再送、リース更新・解放、実際の待ち時間も扱いません。アニメーションの時間は実測値ではありません。",
  ],
  steps: [
    {
      kind: "message",
      from: "client",
      to: "server",
      id: "discover",
      phase: "探す",
      title: "使えるサーバーを探す",
      wire: "DHCPDISCOVER · 0.0.0.0:68 → 255.255.255.255:67 · xid=0x12345678",
      displayWire: "DHCPDISCOVER",
      description:
        "端末はまだIPv4アドレスを持たないため、DHCPDISCOVERをLANにブロードキャストしてサーバーを探します。xidはこの取得手続きの応答を対応付ける値です。",
      fields: [
        "Option 53=DHCPDISCOVER",
        "ciaddr=0.0.0.0",
        "xid=0x12345678",
        "BROADCASTフラグ=1",
      ],
      protection: "この例のDHCP通信は暗号化されません。",
      source: client,
    },
    {
      kind: "message",
      from: "server",
      to: "client",
      id: "offer",
      phase: "提案",
      title: "使えるアドレスを提案する",
      wire: "DHCPOFFER · yiaddr=192.0.2.10 · server=192.0.2.1",
      displayWire: "DHCPOFFER · 192.0.2.10",
      description:
        "サーバーは192.0.2.10とリース時間を提案します。これはまだ端末への割り当て確定ではありません。端末がブロードキャスト返信を要求したので、この例ではLANへブロードキャストします。",
      fields: [
        "Option 53=DHCPOFFER",
        "yiaddr=192.0.2.10",
        "Option 54=192.0.2.1",
        "Option 51=3600秒",
        "xid=0x12345678",
      ],
      protection: "この例のDHCP通信は暗号化されません。",
      source: allocation,
    },
    {
      kind: "message",
      from: "client",
      to: "server",
      id: "request",
      phase: "選択",
      title: "提案されたアドレスを要求する",
      wire: "DHCPREQUEST · requested=192.0.2.10 · server=192.0.2.1",
      displayWire: "DHCPREQUEST · 192.0.2.10",
      description:
        "端末は提案を選び、サーバー識別子と要求アドレスを入れたDHCPREQUESTをブロードキャストします。他のサーバーにも選択結果が伝わる形式です。この例ではサーバーは1台です。",
      fields: [
        "Option 53=DHCPREQUEST",
        "Option 54=192.0.2.1",
        "Option 50=192.0.2.10",
        "ciaddr=0.0.0.0",
        "xid=0x12345678",
      ],
      protection: "この例のDHCP通信は暗号化されません。",
      source: allocation,
    },
    {
      kind: "message",
      from: "server",
      to: "client",
      id: "ack",
      phase: "確定",
      title: "リースを確定して通知する",
      wire: "DHCPACK · yiaddr=192.0.2.10 · lease=3600s",
      displayWire: "DHCPACK · 192.0.2.10",
      description:
        "選ばれたサーバーは割り当てを記録し、DHCPACKでアドレスと設定値を返します。リース時間はこの例では3600秒です。返信はブロードキャストで届けます。",
      fields: [
        "Option 53=DHCPACK",
        "yiaddr=192.0.2.10",
        "Option 51=3600秒",
        "xid=0x12345678",
      ],
      protection: "この例のDHCP通信は暗号化されません。",
      source: allocation,
    },
    {
      kind: "local",
      node: "client",
      id: "bound",
      phase: "利用開始",
      title: "アドレスを設定する",
      wire: "192.0.2.10 · BOUND",
      description:
        "端末はxidが一致するACKを受け取り、設定値とリース時間を記録してBOUND状態になります。アドレス重複がないことを前提にした結果です。",
      fields: ["IPv4アドレス=192.0.2.10", "リース時間=3600秒", "状態=BOUND"],
      protection: "端末内の設定",
      source: client,
      effect: {
        kind: "result",
        text: "192.0.2.10",
        prompt: "取得したIPv4：",
        pending: "ACKを確認中",
        complete: "アドレスを設定",
        label: "DHCPの結果",
      },
    },
  ],
};

const renewalScenario: Scenario = {
  id: "lease-renewal",
  title: "DHCP：リース更新",
  badge: "DHCP / 更新",
  sceneLabel: "端末 ↔ リースを割り当てたDHCPサーバー",
  nodes: [
    { id: "client", label: "端末", caption: "192.0.2.10を利用中", image: "./pixels/client.svg" },
    { id: "server", label: "DHCPサーバー", caption: "192.0.2.1", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "dhcp", label: "IPv4アドレスの新規取得" }],
  notes: [
    "新規取得で192.0.2.10を3600秒借りた端末が、同じサーバーから正常に更新する例です。192.0.2.0/24は文書用の架空のネットワークです。",
    "T1は更新を始める時刻、T2は別のサーバーにも再要求を広げる時刻です。ここでは既定値のT1=1800秒、T2=3150秒を示します。実際にはサーバーが値を指定でき、再試行の時刻にも幅があります。",
    "サーバーが応答しない場合の再送、T2以降のブロードキャスト、リース満了、DHCPNAKは扱いません。図の時間は実測時間ではありません。",
  ],
  steps: [
    {
      kind: "local", node: "client", id: "leased", phase: "利用中", title: "借りたアドレスを使う",
      wire: "192.0.2.10 · BOUND · リース3600秒",
      description: "端末は取得済みの192.0.2.10を使っています。期限まで待つのではなく、途中で更新を試みます。",
      fields: ["状態=BOUND", "IPv4アドレス=192.0.2.10", "リース時間=3600秒"],
      protection: "端末内の状態", source: renewal,
      effect: { kind: "result", text: "BOUND", prompt: "状態：", pending: "リースを確認中", complete: "利用中", label: "端末の状態" },
    },
    {
      kind: "local", node: "client", id: "t1", phase: "更新開始", title: "T1で更新を始める",
      wire: "T1=1800秒 · RENEWING",
      description: "この例では借りてから1800秒後にT1を迎えます。端末はRENEWING状態に移り、元のサーバーへ更新を求めます。",
      fields: ["状態=RENEWING", "T1=1800秒", "T2=3150秒"],
      protection: "端末内の状態", source: renewal,
      effect: { kind: "result", text: "RENEWING", prompt: "状態：", pending: "T1を確認中", complete: "更新を開始", label: "端末の状態" },
    },
    {
      kind: "message", from: "client", to: "server", id: "renew-request", phase: "更新要求", title: "元のサーバーへ直接頼む",
      wire: "DHCPREQUEST · 192.0.2.10:68 → 192.0.2.1:67 · xid=0x87654321",
      displayWire: "DHCPREQUEST · ユニキャスト",
      description: "端末は今のアドレスをciaddrに入れ、元のサーバーへユニキャストします。新規取得時と違い、サーバー識別子と要求アドレスのオプションは入れません。",
      fields: ["Option 53=DHCPREQUEST", "ciaddr=192.0.2.10", "Option 54=なし", "Option 50=なし", "xid=0x87654321"],
      protection: "この例のDHCP通信は暗号化されません。", source: requestRules,
    },
    {
      kind: "message", from: "server", to: "client", id: "renew-ack", phase: "更新応答", title: "同じアドレスの利用を認める",
      wire: "DHCPACK · 192.0.2.1:67 → 192.0.2.10:68 · lease=3600s",
      displayWire: "DHCPACK · リース3600秒",
      description: "この例ではサーバーが更新を認め、同じアドレスと3600秒のリースをDHCPACKで返します。端末は要求と同じxidの応答を受け取ります。",
      fields: ["Option 53=DHCPACK", "yiaddr=192.0.2.10", "Option 51=3600秒", "xid=0x87654321"],
      protection: "この例のDHCP通信は暗号化されません。", source: renewal,
    },
    {
      kind: "local", node: "client", id: "renewed", phase: "更新完了", title: "期限を計算し直す",
      wire: "192.0.2.10 · BOUND",
      description: "端末は要求を送った時刻にACKのリース時間を足して、新しい満了時刻を決めます。BOUND状態に戻り、同じアドレスを使い続けます。",
      fields: ["状態=BOUND", "IPv4アドレス=192.0.2.10", "新しいリース時間=3600秒"],
      protection: "端末内の状態", source: renewal,
      effect: { kind: "result", text: "BOUND", prompt: "状態：", pending: "ACKを確認中", complete: "更新完了", label: "端末の状態" },
    },
  ],
};

export const dhcp: ProtocolDefinition = {
  id: "dhcp",
  title: "DHCP",
  description: "IPv4アドレスを探して借りるDiscover・Offer・Request・ACK",
  keywords: ["IPアドレス", "自動設定", "リース", "DORA"],
  defaultScenarioId: scenario.id,
  scenarios: [scenario, renewalScenario],
};
