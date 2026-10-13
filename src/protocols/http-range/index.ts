import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const rfc = "https://www.rfc-editor.org/rfc/rfc9110.html";

const scenario: Scenario = {
  id: "two-byte-ranges",
  title: "HTTP：部分取得",
  badge: "Range",
  sceneLabel: "ブラウザー ↔ Webサーバー",
  nodes: [
    { id: "browser", label: "ブラウザー", caption: "必要な範囲を要求", image: "./pixels/client.svg" },
    { id: "server", label: "Webサーバー", caption: "指定範囲を返す", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "https", label: "HTTPS通信" }],
  notes: [
    "HTTPS接続済みで、長さ1000バイトの同じ表現が取得中に変わらず、サーバーがbytesの範囲要求に対応する例です。0から始まる位置で先頭200バイトを2回に分けて取得します。",
    "各206応答に同じ強いETagを付け、受け取った範囲を安全に組み合わせられる前提とします。残り800バイト、条件付き要求、複数範囲を1要求で取得する場合、範囲を無視した200応答、416応答は省略します。",
    "図のメッセージは論理的なHTTP要求・応答で、実際のパケット数や転送時間を表しません。",
  ],
  steps: [
    {
      kind: "message", from: "browser", to: "server", id: "first-range", phase: "前半を要求",
      title: "最初の100バイトを要求", wire: "GET /video.bin HTTP/1.1 · Range: bytes=0-99", displayWire: "GET bytes=0-99",
      description: "ブラウザーはRangeヘッダーで、選ばれた表現の先頭100バイトを要求します。位置は0から数え、終端の99も含みます。",
      fields: ["Method：GET", "Range：bytes=0-99", "対象：/video.bin"],
      protection: "HTTPS接続済みとします。", source: rfc + "#section-14.2",
      states: { browser: "0–99を要求", server: "範囲を確認" },
    },
    {
      kind: "message", from: "server", to: "browser", id: "first-206", phase: "前半を受信",
      title: "指定した部分を返す", wire: 'HTTP/1.1 206 Partial Content · Content-Range: bytes 0-99/1000 · ETag: "v1"', displayWire: "206 bytes 0-99",
      description: "サーバーは指定範囲だけを206で返します。Content-Rangeは届いた位置と表現全体の長さを示します。",
      fields: ["Status：206 Partial Content", "Content-Range：bytes 0-99/1000", 'ETag："v1"（強い検証子）', "本文：100バイト"],
      protection: "本文の実データは表示しません。", source: rfc + "#section-15.3.7.1",
      states: { browser: "0–99を保持", server: "同じ表現を保持" },
    },
    {
      kind: "message", from: "browser", to: "server", id: "second-range", phase: "続きを要求",
      title: "次の100バイトを要求", wire: "GET /video.bin HTTP/1.1 · Range: bytes=100-199", displayWire: "GET bytes=100-199",
      description: "ブラウザーは続く100バイトを別のGETで要求します。この例では取得中に表現が変わらないものとします。",
      fields: ["Method：GET", "Range：bytes=100-199", "保持済み：bytes 0-99"],
      protection: "HTTPS接続済みとします。", source: rfc + "#section-14.1.2",
      states: { browser: "100–199を要求", server: "同じ表現を保持" },
    },
    {
      kind: "message", from: "server", to: "browser", id: "second-206", phase: "続きを受信",
      title: "続きの部分を返す", wire: 'HTTP/1.1 206 Partial Content · Content-Range: bytes 100-199/1000 · ETag: "v1"', displayWire: "206 bytes 100-199",
      description: "サーバーは次の範囲を206で返します。最初の応答と同じ強いETagが付いています。",
      fields: ["Status：206 Partial Content", "Content-Range：bytes 100-199/1000", 'ETag："v1"（同じ強い検証子）', "本文：100バイト"],
      protection: "本文の実データは表示しません。", source: rfc + "#section-15.3.7.1",
      states: { browser: "0–199を保持", server: "2回目の範囲を送信" },
    },
    {
      kind: "local", node: "browser", id: "combine", phase: "部分をまとめる",
      title: "受信した200バイトをつなぐ", wire: "bytes 0-99 + 100-199 → 0-199",
      description: "二つの応答は同じ強いETagで示された表現の、重ならず連続した範囲です。ブラウザーは受信済みの先頭200バイトを一つにつなぎます。残りはまだ取得していません。",
      fields: ['共通ETag："v1"', "受信済み：bytes 0-199", "未取得：bytes 200-999"],
      protection: "結合はブラウザー内の処理です。", source: rfc + "#section-15.3.7.3",
      effect: { kind: "stages", label: "受信済み", stages: [{ text: "0–99 + 100–199", status: "先頭200バイト" }] },
      states: { browser: "先頭200バイトを保持", server: "同じ表現を保持" },
    },
  ],
};

export const httpRange: ProtocolDefinition = {
  id: "http-range", title: "HTTP Range",
  description: "Range要求と206応答でファイルの一部を取得する",
  keywords: ["HTTP", "Range", "206", "部分取得", "ダウンロード", "バイト"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
