import type { ProtocolDefinition, Scenario } from "../../domain/lesson";
import { interactiveSteps } from "./scenarios/interactive";
import { createExecSteps } from "./scenarios/exec";
const nodes = [
  {
    id: "client",
    label: "CLIENT",
    caption: "クライアント",
    image: "./pixels/client.svg",
  },
  {
    id: "server",
    label: "SERVER",
    caption: "SSHサーバー",
    image: "./pixels/server.svg",
  },
];
const prerequisites = [{ protocol: "tcp", label: "TCP接続済み" }];
const execNotes = [
  "SSH 2.0の接続に成功する例です。各矢印はSSHの論理メッセージです。TCPパケットとは一対一に対応しません。",
  "鍵交換にはcurve25519-sha256を使います。ホスト鍵とユーザー鍵には、それぞれ別のEd25519鍵を使います。暗号方式の推奨一覧ではありません。",
  "拡張機能の交渉、認証方式の探索、再鍵交換、ウィンドウ調整、失敗時の処理、TCP切断は省略します。実装によって、メッセージや順序は異なります。",
];
const scenarios: Scenario[] = [
  {
    id: "interactive",
    title: "SSH接続の流れ",
    badge: "公開鍵認証",
    sceneLabel: "ssh — learner@server",
    nodes,
    prerequisites: [],
    notes: [
      "SSH接続に成功する例です。SSHの論理メッセージとTCPセグメントは、一対一に対応しません。入力文字、端末エコー、プロンプトはまとめて表示します。再送や失敗時の処理などは省略します。",
    ],
    steps: interactiveSteps,
  },
  ...(["publickey", "password"] as const).map((auth) => ({
    id: "exec-" + auth,
    title: "SSH単一コマンド実行",
    badge: auth === "publickey" ? "公開鍵認証" : "パスワード認証",
    sceneLabel: "ssh learner@server whoami",
    nodes,
    prerequisites,
    notes: execNotes,
    steps: createExecSteps(auth),
  })),
];
export const ssh: ProtocolDefinition = {
  id: "ssh",
  description: "通信を暗号化してサーバーに接続し、コマンドを実行する",
  keywords: ["リモート接続", "ログイン", "暗号化", "認証", "シェル"],
  title: "SSH",
  defaultScenarioId: "interactive",
  scenarios,
};
