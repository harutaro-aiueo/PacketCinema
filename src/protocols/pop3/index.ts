import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const pop = "https://www.rfc-editor.org/rfc/rfc1939.html";
const tls = "https://www.rfc-editor.org/rfc/rfc8314.html#section-3.1";
const protectedChannel = "TLSで保護された接続内のPOP3メッセージ";

const scenario: Scenario = {
  id: "retrieve-one",
  title: "POP3：メール受信",
  badge: "POP3",
  sceneLabel: "メールアプリ ↔ 受信サーバー",
  nodes: [
    { id: "client", label: "メールアプリ", caption: "利用者", image: "./pixels/client.svg" },
    { id: "server", label: "受信サーバー", caption: "mail.example.org", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "tcp", label: "TCP接続" }],
  notes: [
    "受信サーバーのメールボックスに1通届いている前提で、取得後に削除を確定する成功例です。SMTPによる配送は別教材で扱います。example.orgは文書用のドメインです。",
    "TCP 995番でTLS接続とサーバー証明書の検証が成功した後のPOP3対話を示します。TLS確立と終了、接続先の発見、認証失敗、複数メール、拡張機能、再送は省略します。表示するパスワードは伏せ字で、実際の認証情報ではありません。",
    "DELEは削除予定の印を付け、取引状態からQUITして更新状態に入ったときに削除します。接続が途中で切れた場合は更新状態に入らず、削除しません。アニメーションは実時間や実パケットを表しません。",
  ],
  steps: [
    { kind: "message", from: "server", to: "client", id: "greeting", phase: "認証", title: "受信サーバーが応答する", wire: "+OK POP3 server ready", displayWire: "+OK 準備完了", description: "TLS接続が確立した後、サーバーの挨拶で認証状態が始まります。", fields: ["状態：AUTHORIZATION", "接続：TLS / TCP 995"], protection: protectedChannel, source: tls },
    { kind: "message", from: "client", to: "server", id: "user", phase: "認証", title: "ユーザー名を送る", wire: "USER alice", displayWire: "USER", description: "メールアプリはUSERでメールボックスの利用者名を伝えます。", fields: ["Command：USER", "利用者：alice"], protection: protectedChannel, source: pop + "#section-7" },
    { kind: "message", from: "server", to: "client", id: "user-ok", phase: "認証", title: "ユーザー名を受け付ける", wire: "+OK name accepted", displayWire: "+OK", description: "サーバーはUSERを受け付け、続くPASSを待ちます。この応答だけでは認証は完了しません。", fields: ["応答：+OK", "状態：AUTHORIZATION"], protection: protectedChannel, source: pop + "#section-7" },
    { kind: "message", from: "client", to: "server", id: "pass", phase: "認証", title: "パスワードを送る", wire: "PASS ********", displayWire: "PASS 伏せ字", description: "メールアプリはTLSで保護された接続でPASSを送ります。画面には値を表示しません。", fields: ["Command：PASS", "値：表示しない"], protection: protectedChannel, source: pop + "#section-7" },
    { kind: "message", from: "server", to: "client", id: "authenticated", phase: "認証", title: "メールボックスを開く", wire: "+OK maildrop locked and ready", displayWire: "+OK 認証成功", description: "認証に成功し、サーバーがメールボックスを開いてロックすると取引状態へ進みます。", fields: ["状態：TRANSACTION", "削除予定：なし"], protection: protectedChannel, source: pop + "#section-4" },
    { kind: "message", from: "client", to: "server", id: "stat", phase: "取得", title: "メールの件数を尋ねる", wire: "STAT", displayWire: "STAT", description: "STATで削除予定ではないメールの件数と合計サイズを尋ねます。", fields: ["Command：STAT", "状態：TRANSACTION"], protection: protectedChannel, source: pop + "#section-5" },
    { kind: "message", from: "server", to: "client", id: "stat-ok", phase: "取得", title: "1通あると返す", wire: "+OK 1 120", displayWire: "+OK 1通", description: "サーバーは1通、120オクテットと返します。数値はこの例の値です。", fields: ["件数：1", "合計：120オクテット"], protection: protectedChannel, source: pop + "#section-5" },
    { kind: "message", from: "client", to: "server", id: "retr", phase: "取得", title: "1番のメールを要求する", wire: "RETR 1", displayWire: "RETR 1", description: "メールアプリは番号1のメール全体を要求します。", fields: ["Command：RETR", "メール番号：1"], protection: protectedChannel, source: pop + "#section-5" },
    { kind: "message", from: "server", to: "client", id: "message", phase: "取得", title: "メールを返す", wire: "+OK 120 octets · From: bob@example.org · Subject: Hello · (空行) · Hello! · <CRLF>.<CRLF>", displayWire: "メール本文", description: "サーバーは+OKに続けてメールを複数行で返し、ピリオドだけの行で終端します。画面では内容を短く省略しています。", fields: ["応答：+OK", "終端：<CRLF>.<CRLF>", "メール番号：1"], protection: protectedChannel, source: pop + "#section-5" },
    { kind: "message", from: "client", to: "server", id: "dele", phase: "削除", title: "削除予定にする", wire: "DELE 1", displayWire: "DELE 1", description: "メールアプリは取得済みの1番を削除予定にします。この時点ではサーバー上のメールはまだ消えません。", fields: ["Command：DELE", "メール番号：1"], protection: protectedChannel, source: pop + "#section-5" },
    { kind: "message", from: "server", to: "client", id: "marked", phase: "削除", title: "削除予定を確認する", wire: "+OK message 1 deleted", displayWire: "+OK 削除予定", description: "サーバーは削除予定の印を付けて応答します。実際の削除はQUIT後の更新状態で行います。", fields: ["状態：TRANSACTION", "削除予定：1番"], protection: protectedChannel, source: pop + "#section-5" },
    { kind: "message", from: "client", to: "server", id: "quit", phase: "終了", title: "対話を終える", wire: "QUIT", displayWire: "QUIT", description: "メールアプリが取引状態からQUITを送ると、更新状態へ進みます。", fields: ["Command：QUIT", "次の状態：UPDATE"], protection: protectedChannel, source: pop + "#section-6" },
    { kind: "message", from: "server", to: "client", id: "updated", phase: "終了", title: "削除を確定して終了する", wire: "+OK POP3 server signing off", displayWire: "+OK 終了", description: "サーバーは削除予定のメールを削除し、メールボックスのロックを解放して終了を返します。", fields: ["状態：UPDATE", "削除：1番を確定"], protection: protectedChannel, source: pop + "#section-6" },
  ],
};

export const pop3: ProtocolDefinition = {
  id: "pop3", title: "POP3", description: "受信サーバーから1通のメールを取得して終了する",
  keywords: ["メール", "受信", "メールボックス", "RETR", "DELE"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
