import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const base = "https://www.rfc-editor.org/rfc/rfc854.html";
const echo = "https://www.rfc-editor.org/rfc/rfc857.html";

const scenario: Scenario = {
  id: "remote-echo",
  title: "Telnetエコー",
  badge: "TELNET",
  sceneLabel: "端末 ↔ 遠隔ホスト",
  nodes: [
    { id: "client", label: "端末", caption: "文字を入力", image: "./pixels/client.svg" },
    { id: "server", label: "遠隔ホスト", caption: "入力を返す", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "tcp", label: "TCP接続" }],
  notes: [
    "RFC 854・857に基づき、TCP接続後に遠隔ホストがECHOオプションを提案し、端末が受け入れる一例です。両者がこのオプションに対応している前提です。",
    "入力の1行とそのエコーを論理メッセージにまとめています。TCP接続手順、文字単位の送信、Go Aheadとその抑制、他のオプション、切断は省略します。表示時間は実測時間ではありません。",
    "この例のTelnetデータは暗号化されません。秘密の認証情報を送る例ではありません。ECHOを拒否した場合は扱いません。",
  ],
  steps: [
    {
      kind: "message", from: "server", to: "client", id: "will-echo", phase: "交渉",
      title: "遠隔ホストがエコーを提案",
      wire: "IAC WILL ECHO", description: "遠隔ホストは、受け取る文字を端末へ送り返すECHOオプションを提案します。まだ端末の同意は得ていません。",
      fields: ["IAC：コマンド開始", "WILL：送信側が実行を提案", "ECHO：オプション番号1"],
      protection: "暗号化なし", source: echo + "#section-2",
    },
    {
      kind: "message", from: "client", to: "server", id: "do-echo", phase: "交渉",
      title: "端末が提案を受け入れる",
      wire: "IAC DO ECHO", description: "端末はDO ECHOで同意します。これ以降、遠隔ホストからのエコーを受け取る例として進みます。",
      fields: ["DO：相手側の実行に同意", "ECHO：オプション番号1", "状態：遠隔エコーを使用"],
      protection: "暗号化なし", source: echo + "#section-2",
    },
    {
      kind: "message", from: "client", to: "server", id: "input", phase: "入力",
      title: "端末から文字を送る",
      wire: "help<CR><LF>", displayWire: "help を入力", description: "端末は例示の文字列と改行を送ります。ここでは一行にまとめ、アプリケーション側での解釈は扱いません。",
      fields: ["文字：help（教材用）", "改行：CR LF", "方向：端末から遠隔ホスト"],
      protection: "暗号化なし", source: base + "#page-11",
    },
    {
      kind: "message", from: "server", to: "client", id: "echo", phase: "エコー",
      title: "入力した文字が返る",
      wire: "help<CR><LF>", displayWire: "入力をエコー", description: "遠隔ホストはECHOオプションに従い、受け取った入力文字を端末へ返します。この例では同じ文字列を返します。",
      fields: ["対象：受信した入力文字", "方向：遠隔ホストから端末", "状態：遠隔エコーを使用"],
      protection: "暗号化なし", source: echo + "#section-5",
    },
  ],
};

export const telnet: ProtocolDefinition = {
  id: "telnet", title: "Telnet", description: "遠隔ホストとエコーを交渉し、入力文字を送り返す",
  keywords: ["遠隔端末", "リモート", "ECHO", "NVT"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
