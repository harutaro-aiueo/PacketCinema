import type { Step, StepContent } from "../../../domain/lesson";
import { createConnection, createDisconnection } from "../../tcp";
import { transport, service, authSteps, session } from "../fragments/messages";
import { makeStep } from "../fragments/step";
const secure = "暗号化・改ざん検知あり";
function step(
  id: string,
  phase: string,
  title: string,
  wire: string,
  from: string,
  to: string,
  description: string,
  protection = secure,
): Step {
  return makeStep({
    id,
    phase,
    title,
    wire,
    from,
    to,
    description,
    protection,
    fields: [wire],
    source:
      id === "disconnect"
        ? "https://www.rfc-editor.org/rfc/rfc4253#section-11.1"
        : id.startsWith("pty")
          ? "https://www.rfc-editor.org/rfc/rfc4254#section-6.2"
          : id === "whoami" || id === "exit-data"
            ? "https://www.rfc-editor.org/rfc/rfc4254#section-5.2"
            : "https://www.rfc-editor.org/rfc/rfc4254#section-6.5",
  });
}

function existing(
  id: keyof typeof session,
  phase: string,
  changes: Partial<StepContent> = {},
): Step {
  const value = { ...session[id], phase, ...changes };
  return { ...value, displayWire: value.wire.replace("SSH_MSG_", "") };
}
export const interactiveSteps: Step[] = [
  step(
    "command",
    "SSH接続開始",
    "SSH接続開始",
    "$ ssh learner@server",
    "client",
    "client",
    "端末で接続先とユーザー名を指定します。最初に、サーバーのTCPポート22へ接続します。",
    "端末内の操作",
  ),
  ...createConnection({ phase: "TCP接続" }),
  ...[
    ...transport,
    ...service,
    ...authSteps.publickey,
    session["auth-success"],
  ].map((s) => ({
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
    "対話形式で操作するため、サーバーに仮想端末（PTY）を要求します。",
  ),
  step(
    "pty-ok",
    "コマンド操作",
    "リモート端末の準備ができる",
    "SSH_MSG_CHANNEL_SUCCESS",
    "server",
    "client",
    "サーバーは仮想端末の要求を受け付けます。次に、この端末で動かすシェルを要求します。",
  ),
  step(
    "shell",
    "コマンド操作",
    "対話シェルを開始する",
    "CHANNEL_REQUEST · shell",
    "client",
    "server",
    "開いたチャネルで、シェルの起動を要求します。シェルを使うと、接続したまま複数のコマンドを入力できます。",
  ),
  step(
    "shell-ok",
    "コマンド操作",
    "サーバーがシェルの起動を受け付ける",
    "SSH_MSG_CHANNEL_SUCCESS",
    "server",
    "client",
    "サーバーはシェルの起動要求を受け付けます。これでコマンドを入力できます。",
  ),
  step(
    "whoami-input",
    "コマンド操作",
    "ログイン中のユーザー名を調べる",
    "$ whoami",
    "client",
    "client",
    "リモートシェルでwhoamiを実行するため、コマンドを入力します。この画面では、入力全体を一つの操作として示します。",
    "端末内の操作",
  ),
  step(
    "whoami",
    "コマンド操作",
    "入力をサーバーのシェルに届ける",
    "CHANNEL_DATA · whoami",
    "client",
    "server",
    "whoamiと改行を、チャネルのデータとして送ります。サーバー側のシェルはデータを受け取り、コマンドを実行します。",
  ),
  existing("output", "コマンド操作", {
    wire: "CHANNEL_DATA · learner",
    description:
      "サーバーはwhoamiの結果「learner」を返します。端末に結果を表示した後も、シェルは次の入力を待ちます。",
  }),
  step(
    "exit-input",
    "切断",
    "リモートシェルを終了する",
    "$ exit",
    "client",
    "client",
    "exitを入力し、サーバーで動いているシェルを終了します。",
    "端末内の操作",
  ),
  step(
    "exit-data",
    "切断",
    "終了の入力を届ける",
    "CHANNEL_DATA · exit",
    "client",
    "server",
    "exitと改行を送ります。サーバー側のシェルは入力を処理し、終了します。",
  ),
  existing("exit-status", "切断", {
    description:
      "サーバーは、シェルの終了コード0を通知します。これはwhoamiだけでなく、対話シェル全体が終了したことを示します。",
  }),
  existing("eof", "切断"),
  existing("close-s", "切断"),
  existing("close-c", "切断", {
    description:
      "クライアントもCLOSEを返します。双方がCLOSEを送ると、チャネルが閉じます。この例では、続けてSSH接続も終了します。",
  }),
  step(
    "disconnect",
    "切断",
    "SSH接続の終了を通知する",
    "SSH_MSG_DISCONNECT",
    "client",
    "server",
    "クライアントは、SSH接続を終了すると通知します。その後、SSHが使っていたTCP接続も閉じます。",
  ),
  ...createDisconnection({ phase: "切断" }).map((step) => ({
    ...step,
    protection: "TCP制御情報（SSH暗号化の対象外）",
  })),
  step(
    "done",
    "切断",
    "接続が終了する",
    "Connection closed.",
    "client",
    "client",
    "操作はローカル端末に戻ります。TCPはTIME-WAITで待った後、CLOSEDへ移ります。",
    "端末内の表示",
  ),
];
