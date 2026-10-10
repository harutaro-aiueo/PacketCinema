import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const basic = "https://www.rfc-editor.org/rfc/rfc7617.html";
const semantics = "https://www.rfc-editor.org/rfc/rfc9110.html";

const scenario: Scenario = {
  id: "challenge-response",
  title: "HTTP：Basic認証",
  badge: "401",
  sceneLabel: "ブラウザー ↔ Webサーバー",
  nodes: [
    { id: "browser", label: "ブラウザー", caption: "保護されたページを開く", image: "./pixels/client.svg" },
    { id: "server", label: "Webサーバー", caption: "認証して応答する", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "https", label: "HTTPS通信" }],
  notes: [
    "HTTPSで接続済みのブラウザーが、資格情報をまだ持たずに保護されたページを開く例です。サーバーがBasic方式を提示し、利用者が有効なIDとパスワードを入力する前提です。",
    "Basic方式のBase64は暗号化ではありません。資格情報の実値や符号化後の文字列は表示せず、TLS接続の確立、入力画面、認証失敗、資格情報の再利用は省略します。",
    "401を受けてから再送する一例です。利用者エージェントが最初から資格情報を送る場合もあります。アニメーションの時間は実測時間ではありません。",
  ],
  steps: [
    {
      kind: "message", from: "browser", to: "server", id: "initial-get", phase: "最初の要求",
      title: "保護されたページを要求する", wire: "GET /private HTTP/1.1", displayWire: "GET /private",
      description: "ブラウザーは資格情報を付けずにページを要求します。このページには認証が必要です。",
      fields: ["Method：GET", "対象：/private", "Authorization：なし"],
      protection: "HTTPS接続済みとします。", source: semantics + "#section-9.3.1",
      states: { browser: "認証情報なし", server: "認証を要求" },
    },
    {
      kind: "message", from: "server", to: "browser", id: "challenge", phase: "認証要求",
      title: "Basic方式を案内する", wire: 'HTTP/1.1 401 Unauthorized · WWW-Authenticate: Basic realm="private"',
      displayWire: "401 + Basic", description: "サーバーは401とWWW-Authenticateを返し、この領域でBasic認証が必要だと知らせます。",
      fields: ["Status：401 Unauthorized", 'WWW-Authenticate：Basic realm="private"', "realm：保護領域の名前"],
      protection: "資格情報はまだ送られていません。", source: basic + "#section-2",
      states: { browser: "認証を求められた", server: "資格情報待ち" },
    },
    {
      kind: "local", node: "browser", id: "prepare-credentials", phase: "資格情報の準備",
      title: "IDとパスワードを符号化する", wire: "ID:パスワード → Base64",
      description: "ブラウザーは入力されたIDとパスワードをコロンでつなぎ、Base64で符号化します。Base64だけでは内容を秘匿できません。",
      fields: ["入力：IDとパスワード", "結合：ID:パスワード", "変換：Base64"],
      protection: "実際の資格情報は表示しません。", source: basic + "#section-2",
      effect: { kind: "stages", label: "資格情報", stages: [{ text: "ID:パスワード", status: "Base64に変換" }] },
      states: { browser: "資格情報を準備", server: "資格情報待ち" },
    },
    {
      kind: "message", from: "browser", to: "server", id: "authorized-get", phase: "再要求",
      title: "資格情報を付けて再送する", wire: "GET /private HTTP/1.1 · Authorization: Basic <Base64>",
      displayWire: "GET + Basic", description: "ブラウザーは同じページを再び要求し、Authorizationに符号化した資格情報を付けます。",
      fields: ["Method：GET", "対象：/private", "Authorization：Basic <Base64>"],
      protection: "資格情報を送るためHTTPSが必要です。", source: basic + "#section-2",
      states: { browser: "資格情報を送信", server: "資格情報を確認" },
    },
    {
      kind: "message", from: "server", to: "browser", id: "authorized-200", phase: "表示",
      title: "認証後のページを返す", wire: "HTTP/1.1 200 OK · 保護されたページ", displayWire: "200 OK",
      description: "この例では資格情報が有効なので、サーバーは要求されたページを返します。",
      fields: ["判定：資格情報が有効", "Status：200 OK", "本文：保護されたページ"],
      protection: "ページの内容もHTTPSで送ります。", source: semantics + "#section-15.3.1",
      states: { browser: "ページを表示", server: "認証済み" },
    },
  ],
};

export const httpBasic: ProtocolDefinition = {
  id: "http-basic", title: "HTTP Basic認証",
  description: "401の案内を受け、資格情報を付けて再要求する",
  keywords: ["HTTP", "Basic", "401", "WWW-Authenticate", "Authorization", "認証"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
