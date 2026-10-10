import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const rfc = "https://www.rfc-editor.org/rfc/rfc9110.html";

const scenario: Scenario = {
  id: "post-see-other",
  title: "HTTP：303転送",
  badge: "303",
  sceneLabel: "ブラウザー ↔ Webサーバー",
  nodes: [
    { id: "browser", label: "ブラウザー", caption: "フォーム送信", image: "./pixels/client.svg" },
    { id: "server", label: "Webサーバー", caption: "登録と結果", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "tcp", label: "TCP接続" }],
  notes: [
    "同じサーバーにフォームをPOSTし、登録後に結果ページを開く例です。登録が成功し、サーバーが303 See OtherとLocation: /resultを返す前提です。",
    "ブラウザーが転送先を取得する場合の流れを示します。303を受けたすべての利用者エージェントが自動で転送するとは限りません。",
    "TCP接続、TLS、フォームの中身、認証、エラー、転送先がさらに転送する場合は省略します。アニメーションの時間は実測時間ではありません。",
  ],
  steps: [
    {
      kind: "message", from: "browser", to: "server", id: "post", phase: "送信",
      title: "フォームを送る", wire: "POST /submit HTTP/1.1 · フォームデータ", displayWire: "POST /submit",
      description: "ブラウザーはフォームの内容をサーバーへ送ります。この例では登録を依頼します。",
      fields: ["Method：POST", "対象：/submit", "本文：フォームデータ"],
      protection: "通信路の保護はこの例では扱いません。", source: rfc + "#section-9.3.3",
      states: { browser: "送信中", server: "登録待ち" },
    },
    {
      kind: "local", node: "server", id: "register", phase: "登録",
      title: "登録を終える", wire: "フォームを処理",
      description: "サーバーは受け取った内容を登録します。登録処理の具体的な方法はアプリケーションごとに異なります。",
      fields: ["処理：登録成功", "次：結果ページを案内"],
      protection: "サーバー内の処理", source: rfc + "#section-9.3.3",
      effect: { kind: "stages", label: "登録", stages: [{ text: "フォーム", status: "登録済み" }] },
      states: { browser: "応答待ち", server: "登録済み" },
    },
    {
      kind: "message", from: "server", to: "browser", id: "see-other", phase: "転送案内",
      title: "結果ページを案内する", wire: "HTTP/1.1 303 See Other · Location: /result", displayWire: "303 → /result",
      description: "サーバーは303とLocationで別の場所を示します。結果は転送先を取得して確認できます。",
      fields: ["Status：303 See Other", "Location：/result", "転送先：同じサーバー"],
      protection: "応答にフォームの登録内容は含めません。", source: rfc + "#section-15.4.4",
      states: { browser: "転送先を受信", server: "登録済み" },
    },
    {
      kind: "message", from: "browser", to: "server", id: "follow-get", phase: "結果取得",
      title: "GETで結果を開く", wire: "GET /result HTTP/1.1", displayWire: "GET /result",
      description: "このブラウザーは案内に従い、Locationで示された結果ページをGETで取得します。POSTの本文は送り直しません。",
      fields: ["Method：GET", "対象：/result", "POST本文：再送しない"],
      protection: "通信路の保護はこの例では扱いません。", source: rfc + "#section-15.4.4",
      states: { browser: "結果を要求", server: "登録済み" },
    },
    {
      kind: "message", from: "server", to: "browser", id: "result-200", phase: "結果取得",
      title: "結果ページを返す", wire: "HTTP/1.1 200 OK · 結果ページ", displayWire: "200 結果ページ",
      description: "サーバーは結果ページを返します。ブラウザーはそれを表示し、登録結果を確認します。",
      fields: ["Status：200 OK", "対象：/result", "本文：結果ページ"],
      protection: "表示内容は例示です。", source: rfc + "#section-15.3.1",
      states: { browser: "結果を表示", server: "登録済み" },
    },
  ],
};

export const httpRedirect: ProtocolDefinition = {
  id: "http-redirect", title: "HTTPリダイレクト",
  description: "POST後の303案内をたどり、GETで結果を開く",
  keywords: ["HTTP", "303", "Location", "POST", "GET", "転送"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
