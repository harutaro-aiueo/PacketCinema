import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const rfc = "https://www.rfc-editor.org/rfc/rfc959.html";
const control = "FTP制御接続（暗号化なし）";
const data = "別のTCPデータ接続（暗号化なし）";

const scenario: Scenario = {
  id: "passive-retrieve",
  title: "FTPファイル取得",
  badge: "FTP",
  sceneLabel: "FTPクライアント ↔ FTPサーバー",
  nodes: [
    { id: "client", label: "FTPクライアント", caption: "ファイルを取得", image: "./pixels/client.svg" },
    { id: "server", label: "FTPサーバー", caption: "ftp.example.org", image: "./pixels/server.svg" },
  ],
  prerequisites: [{ protocol: "tcp", label: "TCP接続" }],
  notes: [
    "RFC 959のFTPで、小さなファイル1件をパッシブモードで取得する成功例です。制御接続でのログインは完了済みとし、実際のユーザー名・パスワードは表示しません。example.orgは文書用のドメイン、192.0.2.10はRFC 5737の文書用アドレスです。",
    "制御接続とデータ接続は別のTCP接続です。図では同じ2台の間を動く論理メッセージとして描き分け、TCPの接続確立・再送・切断手順や実際のポート値は省略します。アニメーションの長さは実時間を表しません。",
    "FTPの制御とデータはこの例では暗号化されません。実運用で秘密の認証情報や機密ファイルを平文FTPで送る例ではありません。失敗応答や複数ファイルの取得は扱いません。",
  ],
  steps: [
    { kind: "message", from: "client", to: "server", id: "pasv", phase: "データ接続の準備", title: "受け口を用意してもらう", wire: "PASV", description: "クライアントは制御接続でPASVを送り、サーバーにデータ接続の待ち受けを依頼します。", fields: ["Command：PASV", "経路：制御接続"], protection: control, source: rfc + "#section-4.1.2" },
    { kind: "message", from: "server", to: "client", id: "pasv-reply", phase: "データ接続の準備", title: "接続先を知らせる", wire: "227 Entering Passive Mode (192,0,2,10,195,80)", displayWire: "227 接続先を通知", description: "サーバーは227応答で待ち受け先のIPv4アドレスとポートを返します。表示値は説明用で、195×256＋80＝50000番です。", fields: ["応答：227", "例示アドレス：192.0.2.10", "例示ポート：50000"], protection: control, source: rfc + "#section-4.2.2" },
    { kind: "message", from: "client", to: "server", id: "retr", phase: "取得を要求", title: "ファイルを要求する", wire: "RETR readme.txt", description: "クライアントは制御接続でRETRを送り、指定したファイルのコピーを要求します。", fields: ["Command：RETR", "ファイル：readme.txt", "経路：制御接続"], protection: control, source: rfc + "#section-4.1.3" },
    { kind: "message", from: "server", to: "client", id: "preliminary", phase: "取得を要求", title: "転送開始を予告する", wire: "150 File status okay; about to open data connection", displayWire: "150 転送を開始", description: "サーバーは150の予備応答を制御接続で返します。転送の完了を示す応答ではありません。", fields: ["応答：150", "経路：制御接続"], protection: control, source: rfc + "#section-4.2.2" },
    { kind: "message", from: "client", to: "server", id: "data-connect", phase: "データ転送", title: "別の接続を開く", wire: "TCP data connection → 192.0.2.10:50000", displayWire: "データ接続", description: "クライアントは227で示された待ち受け先へ別のTCPデータ接続を開きます。ここではTCPハンドシェイクを一場面にまとめます。", fields: ["方向：クライアントから接続", "接続先：227のアドレスとポート", "経路：データ接続"], protection: data, source: rfc + "#section-3.3" },
    { kind: "message", from: "server", to: "client", id: "file", phase: "データ転送", title: "ファイルの内容を送る", wire: "readme.txt bytes", displayWire: "ファイルの内容", description: "サーバーは要求されたファイルのコピーを制御接続ではなくデータ接続で送ります。内容は省略表示です。", fields: ["方向：サーバーからクライアント", "経路：データ接続", "対象：readme.txt"], protection: data, source: rfc + "#section-4.1.3" },
    { kind: "message", from: "server", to: "client", id: "data-close", phase: "データ転送", title: "データ接続を閉じる", wire: "Close data connection", displayWire: "データ接続を閉じる", description: "ストリームモードでは、サーバーがデータ接続を閉じてファイルの終わりを示します。制御接続は続きます。", fields: ["転送モード：Stream", "データ接続：終了", "制御接続：継続"], protection: data, source: rfc + "#section-3.3" },
    { kind: "message", from: "server", to: "client", id: "complete", phase: "完了", title: "転送成功を知らせる", wire: "226 Closing data connection; transfer complete", displayWire: "226 転送成功", description: "サーバーは制御接続で226の完了応答を返し、ファイル転送の成功を知らせます。", fields: ["応答：226", "経路：制御接続"], protection: control, source: rfc + "#section-4.2.2" },
    { kind: "message", from: "client", to: "server", id: "quit", phase: "終了", title: "FTP対話を終える", wire: "QUIT", description: "クライアントは制御接続でQUITを送り、FTP対話の終了を要求します。", fields: ["Command：QUIT", "経路：制御接続"], protection: control, source: rfc + "#section-4.1.1" },
    { kind: "message", from: "server", to: "client", id: "goodbye", phase: "終了", title: "制御接続を閉じる", wire: "221 Service closing control connection", displayWire: "221 終了", description: "サーバーは221応答でログアウトと制御接続の終了を知らせます。", fields: ["応答：221", "制御接続：終了"], protection: control, source: rfc + "#section-4.2.2" },
  ],
};

export const ftp: ProtocolDefinition = {
  id: "ftp", title: "FTP", description: "別のデータ接続を使ってファイルを取得する",
  keywords: ["ファイル転送", "ダウンロード", "PASV", "RETR"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
