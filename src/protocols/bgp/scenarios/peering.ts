import type { Scenario, Step, StepContent } from "../../../domain/lesson";
import { createConnection } from "../../tcp";

const rfc = (section: string) =>
  `https://www.rfc-editor.org/rfc/rfc4271#section-${section}`;
const policySource = "https://www.rfc-editor.org/rfc/rfc8212#section-3";
const bgpProtection =
  "BGP-4自体は通信を暗号化しません。TCP接続の保護は、この教材では扱いません。";

function message(
  id: string,
  phase: string,
  title: string,
  wire: string,
  from: "r1" | "r2",
  to: "r1" | "r2",
  description: string,
  fields: string[],
  source: string,
  states: Record<"r1" | "r2", string>,
  networkAction?: StepContent["networkAction"],
): Step {
  return {
    kind: "message",
    id,
    phase,
    title,
    wire,
    from,
    to,
    description,
    fields,
    protection: bgpProtection,
    source,
    states,
    networkAction,
  };
}

function local(
  id: string,
  phase: string,
  title: string,
  node: "r1" | "r2",
  description: string,
  fields: string[],
  source: string,
  states: Record<"r1" | "r2", string>,
): Step {
  return {
    kind: "local",
    id,
    phase,
    title,
    node,
    wire: fields[0],
    description,
    fields,
    protection: "ルーター内の処理です。ここでは通信を送りません。",
    source,
    states,
    effect: {
      kind: "stages",
      label: "ルーター内の処理",
      stages: fields.map((text) => ({ text, status: title })),
    },
  };
}

const tcpSteps = createConnection({
  nodes: { client: "r1", server: "r2" },
  phase: "TCP接続",
  idPrefix: "tcp-",
}).map((step) => ({
  ...step,
  fields:
    step.id === "tcp-syn" ? [...step.fields, "宛先TCPポート=179"] : step.fields,
  states: Object.fromEntries(
    Object.entries(step.states ?? {}).map(([node, state]) => [
      node,
      `TCP ${state}`,
    ]),
  ),
}));

const r1Direct = {
  destination: "203.0.113.0/24",
  learnedVia: "直結",
  nextHop: "-",
} as const;
const r2Direct = {
  destination: "198.51.100.0/24",
  learnedVia: "直結",
  nextHop: "-",
} as const;
const routeAtR1 = {
  destination: "198.51.100.0/24",
  learnedVia: "BGP",
  nextHop: "R2",
} as const;
const routeAtR2 = {
  destination: "203.0.113.0/24",
  learnedVia: "BGP",
  nextHop: "R1",
} as const;
const r1Both = [r1Direct, routeAtR1];
const r2Both = [r2Direct, routeAtR2];

export const peering: Scenario = {
  id: "peering",
  title: "BGP：経路交換",
  badge: "BGP-4 · eBGP",
  sceneLabel: "R1 (AS 65001) ↔ R2 (AS 65002)",
  nodes: [
    {
      id: "r1",
      label: "R1",
      caption: "AS 65001",
      image: "./pixels/server.svg",
    },
    {
      id: "r2",
      label: "R2",
      caption: "AS 65002",
      image: "./pixels/server.svg",
    },
  ],
  networks: [
    { id: "r1-lan", node: "r1", label: "R1側LAN", prefix: "203.0.113.0/24" },
    { id: "r2-lan", node: "r2", label: "R2側LAN", prefix: "198.51.100.0/24" },
  ],
  routingTables: [
    {
      node: "r1",
      title: "R1の経路表",
      initialStatus: "交換前",
      emptyText: "経路なし",
      initialEntries: [r1Direct],
    },
    {
      node: "r2",
      title: "R2の経路表",
      initialStatus: "交換前",
      emptyText: "経路なし",
      initialEntries: [r2Direct],
    },
  ],
  prerequisites: [{ protocol: "tcp", label: "TCP接続の確立" }],
  notes: [
    "R1とR2は直接つながるルーターです。ASはネットワークの管理単位です。R1はAS 65001、R2はAS 65002に属します。異なるAS間のBGPをeBGPと呼びます。この教材ではIPv4ユニキャスト（1つの宛先に送る通信）の経路を扱います。AS番号は私用番号、IPアドレスは説明用の番号です。",
    "両側には、相手のIPアドレスとAS番号を設定済みです。R1とR2は、自分につながるLANの経路を相手へ送ることを許可しています。両側とも、相手から届いた経路を受け取る設定です。",
    "経路表の「直結」は自分につながるLAN、「BGP」は相手から受け取って選んだ経路です。表の次ホップは見やすいようにR1・R2で示します。R1が送るUPDATEのNEXT_HOPは192.0.2.1、R2が送るものは192.0.2.2です。両側とも相手へ到達でき、同じ宛先へのほかの候補経路はありません。実際の転送表に入るかどうかは、別に決まります。",
    "TCPのシーケンス番号は教材用の例です。OPENとKEEPALIVEは両側で並行して送られることがあります。この図では1通ずつ順に示します。アニメーションは、実際のパケット分割や待ち時間を表しません。経路表を定期的に送り直す必要はありません。",
    "経路属性の詳しい選択、iBGP、追加の能力交渉は省略します。接続の衝突、エラー時のNOTIFICATION、TCP接続の終了も扱いません。最後はR1側LANとR1の間だけが切れます。R1とR2の間はつながっているため、BGP接続を保ったまま203.0.113.0/24を取り消せます。R1とR2の間も切れた場合、この接続で撤回のUPDATEは送れません。",
  ],
  steps: [
    local(
      "configure-policy",
      "準備",
      "経路を送受信する条件を決める",
      "r1",
      "R1は自分のLANの経路をR2へ送り、R2は自分のLANの経路をR1へ送る設定です。両側とも相手の経路を受け取れます。eBGPでは、ポリシーを設定しないと経路の送受信を拒否する動作が標準です。",
      ["R1とR2：自分のLANの経路を送信", "R1とR2：相手の経路を受信"],
      policySource,
      { r1: "接続待ち", r2: "接続待ち" },
    ),
    ...tcpSteps,
    message(
      "open-r1",
      "BGP接続",
      "R1がBGPの条件を送る",
      "OPEN",
      "r1",
      "r2",
      "R1はTCP接続の後にOPENを送ります。OPENには、BGPのバージョンや自分のAS番号が入っています。R2はその内容を確認します。",
      ["Version=4 / My AS=65001", "Hold Time=90秒 / BGP Identifier=192.0.2.1"],
      rfc("4.2"),
      { r1: "OpenSent", r2: "OpenConfirm" },
    ),
    message(
      "open-r2",
      "BGP接続",
      "R2もBGPの条件を送る",
      "OPEN",
      "r2",
      "r1",
      "R2もOPENを送ります。R1とR2は相手のOPENを受け入れると、KEEPALIVEを送り合います。両側が提案したHold Time（相手からのBGPメッセージを待つ時間）は90秒です。そのため、使う値も90秒です。",
      ["Version=4 / My AS=65002", "Hold Time=90秒 / BGP Identifier=192.0.2.2"],
      rfc("4.2"),
      { r1: "OpenConfirm", r2: "OpenConfirm" },
    ),
    message(
      "confirm-r1",
      "BGP接続",
      "R1がR2のOPENを確認する",
      "KEEPALIVE",
      "r1",
      "r2",
      "R1はR2のOPENを受け入れ、KEEPALIVEを送ります。R2は受け取ると、経路を交換できる状態（Established）に進みます。",
      ["BGP共通ヘッダーのみ（19オクテット）", "R2：OpenConfirm → Established"],
      rfc("8.2.2"),
      { r1: "OpenConfirm", r2: "Established" },
    ),
    message(
      "confirm-r2",
      "BGP接続",
      "R2もR1のOPENを確認する",
      "KEEPALIVE",
      "r2",
      "r1",
      "R2もKEEPALIVEを送ります。R1が受け取ると、両側が経路を交換できる状態（Established）になります。",
      ["BGP共通ヘッダーのみ（19オクテット）", "R1：OpenConfirm → Established"],
      rfc("8.2.2"),
      { r1: "Established", r2: "Established" },
    ),
    local(
      "select-export",
      "経路の広告",
      "R1がR2に知らせる経路を選ぶ",
      "r1",
      "R1は、自分につながるLANの経路をR2に知らせる準備をします。203.0.113.0/24は送信ポリシーで許可されています。BGPでは、経路を相手に知らせることを「広告」と呼びます。",
      ["広告対象：203.0.113.0/24", "送信ポリシー：許可"],
      policySource,
      { r1: "広告準備", r2: "Established" },
    ),
    {
      ...message(
        "advertise",
        "経路の広告",
        "R1がLANへの経路を知らせる",
        "UPDATE · 203.0.113.0/24",
        "r1",
        "r2",
        "R1は、203.0.113.0/24へ行けるとR2に知らせます。UPDATEには、経由するAS番号の列（AS_PATH）と、次にパケットを送る先（NEXT_HOP）も入れます。",
        [
          "NLRI=203.0.113.0/24",
          "ORIGIN=IGP / AS_PATH=65001",
          "NEXT_HOP=192.0.2.1",
        ],
        rfc("4.3"),
        { r1: "広告済み", r2: "経路を検査" },
        { networkId: "r1-lan", kind: "advertise" },
      ),
      routingTables: { r2: { status: "R1から受信中", entries: [r2Direct] } },
    },
    {
      ...local(
        "accept-route",
        "経路の広告",
        "R2が経路を受け入れる",
        "r2",
        "R2は、R1から届いた経路を受け入れるか確認します。UPDATEの内容、受信ポリシー、次ホップへの到達性を調べます。この例では経路を受け入れ、ほかに候補もないため選びます。転送表への反映は別の判断です。",
        [
          "受信ポリシー：許可",
          "次ホップ192.0.2.1：到達可能",
          "選択経路：203.0.113.0/24 → R1",
        ],
        rfc("9.1.2"),
        { r1: "広告済み", r2: "経路を選択" },
      ),
      routingTables: { r2: { status: "R1の経路を選択", entries: r2Both } },
    },
    {
      ...local(
        "select-export-r2",
        "経路の広告",
        "R2がR1に知らせる経路を選ぶ",
        "r2",
        "R2は、自分につながるLANの経路をR1へ知らせる準備をします。198.51.100.0/24は送信ポリシーで許可されています。",
        ["広告対象：198.51.100.0/24", "送信ポリシー：許可"],
        policySource,
        { r1: "経路を保持", r2: "広告準備" },
      ),
      routingTables: { r2: { status: "R1の経路を選択", entries: r2Both } },
    },
    {
      ...message(
        "advertise-r2",
        "経路の広告",
        "R2がLANへの経路を知らせる",
        "UPDATE · 198.51.100.0/24",
        "r2",
        "r1",
        "R2は、198.51.100.0/24へ行けるとR1に知らせます。UPDATEにはAS_PATHとNEXT_HOPも入れます。",
        [
          "NLRI=198.51.100.0/24",
          "ORIGIN=IGP / AS_PATH=65002",
          "NEXT_HOP=192.0.2.2",
        ],
        rfc("4.3"),
        { r1: "経路を検査", r2: "広告済み" },
        { networkId: "r2-lan", kind: "advertise" },
      ),
      routingTables: {
        r1: { status: "R2から受信中", entries: [r1Direct] },
        r2: { status: "R1の経路を選択", entries: r2Both },
      },
    },
    {
      ...local(
        "accept-route-r1",
        "経路の広告",
        "R1がR2の経路を受け入れる",
        "r1",
        "R1は、R2から届いた198.51.100.0/24の経路を調べます。受信ポリシーと次ホップへの到達性を確認し、この経路を選びます。",
        [
          "受信ポリシー：許可",
          "次ホップ192.0.2.2：到達可能",
          "選択経路：198.51.100.0/24 → R2",
        ],
        rfc("9.1.2"),
        { r1: "経路を選択", r2: "広告済み" },
      ),
      routingTables: {
        r1: { status: "R2の経路を選択", entries: r1Both },
        r2: { status: "R1の経路を選択", entries: r2Both },
      },
    },
    {
      ...message(
        "keepalive",
        "接続の維持",
        "KEEPALIVEで接続を確認する",
        "KEEPALIVE",
        "r2",
        "r1",
        "R2は、経路に変更がなくてもKEEPALIVEを送ります。相手からのメッセージを待つ時間（Hold Timer）が切れないようにするためです。経路表を定期的に送り直す必要はありません。",
        ["Hold Time=90秒", "KEEPALIVEは経路情報を含まない"],
        rfc("4.4"),
        { r1: "経路を保持", r2: "経路を選択" },
      ),
      routingTables: {
        r1: { status: "経路を保持中", entries: r1Both },
        r2: { status: "経路を保持中", entries: r2Both },
      },
    },
    {
      ...local(
        "origin-unavailable",
        "経路の撤回",
        "R1側LANとの接続が切れる",
        "r1",
        "R1側LANとR1の間が切れます。R1は203.0.113.0/24への直結経路を失います。R1とR2の間はつながったままです。R1はこの経路を広告対象から外します。",
        ["R1側LAN—R1：切断", "R1—R2：接続中"],
        rfc("9.2"),
        { r1: "撤回準備", r2: "経路を選択" },
      ),
      routingTables: {
        r1: { status: "直結経路が消失", entries: [routeAtR1] },
        r2: { status: "R1の経路を保持", entries: r2Both },
      },
      networkStates: { "r1-lan": "down" },
    },
    {
      ...message(
        "withdraw",
        "経路の撤回",
        "R1が経路の取り消しを伝える",
        "UPDATE · WITHDRAWN ROUTES",
        "r1",
        "r2",
        "R1とR2の間はつながっています。R1は、203.0.113.0/24の経路を取り消すとR2に伝えます。UPDATEの撤回対象を示す欄（WITHDRAWN ROUTES）に、このアドレス範囲を入れます。このUPDATEには新しい経路を含めません。",
        ["WITHDRAWN ROUTES=203.0.113.0/24", "Path Attributes=なし / NLRI=なし"],
        rfc("4.3"),
        { r1: "撤回済み", r2: "撤回を受信" },
        { networkId: "r1-lan", kind: "withdraw" },
      ),
      routingTables: {
        r1: { status: "直結経路が消失", entries: [routeAtR1] },
        r2: { status: "撤回を受信中", entries: r2Both },
      },
      networkStates: { "r1-lan": "down" },
    },
    {
      ...local(
        "remove-route",
        "経路の撤回",
        "R2がR1の経路を候補から除く",
        "r2",
        "R2は、R1から受け取った203.0.113.0/24の経路を候補から除きます。この宛先への代わりの経路はありません。R2側LANへの直結経路とBGP接続は残ります。",
        ["R1からの203.0.113.0/24：削除", "R2側LANの直結経路とBGP接続は継続"],
        rfc("3.1"),
        { r1: "Established", r2: "直結経路のみ" },
      ),
      routingTables: {
        r1: { status: "R2の経路を保持", entries: [routeAtR1] },
        r2: { status: "R1の経路を削除", entries: [r2Direct] },
      },
      networkStates: { "r1-lan": "down" },
    },
  ],
};
