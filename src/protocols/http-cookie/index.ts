import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const cookie = "https://www.rfc-editor.org/rfc/rfc6265.html";

const scenario: Scenario = {
  id: "store-and-send",
  title: "HTTP Cookie",
  badge: "Cookie",
  sceneLabel: "ブラウザー ↔ Webサーバー",
  nodes: [
    { id: "browser", label: "ブラウザー", caption: "保存と送信", image: "./pixels/client.svg" },
    { id: "server", label: "Webサーバー", caption: "設定を受信", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "https", label: "HTTPS通信" }],
  notes: [
    "同じホストへHTTPSで接続する二つの要求を例に、サーバーが表示設定をCookieで保存させ、次の要求で受け取る流れを示します。値は説明用で、個人情報や認証情報ではありません。",
    "ブラウザーがCookieを許可し、期限切れでなく、Path=/とSecureの条件に合う場合を扱います。Domain、期限、SameSite、複数Cookie、拒否や削除は省略します。",
    "Cookieはブラウザーが送る状態情報です。サーバーが値をどう使うかはアプリケーションが決めます。通信アニメーションの時間は実測時間ではありません。",
  ],
  steps: [
    {
      kind: "message", from: "browser", to: "server", id: "initial-get", phase: "最初の要求",
      title: "設定なしでページを要求", wire: "GET /welcome HTTP/1.1", displayWire: "GET /welcome",
      description: "ブラウザーはまだこの例のCookieを保存していないので、Cookieヘッダーを付けずに要求します。",
      fields: ["Method：GET", "対象：/welcome", "Cookie：なし"],
      protection: "HTTPS接続済みとします。", source: cookie + "#section-3",
      states: { browser: "Cookieなし", server: "最初の要求を受信" },
    },
    {
      kind: "message", from: "server", to: "browser", id: "set-cookie", phase: "設定の通知",
      title: "Cookieを設定する応答", wire: "HTTP/1.1 200 OK · Set-Cookie: theme=dark; Path=/; Secure",
      displayWire: "200 + Set-Cookie",
      description: "サーバーは応答のSet-Cookieヘッダーで表示設定を渡します。Path=/は送信対象のパス、Secureは安全な通信に限定する属性です。",
      fields: ["Status：200 OK", "Set-Cookie：theme=dark", "Path：/", "Secure：あり"],
      protection: "この例ではHTTPSで応答します。", source: cookie + "#section-4.1.2",
      states: { browser: "設定を受信", server: "設定を通知済み" },
    },
    {
      kind: "local", node: "browser", id: "store-cookie", phase: "ブラウザー内",
      title: "Cookieを保存する", wire: "theme=dark → Cookie保存領域",
      description: "ブラウザーは名前と値、PathとSecureの属性を保存します。次の要求で送るかどうかは要求先との条件で決まります。",
      fields: ["名前：theme", "値：dark", "Path：/", "Secure：あり"],
      protection: "保存はブラウザー内の処理です。", source: cookie + "#section-5.3",
      effect: { kind: "stages", label: "Cookie", stages: [{ text: "theme=dark", status: "保存" }] },
      states: { browser: "Cookieを保存", server: "次の要求を待つ" },
    },
    {
      kind: "message", from: "browser", to: "server", id: "cookie-get", phase: "次の要求",
      title: "Cookieを付けて要求", wire: "GET /prefs HTTP/1.1 · Cookie: theme=dark",
      displayWire: "GET + Cookie",
      description: "同じホストの/prefsはPath=/に合い、HTTPSなので、ブラウザーは保存した名前と値をCookieヘッダーで送ります。PathとSecureの属性自体は送りません。",
      fields: ["Method：GET", "対象：/prefs", "Cookie：theme=dark", "属性：Cookieヘッダーには含めない"],
      protection: "Secure属性の条件を満たすHTTPS要求です。", source: cookie + "#section-5.4",
      states: { browser: "Cookieを送信", server: "設定を受信" },
    },
    {
      kind: "message", from: "server", to: "browser", id: "personalized-200", phase: "表示",
      title: "設定に応じたページを返す", wire: "HTTP/1.1 200 OK · 暗い配色のページ", displayWire: "200 OK",
      description: "この例のサーバーは受け取ったtheme=darkを表示設定として使い、暗い配色のページを返します。値の使い道はアプリケーションごとに異なります。",
      fields: ["受信したCookie：theme=dark", "Status：200 OK", "本文：暗い配色のページ"],
      protection: "ページもHTTPSで返します。", source: cookie + "#section-4.2.2",
      states: { browser: "設定済みページを表示", server: "設定を適用" },
    },
  ],
};

export const httpCookie: ProtocolDefinition = {
  id: "http-cookie", title: "HTTP Cookie",
  description: "Set-Cookieで保存した設定を次の要求で送る",
  keywords: ["HTTP", "Cookie", "Set-Cookie", "ブラウザー", "設定", "状態"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
