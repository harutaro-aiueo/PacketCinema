import type { Scenario } from "../../../domain/lesson";
import { createConnection } from "../fragments/connection";
export const handshake: Scenario = {
  id: "handshake",
  title: "TCP接続の流れ",
  badge: "TCP",
  sceneLabel: "tcp — learner@server",
  nodes: [
    {
      id: "client",
      label: "CLIENT",
      caption: "クライアント",
      image: "./pixels/client.svg",
    },
    {
      id: "server",
      label: "SERVER",
      caption: "サーバー",
      image: "./pixels/server.svg",
    },
  ],
  prerequisites: [],
  notes: [
    "クライアントから接続を始め、成功する例です。各状態は、メッセージを受信して処理した後の状態です。",
    "初期シーケンス番号1000と5000は説明用です。SYNは番号を1つ使います。データを含まないACKは番号を使いません。",
    "オプション、再送、同時オープン、接続失敗、データ転送、切断は省略しています。",
  ],
  steps: createConnection(),
};
