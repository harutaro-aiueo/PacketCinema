import type { ProtocolDefinition, Scenario } from "../../src/domain/lesson";
const scenario: Scenario = {
  id: "roundtrip",
  title: "架空プロトコル",
  badge: "EXAMPLE",
  sceneLabel: "reader ↔ responder",
  nodes: [
    {
      id: "reader",
      label: "READER",
      caption: "送信端末",
      image: "./pixels/client.svg",
    },
    {
      id: "responder",
      label: "RESPONDER",
      caption: "応答端末",
      image: "./pixels/server.svg",
    },
  ],
  prerequisites: [],
  notes: ["拡張性検証専用の架空教材です。"],
  steps: [
    {
      kind: "message",
      id: "request",
      phase: "往復",
      title: "要求を送る",
      wire: "PING",
      from: "reader",
      to: "responder",
      description: "送信端末から応答端末へ検証用の要求を送信します。",
      fields: ["PING"],
      protection: "検証用",
      source: "https://example.com/spec",
    },
    {
      kind: "message",
      id: "response",
      phase: "往復",
      title: "応答を返す",
      wire: "PONG",
      from: "responder",
      to: "reader",
      description: "応答端末から送信端末へ検証用の応答を送信します。",
      fields: ["PONG"],
      protection: "検証用",
      source: "https://example.com/spec",
    },
    {
      kind: "local",
      id: "complete",
      phase: "完了",
      title: "結果を表示する",
      wire: "Complete",
      node: "reader",
      effect: {
        kind: "result",
        text: "Complete",
        prompt: "",
        pending: "処理中",
        complete: "完了",
        label: "結果表示",
      },
      description: "送信端末で応答を確認し、処理完了を表示します。",
      fields: ["Complete"],
      protection: "端末内",
      source: "https://example.com/spec",
    },
  ],
};
export const example: ProtocolDefinition = {
  id: "example",
  title: "EXAMPLE",
  defaultScenarioId: "roundtrip",
  scenarios: [scenario, { ...scenario, id: "alternate", title: "別シナリオ" }],
};
export const threeNode: ProtocolDefinition = {
  ...example,
  id: "three-node",
  scenarios: [
    {
      ...scenario,
      nodes: [
        ...scenario.nodes,
        {
          id: "relay",
          label: "RELAY",
          caption: "中継端末",
          image: "./pixels/server.svg",
        },
      ],
      steps: scenario.steps.map((step, i) =>
        i === 0 && step.kind === "message" ? { ...step, to: "relay" } : step,
      ),
    },
  ],
};
