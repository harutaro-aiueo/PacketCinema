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
    "通常の能動オープン・受動オープンの成功例です。状態は各メッセージを受信・処理した後を示します。",
    "初期シーケンス番号1000・5000は説明用です。SYNは番号を1つ消費し、データを含まないACKは消費しません。",
    "オプション、再送、同時オープン、接続失敗、データ転送、切断は省略しています。",
  ],
  steps: createConnection(),
};
