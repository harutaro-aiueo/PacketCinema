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
    source,
    protection:
      "STPはレイヤー2のループを防ぐ制御です。通信を暗号化したり、BPDUの送信者を認証したりするものではありません。",
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
    title: `${from.toUpperCase()} → ${to.toUpperCase()}：ルート情報を通知`,
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
      "BPDUは隣接スイッチとの制御フレームです。IP・TCPは使わず、通常のデータフレームとして他のリンクへ中継しません。",
    source,
    linkStates,
    states,
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
    links: [
      { id: "ab", from: "a", to: "b", label: "A–B" },
      { id: "ac", from: "a", to: "c", label: "A–C" },
      { id: "bc", from: "b", to: "c", label: "B–C（遮断時はC側ポート）" },
    ],
  },
  prerequisites: [],
  notes: [
    "従来のIEEE 802.1D STPを、単一のツリーと3台のスイッチで示す教材です。RSTP・MSTP・PVST+・PortFastの動作は扱いません。",
    "Bridge IDは優先度とMACアドレス等からなり、この例では A < B < C とします。全リンクの受信ポートコストは4に固定します。RP=ルートポート、DP=指定ポートです。",
    "BPDU交換は代表的なものを順番に表示します。実機では各リンクで並行・周期的に行われます。線とノードの状態は各場面の処理後の要約で、遮断線は両端ともBlockingという意味ではありません。",
    "タイマー待ちを短縮しています。障害はA–Cの物理リンク断を直ちに検出できる例です。BPDUの途絶だけで検出する場合はMax Age等の待ち時間が加わります。",
    "障害後のTCN・確認応答・TCフラグによるMAC学習情報の短期エージング、リンク復旧、タイブレークの全分岐は省略しています。",
  ],
  steps: [
    local(
      "redundant-links",
      "構成",
      "a",
      "三角形の配線とループ",
      "3本すべてでデータを転送すると、フレームが循環する経路ができます。STPは冗長な配線を残したまま、転送に使う経路を木構造にします。",
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
      "起動直後は各スイッチが自分をルートと考えます。BPDUでRoot IDなどを比較し、より優れた情報へ更新します。",
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
      "Cは自分より小さいBのRoot IDを受け入れます。この時点のCのルート候補はBで、受信ポートのコスト4を足して経路コストを4とします。",
      pending,
      { a: "Root候補 A", b: "Root候補 B", c: "Root候補 B / cost 4" },
    ),
    bpdu(
      "a-to-b",
      "a",
      "b",
      "a",
      0,
      "BはAのRoot IDが小さいので、ルート候補をAに更新します。Aへの直接リンクを使う経路コストは0 + 4 = 4です。",
      pending,
      { a: "Root候補 A", b: "Root A / cost 4", c: "Root候補 B / cost 4" },
    ),
    bpdu(
      "a-to-c",
      "a",
      "c",
      "a",
      0,
      "Cも最小のRoot IDを持つAを選びます。Aへの直接経路はコスト4で、これで全スイッチのルート認識がAになります。",
      pending,
      { a: "ROOT", b: "Root A / cost 4", c: "Root A / cost 4" },
    ),
    bpdu(
      "b-to-c",
      "b",
      "c",
      "a",
      4,
      "Bは自分のAへのコスト4を通知します。CがB経由でAへ向かう場合は4 + 4 = 8となり、直接経路の4より不利です。",
      pending,
      { a: "ROOT", b: "Root A / cost 4", c: "直結 4 < B経由 8" },
    ),
    local(
      "port-roles",
      "ポートと転送",
      "c",
      "CのB側ポートを遮断",
      "CのB側ポートが非指定となり、Blockingに残ります。BとCのルート経路コストは同じ4なので、B–C区間の指定ポートはBridge IDが小さいB側です。",
      [
        "A：両側DP / B：A側RP・C側DP",
        "C：A側RP・B側非指定（Blocking）",
        "ルートポートは最小コストで選択。同値なら送信Bridge ID、送信Port ID、受信Port IDの順に比較",
        "Blocking：データ転送もMAC学習もしない。BPDUは受信する",
      ],
      selected,
      roles,
    ),
    local(
      "listening",
      "ポートと転送",
      "b",
      "Listening：まだ転送しない",
      "転送に使うルートポートと指定ポートはListeningで待機します。BPDUを処理しながら、データ転送とMACアドレス学習はまだ行いません。",
      ["Listening：Forward Delay 15秒", "CのB側ポートはBlockingを維持"],
      selected,
      roles,
    ),
    local(
      "learning",
      "ポートと転送",
      "b",
      "Learning：MACを学習",
      "次のLearningでは送信元MACアドレスの学習を開始します。データ転送は引き続き止め、もう一度Forward Delayを待ちます。",
      ["Learning：Forward Delay 15秒", "MAC学習あり / データ転送なし"],
      selected,
      roles,
    ),
    local(
      "forwarding",
      "ポートと転送",
      "a",
      "Forwarding：木構造が完成",
      "A–BとA–Cでデータ転送を開始します。B–CはC側がBlockingなので、BからCへのデータはA経由で届き、循環しません。",
      [
        "A–B・A–C：転送可能",
        "B–C：C側Blocking / B側DPはForwarding",
        "ルートAの情報は通常2秒ごとにBPDUで通知される",
      ],
      stable,
      roles,
    ),
    bpdu(
      "blocked-bpdu",
      "b",
      "c",
      "a",
      4,
      "BlockingのC側ポートもBPDUを受信し続けます。データを遮断していても制御情報を監視し、トポロジーの変化に備えます。",
      stable,
      roles,
    ),
    local(
      "link-failure",
      "障害と再収束",
      "c",
      "A–Cリンクが断線",
      "CはAへの直接リンクの物理断を検出します。ルートポートを失ったため経路を再計算しますが、B側ポートはまだデータを転送しません。",
      ["A–C：物理リンクDOWN", "CのB側ポートにはBからのルート情報がある"],
      failed,
      { ...roles, c: "A側 DOWN · 再計算" },
    ),
    bpdu(
      "backup-bpdu",
      "b",
      "c",
      "a",
      4,
      "CはBからのBPDUに基づいてAへの迂回経路を選びます。Cの経路コストは8となり、B側ポートが新しいルートポートになります。",
      recovering,
      newRoles,
    ),
    local(
      "re-listening",
      "障害と再収束",
      "c",
      "新ルートポートでListening",
      "新しいルートポートもListeningを経由します。従来のSTPでは、役割が変わっても即座にはデータ転送を始めません。",
      ["CのB側：Blocking → Listening", "Forward Delay 15秒（教材では短縮）"],
      recovering,
      newRoles,
    ),
    local(
      "re-learning",
      "障害と再収束",
      "c",
      "Learningを経て切り替える",
      "CのB側ポートはLearningでMACアドレスを学習します。この15秒間もデータは転送しません。",
      ["CのB側：Listening → Learning", "Forward Delay 15秒（教材では短縮）"],
      recovering,
      newRoles,
    ),
    local(
      "recovered",
      "障害と再収束",
      "c",
      "A–B–Cで通信を再開",
      "Cの新ルートポートがForwardingになり、B経由の経路が使えます。冗長リンクによって接続を回復し、転送経路は引き続きループのない木構造です。",
      [
        "CのB側：Learning → Forwarding",
        "有効な経路：A–B–C / Root=A / Cのcost=8",
        "既定タイマーではListeningとLearningで合計約30秒。検出条件によってさらに待つ",
      ],
      recovered,
      newRoles,
    ),
  ],
};
