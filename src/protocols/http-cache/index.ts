import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const semantics = "https://www.rfc-editor.org/rfc/rfc9110.html";
const caching = "https://www.rfc-editor.org/rfc/rfc9111.html";

const scenario: Scenario = {
  id: "etag-revalidation",
  title: "HTTP：再検証",
  badge: "ETag",
  sceneLabel: "ブラウザー ↔ Webサーバー",
  nodes: [
    { id: "browser", label: "ブラウザー", caption: "保存済み応答", image: "./pixels/client.svg" },
    { id: "server", label: "Webサーバー", caption: "元のデータ", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "tcp", label: "TCP接続" }],
  notes: [
    "同じブラウザーが公開画像 /logo.svg を2回取得する例です。サーバーは変わらない表現にETag \"v1\"を付け、保存を許可します。2回目は鮮度期間の終了後です。",
    "ブラウザー内の私用キャッシュを想定します。認証、共有キャッシュ、Vary、通信失敗、別の表現への変更は扱いません。TCP接続・TLS・HTTPのメッセージ構文の詳細と実時間は省略します。",
    "304には画像本体がありません。ブラウザーは対応する保存済み応答を更新して再利用します。この教材はキャッシュの状態を各場面に記し、途中URLからも意味が分かるようにしています。",
  ],
  steps: [
    {
      kind: "message", from: "browser", to: "server", id: "first-get", phase: "初回取得",
      title: "画像を要求する", wire: "GET /logo.svg HTTP/1.1", displayWire: "GET /logo.svg",
      description: "ブラウザーはまだ保存済みの応答を持たず、Webサーバーに画像を要求します。",
      fields: ["Method：GET", "対象：/logo.svg", "保存済み応答：なし"],
      protection: "この例では通信路の保護を扱いません。", source: semantics + "#section-9.3.1",
      states: { browser: "保存なし", server: "画像 v1" },
    },
    {
      kind: "message", from: "server", to: "browser", id: "first-200", phase: "初回取得",
      title: "画像とETagを返す", wire: 'HTTP/1.1 200 OK · ETag: "v1" · Cache-Control: max-age=60 · 画像本体',
      displayWire: "200 OK + 画像", description: "サーバーは画像本体とETagを返します。max-age=60は、この応答の鮮度期間を指定します。",
      fields: ["Status：200 OK", 'ETag："v1"', "Cache-Control：max-age=60", "Content：画像本体"],
      protection: "公開画像の例です。", source: caching + "#section-5.2.2.1",
      states: { browser: "受信中", server: "画像 v1" },
    },
    {
      kind: "local", node: "browser", id: "store", phase: "保存",
      title: "応答を保存する", wire: '画像本体 + ETag "v1"',
      description: "ブラウザーは画像の応答とETagを保存します。この例では保存を妨げる条件はありません。",
      fields: ["保存：画像本体", '検証子：ETag "v1"', "鮮度：60秒"],
      protection: "ブラウザー内の私用キャッシュ", source: caching + "#section-3",
      effect: { kind: "stages", label: "保存済み応答", stages: [{ text: '画像 + ETag "v1"', status: "保存" }] },
      states: { browser: "新鮮な応答を保存", server: "画像 v1" },
    },
    {
      kind: "local", node: "browser", id: "stale", phase: "再取得",
      title: "鮮度期間が終わる", wire: '保存済み応答 · ETag "v1"',
      description: "例では60秒を超え、保存済み応答が古くなったため、ブラウザーは再検証します。時間の経過は演出であり、実測値ではありません。",
      fields: ["保存済み応答：あり", "鮮度：期限切れ", 'ETag："v1"'],
      protection: "ブラウザー内の判断", source: caching + "#section-4.2",
      effect: { kind: "stages", label: "保存済み応答", stages: [{ text: '画像 + ETag "v1"', status: "期限切れ" }] },
      states: { browser: "古い応答を保存", server: "画像 v1" },
    },
    {
      kind: "message", from: "browser", to: "server", id: "conditional-get", phase: "再検証",
      title: "ETagを添えて再確認する", wire: 'GET /logo.svg HTTP/1.1 · If-None-Match: "v1"',
      displayWire: "条件付きGET", description: "ブラウザーは保存したETagをIf-None-Matchに入れ、現在の表現と一致するかサーバーへ尋ねます。",
      fields: ["Method：GET", "対象：/logo.svg", 'If-None-Match："v1"'],
      protection: "この例では通信路の保護を扱いません。", source: semantics + "#section-13.1.2",
      states: { browser: "古い応答を保存", server: "画像 v1" },
    },
    {
      kind: "message", from: "server", to: "browser", id: "not-modified", phase: "再検証",
      title: "変更なしと返す", wire: 'HTTP/1.1 304 Not Modified · ETag: "v1" · Cache-Control: max-age=60',
      displayWire: "304 変更なし", description: "サーバーの現在のETagは条件と一致します。画像本体を送り直さず、304と更新用のメタデータを返します。",
      fields: ["Status：304 Not Modified", 'ETag："v1"', "Cache-Control：max-age=60", "Content：なし"],
      protection: "画像本体は再送しません。", source: semantics + "#section-15.4.5",
      states: { browser: "古い応答を保存", server: "画像 v1" },
    },
    {
      kind: "local", node: "browser", id: "reuse", phase: "表示",
      title: "保存した画像を再利用する", wire: '保存済み画像 + 更新したメタデータ',
      description: "ブラウザーは304を対応する保存済み応答へ反映し、手元の画像本体を再利用して表示します。",
      fields: ["画像本体：保存済みのもの", "検証結果：変更なし", "鮮度：再設定"],
      protection: "ブラウザー内の処理", source: caching + "#section-4.3.4",
      effect: { kind: "result", label: "表示結果", prompt: "画像：", text: "保存済み画像を表示", pending: "更新中", complete: "再利用" },
      states: { browser: "保存画像を再利用", server: "画像 v1" },
    },
  ],
};

export const httpCache: ProtocolDefinition = {
  id: "http-cache", title: "HTTPキャッシュ",
  description: "ETagで変更を確かめ、保存した応答を再利用する",
  keywords: ["HTTP", "ETag", "304", "条件付きGET", "キャッシュ"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
