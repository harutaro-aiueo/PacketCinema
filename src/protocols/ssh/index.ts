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
  "SSH 2.0の正常系を示す教育用モデルです。各矢印は論理メッセージであり、TCPパケットと一対一ではありません。",
  "鍵交換はcurve25519-sha256、ホスト鍵とユーザー鍵は別々のEd25519鍵を使う例です。暗号の推奨設定一覧ではありません。",
  "拡張交渉、認証方式の探索、再鍵交換、ウィンドウ調整、失敗系、TCP切断は省略しています。実装によりメッセージや順序は異なります。",
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
      "正常系の一例です。SSHは論理メッセージ単位で、TCPセグメントとの一対一対応ではありません。入力文字・端末エコー・プロンプトをまとめ、再送や失敗系などを省略しています。",
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
  description: "暗号化された通信でサーバーに接続し、コマンドを実行する",
  keywords: ["リモート接続", "ログイン", "暗号化", "認証", "シェル"],
  title: "SSH",
  defaultScenarioId: "interactive",
  scenarios,
};
