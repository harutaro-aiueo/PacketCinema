import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const rfc791 = "https://www.rfc-editor.org/rfc/rfc791.html#page-24";
const rfc791Procedure = "https://www.rfc-editor.org/rfc/rfc791.html#page-25";

const scenario: Scenario = {
  id: "two-fragments",
  title: "IPv4：分割",
  badge: "IPv4",
  sceneLabel: "ルーター → 宛先ホスト",
  nodes: [
    { id: "router", label: "ルーター", caption: "送出リンク MTU 1500", image: "./pixels/server.svg" },
    { id: "target", label: "宛先ホスト", caption: "192.0.2.20", image: "./pixels/client.svg" },
  ],
  prerequisites: [],
  notes: [
    "ルーターが受け取ったIPv4データグラムを、MTU 1500バイトの次のリンクへ送る例です。元のデータは2000バイト、IPv4ヘッダーは20バイト、DF=0とします。192.0.2.0/24は文書用アドレスです。",
    "分割前の送信元からルーターまでの通信、経路選択、IPオプション、ヘッダー検査和の計算、損失や再構成タイムアウトは省きます。分割片は説明しやすい順で届く例で、到着順は保証されません。アニメーションの時間は実測値ではありません。",
    "各分割片は同じ送信元・宛先・プロトコル・識別子を持ちます。宛先ホストで元のデータに再構成します。ここでは上位プロトコルの動作を扱いません。",
  ],
  steps: [
    {
      kind: "local", node: "router", id: "split", phase: "分割",
      title: "MTUに合わせて2つに分ける",
      wire: "2020 bytes → 1500 + 540 bytes",
      description: "元の全長2020バイトは送出リンクのMTU 1500バイトを超えます。DF=0なので、ルーターは2000バイトのデータを1480バイトと520バイトに分け、それぞれに20バイトのIPv4ヘッダーを付けます。",
      fields: ["元のデータ：2000バイト", "IPv4ヘッダー：20バイト", "送出リンクMTU：1500バイト", "DF：0"],
      protection: "ルーター内の処理", source: rfc791Procedure,
      effect: { kind: "stages", label: "分割結果", stages: [{ text: "1480 + 520バイト", status: "2つのデータ部分" }] },
    },
    {
      kind: "message", from: "router", to: "target", id: "first", phase: "送信",
      title: "最初の分割片を送る",
      wire: "IPv4 fragment · ID=0x1234 · offset=0 · MF=1 · total=1500",
      displayWire: "分割片 1/2",
      description: "最初の分割片はデータの先頭1480バイトを運びます。オフセットは0、後続の分割片があるためMFは1です。全長には20バイトのヘッダーを含みます。",
      fields: ["識別子：0x1234", "データ：1480バイト", "Fragment Offset：0", "MF：1", "全長：1500バイト"],
      protection: "この例ではIPパケットの認証を扱いません。", source: rfc791,
    },
    {
      kind: "message", from: "router", to: "target", id: "last", phase: "送信",
      title: "最後の分割片を送る",
      wire: "IPv4 fragment · ID=0x1234 · offset=185 · MF=0 · total=540",
      displayWire: "分割片 2/2",
      description: "残り520バイトを運びます。開始位置1480バイトを8バイト単位で表すため、オフセットは185です。最後の分割片なのでMFは0です。",
      fields: ["識別子：0x1234", "データ：520バイト", "Fragment Offset：185（1480÷8）", "MF：0", "全長：540バイト"],
      protection: "この例ではIPパケットの認証を扱いません。", source: rfc791,
    },
    {
      kind: "local", node: "target", id: "reassemble", phase: "再構成",
      title: "宛先で元のデータに戻す",
      wire: "offset=0 + offset=185 → 2000 bytes",
      description: "宛先ホストは送信元・宛先・プロトコル・識別子を照合し、オフセットとMFから2片を配置します。この例では欠落がないので、2000バイトのデータを再構成できます。",
      fields: ["共通の識別子：0x1234", "データ位置：0〜1479、1480〜1999", "再構成したデータ：2000バイト"],
      protection: "宛先ホスト内の処理", source: rfc791,
      effect: { kind: "result", label: "再構成", prompt: "結果：", text: "2000バイトのデータ", pending: "分割片を照合中", complete: "再構成完了" },
    },
  ],
};

export const ipv4Fragmentation: ProtocolDefinition = {
  id: "ipv4-fragmentation", title: "IPv4の分割",
  description: "MTUに合わせた分割と、宛先での再構成を追う",
  keywords: ["IPフラグメント", "MTU", "断片化", "再構成"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
