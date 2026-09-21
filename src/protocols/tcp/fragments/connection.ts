import type { Step } from "../../../domain/lesson";
import { s, compose, type Composition } from "./step";
const r = (n: number, section: string) =>
  "https://www.rfc-editor.org/rfc/rfc" + n + "#section-" + section;
const connection: Step[] = [
  s(
    "syn",
    "接続の確立",
    "接続を始めたいと伝える",
    "SYN",
    "client",
    "server",
    "クライアントが初期シーケンス番号1000を通知します。待ち受け中のサーバーはこれを受け取り、応答を用意します。",
    ["SYN=1 / ACK=0", "SEQ=1000 / ACK番号は無効"],
    "暗号化の機能なし",
    r(9293, "3.5"),
    ["SYN-SENT", "SYN-RECEIVED"],
  ),
  s(
    "syn-ack",
    "接続の確立",
    "受け取りを確認し、自分の番号も伝える",
    "SYN + ACK",
    "server",
    "client",
    "サーバーは次に1001を期待すると伝え、自分の初期番号5000も通知します。クライアントは受信するとESTABLISHEDへ進みます。",
    ["SYN=1 / ACK=1", "SEQ=5000 / ACK=1001"],
    "暗号化の機能なし",
    r(9293, "3.5"),
    ["ESTABLISHED", "SYN-RECEIVED"],
  ),
  s(
    "ack",
    "接続の確立",
    "応答の受け取りを確認する",
    "ACK",
    "client",
    "server",
    "クライアントが次に5001を期待すると返します。サーバーも受信するとESTABLISHEDになり、双方で接続が確立します。TCPの接続確立だけでは通信は暗号化されません。",
    ["SYN=0 / ACK=1", "SEQ=1001 / ACK=5001"],
    "暗号化の機能なし",
    r(9293, "3.5"),
    ["ESTABLISHED", "ESTABLISHED"],
  ),
];
export const createConnection = (options: Composition = {}) =>
  compose(connection, options);
