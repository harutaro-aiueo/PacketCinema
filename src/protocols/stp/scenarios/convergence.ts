import type { Scenario, Step, StepContent } from "../../../domain/lesson";

const source =
  "https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/lan-wan/lan-wan/m_lsw-span-tree-prot.html";
const pending = { ab: "pending", ac: "pending", bc: "pending" } as const;
const selected = { ...pending, bc: "blocked" } as const;
const stable = { ab: "forwarding", ac: "forwarding", bc: "blocked" } as const;
const failed = { ...stable, ac: "down" } as const;
const recovering = { ...failed, bc: "pending" } as const;
const recovered = { ...failed, bc: "forwarding" } as const;
const roles = {
  a: "ROOT / DP",
  b: "A側 RP · C側 DP",
  c: "A側 RP · B側 非指定",
};
const selectedAnnotations = {
  nodeDetails: { a: "Root cost 0", b: "Root cost 4", c: "Root cost 4" },
  portRoles: {
    ab: { from: "DP", to: "RP" },
    ac: { from: "DP", to: "RP" },
    bc: { from: "DP", to: "Blocking" },
  },
};
const failedAnnotations = {
  nodeDetails: { a: "Root cost 0", b: "Root cost 4", c: "Root cost 4" },
  portRoles: {
    ab: { from: "DP", to: "RP" },
    ac: { from: "DOWN", to: "DOWN" },
    bc: { from: "DP", to: "Blocking" },
  },
};
const recoveredAnnotations = {
  nodeDetails: { a: "Root cost 0", b: "Root cost 4", c: "Root cost 8" },
  portRoles: {
    ab: { from: "DP", to: "RP" },
    ac: { from: "DOWN", to: "DOWN" },
    bc: { from: "DP", to: "RP" },
  },
};
const newRoles = {
  a: "ROOT / DP",
  b: "A側 RP · C側 DP",
  c: "A側 DOWN · B側 RP",
};

function local(
  id: string,
  phase: string,
  node: string,
  title: string,
  description: string,
  fields: string[],
  linkStates: StepContent["linkStates"],
  states?: StepContent["states"],
  topologyAnnotations?: StepContent["topologyAnnotations"],
): Step {
  return {
    id,
    kind: "local",
    node,
    phase,
    title,
    description,
    wire: fields[0],
    fields,
    linkStates,
    states,
    topologyAnnotations,
    source,
    protection:
      "STPはレイヤー2のループを防ぎます。通信の暗号化や、BPDU送信者の認証は行いません。",
    effect: {
      kind: "stages",
      label: "スイッチ内の処理（時間は短縮）",
      stages: [{ text: fields[0], status: title }],
    },
  };
}
function bpdu(
  id: string,
  from: string,
  to: string,
  root: string,
  cost: number,
  description: string,
  linkStates: StepContent["linkStates"],
  states?: StepContent["states"],
  topologyAnnotations?: StepContent["topologyAnnotations"],
): Step {
  return {
    id,
    kind: "message",
    from,
    to,
    phase:
      id === "backup-bpdu"
        ? "障害と再収束"
        : id === "blocked-bpdu"
          ? "ポートと転送"
          : "BPDUと選出",
    title: `${from.toUpperCase()} → ${to.toUpperCase()}：ルート情報を送る`,
    wire: `Configuration BPDU: Root=${root.toUpperCase()}, Root Path Cost=${cost}, Bridge=${from.toUpperCase()}`,
    displayWire: `BPDU · Root ${root.toUpperCase()} · Cost ${cost}`,
    description,
    fields: [
      "Protocol ID=0 / Version=0 / Type=0（従来のSTP）",
      `Root ID=${root.toUpperCase()} / Root Path Cost=${cost}`,
      `送信 Bridge ID=${from.toUpperCase()}（IDの大小は A < B < C）`,
      "宛先MAC=01:80:C2:00:00:00 / LLC DSAP・SSAP=0x42",
      "Hello Time=2秒 / Max Age=20秒 / Forward Delay=15秒（既定値）",
    ],
    protection:
      "BPDUは、隣接するスイッチと交換する制御フレームです。IPやTCPは使いません。通常のデータフレームのように、ほかのリンクへは中継しません。",
    source,
    linkStates,
    states,
    topologyAnnotations,
  };
}

export const convergence: Scenario = {
  id: "convergence",
  title: "STP：ループ防止",
  badge: "STP / 802.1D",
  sceneLabel: "3 switches · 各リンクのコスト 4",
  nodes: [
    {
      id: "a",
      label: "SW A",
      caption: "BID 最小",
      image: "./pixels/server.svg",
    },
    { id: "b", label: "SW B", caption: "BID 中", image: "./pixels/server.svg" },
    {
      id: "c",
      label: "SW C",
      caption: "BID 最大",
      image: "./pixels/server.svg",
    },
  ],
  topology: {
    kind: "triangle",
    nodeDetails: {
      a: "BID 32768…0A",
      b: "BID 32768…0B",
      c: "BID 32768…0C",
    },
    links: [
      { id: "ab", from: "a", to: "b", label: "A–B" },
      { id: "ac", from: "a", to: "c", label: "A–C" },
      { id: "bc", from: "b", to: "c", label: "B–C（遮断時はC側ポート）" },
    ],
  },
  prerequisites: [],
  notes: [
    "この教材では、従来のIEEE 802.1D STPを3台のスイッチで示します。RSTP、MSTP、PVST+、PortFastは扱いません。",
    "BID（Bridge ID）は、優先度32768とMACアドレス末尾0A・0B・0Cを短く表示します。大小関係はA < B < Cです。各リンクのポートコストは4です。RPはルートポート、DPは指定ポートを表します。",
    "代表的なBPDUだけを順番に表示します。実機では、各リンクがBPDUを並行して定期的に送ります。線とノードは、各場面の処理後の状態です。遮断した線でも、両端のポートがBlockingとは限りません。",
    "画面では、タイマーの待ち時間を短縮します。A–Cリンクの物理的な切断を、すぐに検出できる例です。BPDUが届かないことで障害を検出する場合は、Max Ageなどの待ち時間も必要です。",
    "障害後のTCN、確認応答、TCフラグによるMAC学習情報の短期エージングは省略します。リンクの復旧と、同じ値を比較するときの全分岐も扱いません。",
  ],
  steps: [
    local(
      "redundant-links",
      "構成",
      "a",
      "三角形の配線とループ",
      "3本のリンクすべてでデータを転送すると、フレームが循環します。STPは予備のリンクを残しつつ、転送経路をループのない木構造にします。",
      [
        "A–B / A–C / B–C：各コスト4",
        "初期状態ではデータ転送を止めて選出を開始",
      ],
      pending,
    ),
    local(
      "self-root",
      "BPDUと選出",
      "c",
      "最初は自分がルート候補",
      "起動直後は、各スイッチが自分をルートと考えます。BPDUでRoot IDなどを比較し、優先度の高い情報へ更新します。",
      [
        "初期 Root ID = 自分のBridge ID",
        "Bridge IDは小さい方が優先：A < B < C",
      ],
      pending,
      { a: "Root候補 A", b: "Root候補 B", c: "Root候補 C" },
    ),
    bpdu(
      "b-advertises",
      "b",
      "c",
      "b",
      0,
      "Cは、自分より小さいBのRoot IDを受け入れます。Cのルート候補はBになります。受信ポートのコスト4を足すため、ルートまでの経路コストは4です。",
      pending,
      { a: "Root候補 A", b: "Root候補 B", c: "Root候補 B / cost 4" },
    ),
    bpdu(
      "a-to-b",
      "a",
      "b",
      "a",
      0,
      "Bは、より小さいAのRoot IDを受け入れます。Bのルート候補はAになります。Aへの直接リンクを使うため、経路コストは0 + 4 = 4です。",
      pending,
      { a: "Root候補 A", b: "Root A / cost 4", c: "Root候補 B / cost 4" },
    ),
    bpdu(
      "a-to-c",
      "a",
      "c",
      "a",
      0,
      "Cも、Root IDが最小のAを選びます。Aへの直接経路のコストは4です。これで、すべてのスイッチがAをルートと認識します。",
      pending,
      { a: "ROOT", b: "Root A / cost 4", c: "Root A / cost 4" },
    ),
    bpdu(
      "b-to-c",
      "b",
      "c",
      "a",
      4,
      "Bは、Aまでの経路コスト4を通知します。CがBを経由すると、Aまでのコストは4 + 4 = 8です。Aへの直接経路のコスト4より大きくなります。",
      pending,
      { a: "ROOT", b: "Root A / cost 4", c: "直結 4 < B経由 8" },
    ),
    local(
      "port-roles",
      "ポートと転送",
      "c",
      "CのB側ポートを遮断",
      "CのB側ポートは非指定ポートとなり、Blockingに残ります。BとCは、どちらもルートまでのコストが4です。そのためB–C間では、Bridge IDが小さいB側が指定ポートになります。",
      [
        "A：両側DP / B：A側RP・C側DP",
        "C：A側RP・B側非指定（Blocking）",
        "ルートポートは最小コストで選択。同値なら送信Bridge ID、送信Port ID、受信Port IDの順に比較",
        "Blocking：データ転送もMAC学習もしない。BPDUは受信する",
      ],
      selected,
      roles,
      selectedAnnotations,
    ),
    local(
      "listening",
      "ポートと転送",
      "b",
      "Listening：まだ転送しない",
      "転送に使うポートは、まずListeningで待ちます。BPDUは処理しますが、データ転送とMACアドレス学習はまだ行いません。",
      ["Listening：Forward Delay 15秒", "CのB側ポートはBlockingを維持"],
      selected,
      roles,
      selectedAnnotations,
    ),
    local(
      "learning",
      "ポートと転送",
      "b",
      "Learning：MACを学習",
      "次のLearningでは、送信元MACアドレスの学習を始めます。データはまだ転送しません。もう一度、Forward Delayの時間だけ待ちます。",
      ["Learning：Forward Delay 15秒", "MAC学習あり / データ転送なし"],
      selected,
      roles,
      selectedAnnotations,
    ),
    local(
      "forwarding",
      "ポートと転送",
      "a",
      "Forwarding：木構造が完成",
      "A–BとA–Cで、データ転送を始めます。B–C間ではC側がBlockingです。そのため、BからCへのデータはAを経由し、循環しません。",
      [
        "A–B・A–C：転送可能",
        "B–C：C側Blocking / B側DPはForwarding",
        "ルートAの情報は通常2秒ごとにBPDUで通知される",
      ],
      stable,
      roles,
      selectedAnnotations,
    ),
    bpdu(
      "blocked-bpdu",
      "b",
      "c",
      "a",
      4,
      "BlockingのC側ポートも、BPDUは受信し続けます。データを転送しない間も制御情報を確認し、ネットワーク構成の変化に備えます。",
      stable,
      roles,
      selectedAnnotations,
    ),
    local(
      "link-failure",
      "障害と再収束",
      "c",
      "A–Cリンクが断線",
      "Cは、Aへの直接リンクが物理的に切れたことを検出します。ルートポートを失ったため、経路を計算し直します。B側ポートは、まだデータを転送しません。",
      ["A–C：物理リンクDOWN", "CのB側ポートにはBからのルート情報がある"],
      failed,
      { ...roles, c: "A側 DOWN · 再計算" },
      failedAnnotations,
    ),
    bpdu(
      "backup-bpdu",
      "b",
      "c",
      "a",
      4,
      "Cは、Bから受け取ったBPDUを使い、Aへの迂回経路を選びます。CからAまでの経路コストは8です。B側ポートが新しいルートポートになります。",
      recovering,
      newRoles,
      recoveredAnnotations,
    ),
    local(
      "re-listening",
      "障害と再収束",
      "c",
      "新ルートポートでListening",
      "新しいルートポートも、まずListeningへ移ります。従来のSTPでは、ポートの役割が変わっても、すぐにはデータを転送しません。",
      ["CのB側：Blocking → Listening", "Forward Delay 15秒（教材では短縮）"],
      recovering,
      newRoles,
      recoveredAnnotations,
    ),
    local(
      "re-learning",
      "障害と再収束",
      "c",
      "Learningを経て切り替える",
      "CのB側ポートは、LearningでMACアドレスを学習します。この15秒間も、データは転送しません。",
      ["CのB側：Listening → Learning", "Forward Delay 15秒（教材では短縮）"],
      recovering,
      newRoles,
      recoveredAnnotations,
    ),
    local(
      "recovered",
      "障害と再収束",
      "c",
      "A–B–Cで通信を再開",
      "Cの新しいルートポートがForwardingになり、Bを経由する経路を使えます。予備のリンクによって通信を再開します。転送経路は、引き続きループのない木構造です。",
      [
        "CのB側：Learning → Forwarding",
        "有効な経路：A–B–C / Root=A / Cのcost=8",
        "既定タイマーではListeningとLearningで合計約30秒。検出条件によってさらに待つ",
      ],
      recovered,
      newRoles,
      recoveredAnnotations,
    ),
  ],
};
