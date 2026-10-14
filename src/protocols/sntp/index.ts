import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const clientSource = "https://www.rfc-editor.org/rfc/rfc5905.html#section-8";
const serverSource = "https://www.rfc-editor.org/rfc/rfc5905.html#section-14";

const scenario: Scenario = {
  id: "unicast-clock",
  title: "SNTP：時刻同期",
  badge: "SNTPv4",
  sceneLabel: "クライアント ↔ 時刻サーバー",
  nodes: [
    { id: "client", label: "クライアント", caption: "時刻を合わせたい端末", image: "./pixels/client.svg" },
    { id: "server", label: "時刻サーバー", caption: "同期済み", image: "./pixels/server.svg" },
  ],
  prerequisites: [],
  notes: [
    "RFC 5905 §14のSNTPv4で、同期済みのサーバーとユニキャストで1回だけやり取りする例です。時刻値は計算を説明するための架空の値で、T1・T4はクライアント、T2・T3はサーバーの時計で記録します。",
    "往路と復路の遅延が同じという例を置き、時刻のずれを推定します。実際のネットワークでは遅延が非対称なことがあり、この計算だけで正確な時刻を保証できません。時計の補正方法も扱いません。",
    "UDPで到達できることを前提とし、サーバー探索、複数回の測定、再送、認証、異常な応答の処理を省略します。アニメーションの長さは実際の往復時間を示しません。",
  ],
  steps: [
    {
      kind: "local", node: "client", id: "prepare", phase: "準備",
      title: "送信時刻T1を記録する",
      wire: "T1 = 12:00:00.000（クライアント時計）",
      description: "クライアントは要求を送る時刻をTransmit Timestampに入れます。この例のT1はクライアント自身の時計で記録した値です。",
      fields: ["Version：4", "Mode：3（client）", "Transmit Timestamp T1：12:00:00.000"],
      protection: "端末内の準備", source: clientSource,
      effect: { kind: "stages", label: "要求の準備", stages: [{ text: "T1 = 12:00:00.000", status: "送信時刻を記録" }] },
    },
    {
      kind: "message", from: "client", to: "server", id: "request", phase: "要求",
      title: "時刻を問い合わせる",
      wire: "SNTPv4 Request · Mode=3 · Transmit=T1",
      displayWire: "SNTP時刻要求",
      description: "クライアントはMode 3の要求を指定したサーバーへ送ります。Transmit TimestampのT1は、返答をこの要求と対応付けるためにも使います。",
      fields: ["Version：4", "Mode：3（client）", "Transmit Timestamp T1：12:00:00.000"],
      protection: "この例では認証を扱いません。", source: clientSource,
    },
    {
      kind: "local", node: "server", id: "receive", phase: "サーバー",
      title: "受信時刻T2と返信時刻T3を記録する",
      wire: "T2 = 12:00:00.150 / T3 = 12:00:00.170（サーバー時計）",
      description: "同期済みのサーバーは要求を受けた時刻T2と応答を送る時刻T3を記録し、受け取ったT1をOriginate Timestampへそのまま写します。",
      fields: ["Originate Timestamp：T1をコピー", "Receive Timestamp T2：12:00:00.150", "Transmit Timestamp T3：12:00:00.170"],
      protection: "サーバー内の処理", source: serverSource,
      effect: { kind: "stages", label: "応答の準備", stages: [{ text: "T1をコピー / T2とT3を記録", status: "返信を作成" }] },
    },
    {
      kind: "message", from: "server", to: "client", id: "reply", phase: "応答",
      title: "3つの時刻値を返す",
      wire: "SNTPv4 Reply · Mode=4 · Originate=T1 · Receive=T2 · Transmit=T3",
      displayWire: "SNTP時刻応答",
      description: "サーバーはMode 4で応答し、T1・T2・T3を返します。クライアントはOriginate Timestampが送ったT1と一致するか確認します。",
      fields: ["Version：4", "Mode：4（server）", "Originate Timestamp T1：12:00:00.000", "Receive Timestamp T2：12:00:00.150", "Transmit Timestamp T3：12:00:00.170"],
      protection: "この例では認証を扱いません。", source: clientSource,
    },
    {
      kind: "local", node: "client", id: "estimate", phase: "計算",
      title: "受信時刻T4からずれを推定する",
      wire: "T4 = 12:00:00.120 / 往復遅延 = 100ms / ずれ = +100ms",
      description: "クライアントは応答を受けた時刻T4を自分の時計で記録します。往復遅延は (T4−T1)−(T3−T2) = 100ms、サーバーとの時計のずれは ((T2−T1)+(T3−T4))/2 = +100msと推定できます。この例ではクライアント時計が100ms遅れています。",
      fields: ["Destination Timestamp T4：12:00:00.120", "往復遅延：(120−0)−(170−150) = 100ms", "時計のずれ：((150−0)+(170−120))/2 = +100ms"],
      protection: "端末内の計算", source: clientSource,
      effect: { kind: "result", label: "時刻差の推定", prompt: "ずれ：", text: "+100ms（クライアントが遅い）", pending: "計算中", complete: "推定完了" },
    },
  ],
};

export const sntp: ProtocolDefinition = {
  id: "sntp", title: "SNTP",
  description: "4つの時刻値でサーバーとの時計のずれを推定する",
  keywords: ["NTP", "時刻同期", "時計", "往復遅延"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
