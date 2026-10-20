import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const rfc = "https://www.rfc-editor.org/rfc/rfc9051.html";
const protectedChannel = "TLSで保護されたIMAP接続内のメッセージ";

const scenario: Scenario = {
  id: "select-and-fetch",
  title: "IMAP：受信",
  badge: "IMAP",
  sceneLabel: "メールアプリ ↔ 受信サーバー",
  nodes: [
    { id: "client", label: "メールアプリ", caption: "受信箱を開く", image: "./pixels/client.svg" },
    { id: "server", label: "受信サーバー", caption: "メールを保持", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "tcp", label: "TCP接続" }],
  notes: [
    "IMAP4rev2で、認証済みの利用者がINBOXにある1通を読む成功例です。SMTPによる配送は別教材で扱います。POP3の例と違い、この例ではサーバー上のメールを削除しません。",
    "TCP 993番でTLS接続と証明書検証、認証が成功した後から示します。接続先の発見、TLS確立、認証方式、失敗応答、複数メール、同期処理は省略します。メール本文とUIDは教材用の値です。",
    "SELECTに対する応答は複数行ですが、図では要点を一場面にまとめます。UIDは同じメールボックスのUIDVALIDITYと組み合わせて扱う識別子です。アニメーションは実時間や実パケット分割を表しません。",
  ],
  steps: [
    {
      kind: "message", from: "client", to: "server", id: "select", phase: "受信箱を開く",
      title: "INBOXを選ぶ", wire: "A001 SELECT INBOX", displayWire: "SELECT INBOX",
      description: "メールアプリはINBOXを選び、保存されているメールを参照できる状態へ進もうとします。",
      fields: ["タグ：A001", "メールボックス：INBOX", "現在：認証済み"],
      protection: protectedChannel, source: rfc + "#section-6.3.2",
    },
    {
      kind: "message", from: "server", to: "client", id: "selected", phase: "受信箱を開く",
      title: "件数と識別情報を返す",
      wire: "* FLAGS (\\Seen) · * 1 EXISTS · * OK [PERMANENTFLAGS (\\Seen)] · * OK [UIDVALIDITY 7] · * OK [UIDNEXT 43] · * LIST () \"/\" INBOX · A001 OK [READ-WRITE] SELECT completed",
      displayWire: "1通・UID情報",
      description: "サーバーは1通あることと、UIDの有効範囲を示すUIDVALIDITYなどを返します。A001 OKで選択が成功し、選択済み状態になります。",
      fields: ["件数：1通", "UIDVALIDITY：7（例）", "次に割り当てるUID：43（例）", "状態：選択済み"],
      protection: protectedChannel, source: rfc + "#section-6.3.2",
    },
    {
      kind: "message", from: "client", to: "server", id: "uid-fetch", phase: "メールを読む",
      title: "UIDで1通を指定する", wire: "A002 UID FETCH 42 (UID BODY.PEEK[])", displayWire: "UID FETCH 42",
      description: "メールアプリはUID 42のメールを要求します。BODY.PEEK[]は本文を読み出しても既読フラグを自動では付けない指定です。",
      fields: ["タグ：A002", "UID：42（例）", "取得：UIDとメール全体", "既読フラグ：自動では変更しない"],
      protection: protectedChannel, source: rfc + "#section-6.4.9",
    },
    {
      kind: "message", from: "server", to: "client", id: "fetched", phase: "メールを読む",
      title: "メールを返す",
      wire: "* 1 FETCH (UID 42 BODY[] {…} From: bob@example.org · Subject: Hello · Hello!) · A002 OK FETCH completed",
      displayWire: "UID 42のメール",
      description: "サーバーはUIDとメールの内容を返し、A002 OKで要求の完了を知らせます。メールはサーバー上に残ります。",
      fields: ["応答の連番：1", "UID：42", "本文：教材用の短い例", "状態：選択済み"],
      protection: protectedChannel, source: rfc + "#section-6.4.5",
    },
    {
      kind: "message", from: "client", to: "server", id: "logout", phase: "終了",
      title: "接続を終える", wire: "A003 LOGOUT", displayWire: "LOGOUT",
      description: "読み終えたメールアプリはLOGOUTを送り、IMAPの対話を終えます。",
      fields: ["タグ：A003", "メール：サーバー上に残る"],
      protection: protectedChannel, source: rfc + "#section-6.1.3",
    },
    {
      kind: "message", from: "server", to: "client", id: "bye", phase: "終了",
      title: "終了を知らせる", wire: "* BYE Logging out · A003 OK LOGOUT completed", displayWire: "BYE・OK",
      description: "サーバーはBYEを送った後、A003 OKでLOGOUTの完了を知らせます。",
      fields: ["BYE：対話の終了", "A003 OK：命令の完了"],
      protection: protectedChannel, source: rfc + "#section-6.1.3",
    },
  ],
};

export const imap: ProtocolDefinition = {
  id: "imap", title: "IMAP", description: "受信箱を選び、UIDで1通のメールを読む",
  keywords: ["メール", "受信", "受信箱", "UID", "POP3との違い"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
