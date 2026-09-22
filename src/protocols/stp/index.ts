import type { ProtocolDefinition } from "../../domain/lesson";
import { convergence } from "./scenarios/convergence";

export const stp: ProtocolDefinition = {
  id: "stp",
  title: "STP",
  description: "スイッチ間のループを防ぎ、障害時に経路を切り替える",
  keywords: [
    "スパニングツリー",
    "Spanning Tree Protocol",
    "ループ防止",
    "スイッチ",
    "BPDU",
    "ブリッジ",
    "冗長化",
    "802.1D",
  ],
  defaultScenarioId: "convergence",
  scenarios: [convergence],
};
