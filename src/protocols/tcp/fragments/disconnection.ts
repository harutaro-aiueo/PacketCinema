import type { Step } from "../../../domain/lesson";
import { compose, type Composition } from "./step";
function step(
  id: string,
  phase: string,
  title: string,
  wire: string,
  from: string,
  to: string,
  description: string,
  protection: string,
): Step {
  return {
    kind: "message",
    id,
    phase,
    title,
    wire,
    from,
    to,
    description,
    protection,
    fields: [wire],
    source: "https://www.rfc-editor.org/rfc/rfc9293#section-3.6",
  };
}
const disconnection: Step[] = (
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
  ...step(id, "切断", title, wire, from, to, description, "TCP制御情報"),
  source: "https://www.rfc-editor.org/rfc/rfc9293#section-3.6",
}));
export const createDisconnection = (options: Composition = {}) =>
  compose(disconnection, options);
