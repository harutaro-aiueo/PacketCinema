import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const rfc = "https://www.rfc-editor.org/rfc/rfc5321.html";

const scenario: Scenario = {
  id: "one-message",
  title: "SMTP：メール転送",
  badge: "SMTP",
  sceneLabel: "送信サーバー ↔ 受信サーバー",
  nodes: [
    { id: "sender", label: "送信サーバー", caption: "example.net", image: "./pixels/client.svg" },
    { id: "receiver", label: "受信サーバー", caption: "example.org", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "tcp", label: "TCP接続" }],
  notes: [
    "送信サーバーから受信サーバーへ、受信者1人のメールを1通渡す成功例です。example.netとexample.orgはRFC 2606で文書用に予約されたドメインです。接続先の選択とTCP接続は済んでいる前提です。",
    "MAIL FROMとRCPT TOは配送用の封筒の情報です。本文中のFrom/Toヘッダーとは役割が異なります。メール本文は短いASCII文字列とし、拡張機能、認証、TLS、再送、配送失敗、受信者のメールボックスへの最終配達は省略します。",
    "250応答はこのサーバーがこの段階の要求を受け入れたことを示します。DATA後の250は転送先サーバーがメッセージを受け取ったことを表し、受信者が読んだことまでは意味しません。アニメーションは実時間を表しません。",
  ],
  steps: [
    { kind: "message", from: "receiver", to: "sender", id: "greeting", phase: "開始", title: "接続を受け入れる", wire: "220 mx.example.org Service ready", displayWire: "220 準備完了", description: "TCP接続後、受信サーバーが220の挨拶を送り、SMTPの対話を始めます。", fields: ["Reply：220", "サーバー：mx.example.org"], protection: "この例では通信路の保護を扱いません。", source: rfc + "#section-3.1" },
    { kind: "message", from: "sender", to: "receiver", id: "ehlo", phase: "開始", title: "送信元を名乗る", wire: "EHLO mail.example.net", displayWire: "EHLO", description: "送信サーバーはEHLOで自分の名前を伝え、相手が対応するSMTP拡張を尋ねます。", fields: ["Command：EHLO", "送信側：mail.example.net"], protection: "この例では通信路の保護を扱いません。", source: rfc + "#section-3.2" },
    { kind: "message", from: "receiver", to: "sender", id: "ehlo-ok", phase: "開始", title: "対話可能と返す", wire: "250 mx.example.org", displayWire: "250 応答", description: "受信サーバーは250でEHLOを受け入れます。この例では追加の拡張機能は使いません。", fields: ["Reply：250", "拡張：使用しない"], protection: "この例では通信路の保護を扱いません。", source: rfc + "#section-4.3.2" },
    { kind: "message", from: "sender", to: "receiver", id: "mail", phase: "封筒", title: "配送上の送信元を伝える", wire: "MAIL FROM:<alice@example.net>", displayWire: "MAIL FROM", description: "MAIL FROMで新しいメール取引を開始し、配送エラーの通知先となる逆経路を指定します。", fields: ["Command：MAIL FROM", "Reverse-path：alice@example.net"], protection: "配送用の封筒情報", source: rfc + "#section-3.3" },
    { kind: "message", from: "receiver", to: "sender", id: "mail-ok", phase: "封筒", title: "送信元を受け入れる", wire: "250 OK", displayWire: "250 OK", description: "受信サーバーはこのMAIL FROMを受け入れ、次の宛先指定を待ちます。", fields: ["Reply：250", "取引：開始済み"], protection: "配送用の封筒情報", source: rfc + "#section-3.3" },
    { kind: "message", from: "sender", to: "receiver", id: "rcpt", phase: "封筒", title: "配送先を指定する", wire: "RCPT TO:<bob@example.org>", displayWire: "RCPT TO", description: "RCPT TOで、この取引の配送先メールボックスを1つ指定します。", fields: ["Command：RCPT TO", "Forward-path：bob@example.org"], protection: "配送用の封筒情報", source: rfc + "#section-3.3" },
    { kind: "message", from: "receiver", to: "sender", id: "rcpt-ok", phase: "封筒", title: "配送先を受け入れる", wire: "250 OK", displayWire: "250 OK", description: "受信サーバーは指定された宛先を受け入れ、メッセージを受け取る準備をします。", fields: ["Reply：250", "受け入れた宛先：bob@example.org"], protection: "配送用の封筒情報", source: rfc + "#section-3.3" },
    { kind: "message", from: "sender", to: "receiver", id: "data", phase: "本文", title: "本文の送信を申し出る", wire: "DATA", displayWire: "DATA", description: "送信サーバーはDATAを送り、メールのヘッダーと本文を続けて送ってよいか尋ねます。", fields: ["Command：DATA", "受信者：1人"], protection: "この例では通信路の保護を扱いません。", source: rfc + "#section-3.3" },
    { kind: "message", from: "receiver", to: "sender", id: "data-ready", phase: "本文", title: "本文の受け入れを許可する", wire: "354 Start mail input", displayWire: "354 送信してよい", description: "354は中間応答です。これを受けてから送信側がメールデータを送ります。", fields: ["Reply：354", "次：メールデータ"], protection: "この例では通信路の保護を扱いません。", source: rfc + "#section-4.3.2" },
    { kind: "message", from: "sender", to: "receiver", id: "content", phase: "本文", title: "メールデータを送る", wire: "From: alice@example.net · To: bob@example.org · Subject: Hello · (空行) · Hello! · <CRLF>.<CRLF>", displayWire: "本文と終端", description: "送信側はヘッダー、空行、本文を送り、CRLF・ピリオド・CRLFでメールデータの終わりを示します。", fields: ["Fromヘッダー：alice@example.net", "Toヘッダー：bob@example.org", "本文：Hello!", "終端：<CRLF>.<CRLF>"], protection: "この例では通信路の保護を扱いません。", source: rfc + "#section-3.3" },
    { kind: "message", from: "receiver", to: "sender", id: "accepted", phase: "完了", title: "メールを受け取ったと返す", wire: "250 OK", displayWire: "250 受信", description: "終端を受け取ったサーバーは250を返し、この取引でのメッセージ受け入れを知らせます。受信者が読んだ意味ではありません。", fields: ["Reply：250", "取引：受け入れ済み"], protection: "受信者への最終配達は範囲外", source: rfc + "#section-3.3" },
    { kind: "message", from: "sender", to: "receiver", id: "quit", phase: "終了", title: "対話を終える", wire: "QUIT", displayWire: "QUIT", description: "送信サーバーはQUITでSMTPセッションの終了を要求します。", fields: ["Command：QUIT"], protection: "この例では通信路の保護を扱いません。", source: rfc + "#section-4.1.1.10" },
    { kind: "message", from: "receiver", to: "sender", id: "bye", phase: "終了", title: "終了を確認する", wire: "221 mx.example.org closing", displayWire: "221 終了", description: "受信サーバーは221を返し、SMTPの対話を閉じます。", fields: ["Reply：221", "セッション：終了"], protection: "この例では通信路の保護を扱いません。", source: rfc + "#section-4.3.2" },
  ],
};

export const smtp: ProtocolDefinition = {
  id: "smtp", title: "SMTP",
  description: "送信サーバーから受信サーバーへ1通のメールを渡す",
  keywords: ["メール", "電子メール", "MAIL FROM", "RCPT TO", "DATA"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
