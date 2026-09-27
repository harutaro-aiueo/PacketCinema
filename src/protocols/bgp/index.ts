import type { ProtocolDefinition } from "../../domain/lesson";
import { peering } from "./scenarios/peering";

export const bgp: ProtocolDefinition = {
  id: "bgp",
  title: "BGP",
  description: "R1がR2へLANへの経路を知らせ、取り消す流れを学ぶ",
  keywords: [
    "Border Gateway Protocol",
    "経路制御",
    "ルーティング",
    "AS",
    "eBGP",
    "ピア",
    "UPDATE",
  ],
  defaultScenarioId: "peering",
  scenarios: [peering],
};
