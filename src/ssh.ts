import { lessons } from "./lessons";
import type { Actor, Step } from "./model";
const secure = "暗号化・完全性保護あり";
function step(
  id: string,
  phase: string,
  title: string,
  wire: string,
  from: Actor,
  to: Actor,
  description: string,
  protection = secure,
): Step {
  return {
    id,
    phase,
    title,
    wire,
    from,
    to,
    description,
    protection,
    fields: [wire],
    source: id === "disconnect" ? "https://www.rfc-editor.org/rfc/rfc4253#section-11.1" : id.startsWith("pty") ? "https://www.rfc-editor.org/rfc/rfc4254#section-6.2" : id === "whoami" || id === "exit-data" ? "https://www.rfc-editor.org/rfc/rfc4254#section-5.2" : "https://www.rfc-editor.org/rfc/rfc4254#section-6.5",
  };
}
const original = lessons[0].steps("publickey");
const existing = (
  id: string,
  phase: string,
  changes: Partial<Step> = {},
): Step => ({ ...original.find((s) => s.id === id)!, phase, ...changes });
export const sshSteps: Step[] = [
  step(
    "command",
    "SSH接続開始",
    "SSH接続開始",
    "$ ssh learner@server",
    "client",
    "client",
    "端末で接続先とユーザー名を指定します。まずサーバーのTCPポート22への接続を始めます。",
    "端末内の操作",
  ),
  ...lessons[1].steps("publickey").map((s) => ({ ...s, phase: "TCP接続" })),
  ...original
    .slice(
      0,
      original.findIndex((s) => s.id === "channel-open"),
    )
    .map((s) => ({
      ...s,
      phase: s.phase === "ユーザー認証" ? "公開鍵認証" : "鍵交換",
    })),
  existing("channel-open", "コマンド操作"),
  existing("channel-confirm", "コマンド操作"),
  step(
    "pty",
    "コマンド操作",
    "リモート端末を用意してもらう",
    "CHANNEL_REQUEST · pty-req",
    "client",
    "server",
    "対話操作のため、サーバーに仮想端末（PTY）の割り当てを要求します。",
  ),
  step(
    "pty-ok",
    "コマンド操作",
    "リモート端末の準備ができる",
    "SSH_MSG_CHANNEL_SUCCESS",
    "server",
    "client",
    "サーバーが端末の割り当てを受け付けます。次に、この端末で動くシェルを要求します。",
  ),
  step(
    "shell",
    "コマンド操作",
    "対話シェルを開始する",
    "CHANNEL_REQUEST · shell",
    "client",
    "server",
    "開いたチャネルでシェルの起動を要求します。接続したまま複数のコマンドを入力できます。",
  ),
  step(
    "shell-ok",
    "コマンド操作",
    "シェルの起動が受け付けられる",
    "SSH_MSG_CHANNEL_SUCCESS",
    "server",
    "client",
    "サーバーがシェル起動要求を受け付けます。コマンドを入力できる状態になります。",
  ),
  step(
    "whoami-input",
    "コマンド操作",
    "ログイン中のユーザー名を調べる",
    "$ whoami",
    "client",
    "client",
    "リモートシェルで実行するwhoamiを入力します。この画面では入力をまとめて一つの操作として示します。",
    "端末内の操作",
  ),
  step(
    "whoami",
    "コマンド操作",
    "入力をサーバーのシェルに届ける",
    "CHANNEL_DATA · whoami",
    "client",
    "server",
    "whoamiと改行をチャネルのデータとして送ります。サーバー側のシェルが受け取り、コマンドを実行します。",
  ),
  existing("output", "コマンド操作", {
    wire: "CHANNEL_DATA · learner",
    description:
      "サーバーからwhoamiの結果「learner」が返り、端末に表示されます。シェルは終了せず、次の入力を待ちます。",
  }),
  step(
    "exit-input",
    "切断",
    "リモートシェルを終了する",
    "$ exit",
    "client",
    "client",
    "exitを入力して、サーバーで動いているシェルの終了を指示します。",
    "端末内の操作",
  ),
  step(
    "exit-data",
    "切断",
    "終了の入力を届ける",
    "CHANNEL_DATA · exit",
    "client",
    "server",
    "exitと改行を送ります。サーバー側のシェルが入力を処理して終了します。",
  ),
  existing("exit-status", "切断", {
    description:
      "サーバーがシェルの終了コード0を通知します。whoami単体ではなく、対話シェルの終了を知らせる通知です。",
  }),
  existing("eof", "切断"),
  existing("close-s", "切断"),
  existing("close-c", "切断", {
    description:
      "クライアントもCLOSEを返し、双方でチャネルを閉じます。この例では続けて接続全体を終了します。",
  }),
  step(
    "disconnect",
    "切断",
    "SSH接続の終了を通知する",
    "SSH_MSG_DISCONNECT",
    "client",
    "server",
    "クライアントがSSH接続の終了を通知する例です。この後、下位のTCP接続を閉じます。",
  ),
  ...(
    [
      [
        "fin-c",
        "TCPの送信終了を伝える",
        "FIN + ACK",
        "client",
        "server",
        "クライアントが、これ以上データを送らないことをTCPのFINで伝えます。",
      ],
      [
        "fin-ack",
        "クライアントのFINを確認する",
        "ACK",
        "server",
        "client",
        "サーバーがFINの受信を確認します。反対方向はまだ終了していません。",
      ],
      [
        "fin-s",
        "サーバーも送信を終了する",
        "FIN + ACK",
        "server",
        "client",
        "サーバーもFINを送り、自分からのデータ送信を終了します。",
      ],
      [
        "last-ack",
        "最後のFINを確認する",
        "ACK",
        "client",
        "server",
        "クライアントが確認応答を返します。サーバーはCLOSEDとなり、クライアントはTIME-WAITに入ります。",
      ],
    ] as const
  ).map(([id, title, wire, from, to, description]) => ({
    ...step(
      id,
      "切断",
      title,
      wire,
      from,
      to,
      description,
      "TCP制御情報（SSH暗号化の対象外）",
    ),
    source: "https://www.rfc-editor.org/rfc/rfc9293#section-3.6",
  })),
  step(
    "done",
    "切断",
    "接続が終了する",
    "Connection closed.",
    "client",
    "client",
    "ローカル端末に戻りました。TCPはTIME-WAITの待機時間を経てCLOSEDになります。",
    "端末内の表示",
  ),
];
