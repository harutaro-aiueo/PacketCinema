import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const rfc = "https://www.rfc-editor.org/rfc/rfc9260.html#section-5.1";

const association: Scenario = {
  id: "cookie-handshake",
  title: "SCTPの接続確立",
  badge: "SCTP",
  sceneLabel: "SCTPの2端点",
  nodes: [
    { id: "initiator", label: "開始側", caption: "通信を開始", image: "./pixels/client.svg" },
    { id: "responder", label: "応答側", caption: "通信を受ける", image: "./pixels/server.svg" },
  ],
  prerequisites: [],
  notes: [
    "RFC 9260のSCTPで、2つの端点が新しいアソシエーションを正常に確立する例です。各場面の状態表示は、メッセージの受信処理が終わった時点を表します。",
    "図の矢印はSCTPチャンクを運ぶ論理的なメッセージです。INITとINIT ACKはそれぞれ単独のチャンクとして送り、COOKIE ECHOやCOOKIE ACKにデータを同梱できる場合も、この例では同梱しません。",
    "複数アドレス、ストリーム数の調整、Cookieの内部値と検証手順、再送、失敗、データ転送と切断は省略します。SCTP自体による暗号化は示していません。アニメーションの長さは実時間ではありません。",
  ],
  steps: [
    {
      kind: "message", from: "initiator", to: "responder", id: "init",
      phase: "確立の開始", title: "通信の開始を申し込む", wire: "INIT",
      description: "開始側は自分のInitiate Tagなどを含むINITを送り、COOKIE-WAIT状態に入ります。",
      fields: ["チャンク：INIT", "Initiate Tag：開始側の識別値", "開始側：COOKIE-WAIT"],
      protection: "暗号化なし", source: rfc,
      states: { initiator: "COOKIE-WAIT", responder: "未確立" },
    },
    {
      kind: "message", from: "responder", to: "initiator", id: "init-ack",
      phase: "Cookieの受け渡し", title: "状態Cookieを渡す", wire: "INIT ACK + State Cookie",
      description: "応答側は自分のInitiate Tagと状態CookieをINIT ACKで返します。この時点では新しいアソシエーションの状態を保持しません。",
      fields: ["チャンク：INIT ACK", "パラメータ：State Cookie", "応答側：状態を保持しない"],
      protection: "暗号化なし", source: rfc,
      states: { initiator: "Cookieを受信", responder: "未確立" },
    },
    {
      kind: "message", from: "initiator", to: "responder", id: "cookie-echo",
      phase: "Cookieの確認", title: "受け取ったCookieを返す", wire: "COOKIE ECHO",
      description: "開始側は受け取ったCookieをCOOKIE ECHOで返し、COOKIE-ECHOED状態に入ります。応答側はCookieを検証して状態を作り、ESTABLISHEDに進みます。",
      fields: ["チャンク：COOKIE ECHO", "開始側：COOKIE-ECHOED", "応答側：ESTABLISHED"],
      protection: "暗号化なし", source: rfc,
      states: { initiator: "COOKIE-ECHOED", responder: "ESTABLISHED" },
    },
    {
      kind: "message", from: "responder", to: "initiator", id: "cookie-ack",
      phase: "確立の完了", title: "確立を知らせる", wire: "COOKIE ACK",
      description: "応答側がCOOKIE ACKを返すと、開始側もESTABLISHEDに進みます。これで両端のアソシエーションが確立します。",
      fields: ["チャンク：COOKIE ACK", "両端：ESTABLISHED"],
      protection: "暗号化なし", source: rfc,
      states: { initiator: "ESTABLISHED", responder: "ESTABLISHED" },
    },
  ],
};

export const sctp: ProtocolDefinition = {
  id: "sctp", title: "SCTP", description: "状態Cookieを使って通信を確立する",
  keywords: ["トランスポート", "アソシエーション", "4ウェイハンドシェイク", "Cookie"],
  defaultScenarioId: association.id, scenarios: [association],
};
