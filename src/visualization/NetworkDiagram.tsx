import type React from "react";
import type { Scenario, Step } from "../domain/lesson";

export function NetworkDiagram({
  scenario,
  current,
  progress,
  travel,
}: {
  scenario: Scenario;
  current: Step;
  progress: number;
  travel: number;
}) {
  const [firstNode, secondNode] = scenario.nodes;
  const first = scenario.networks?.find(
    (network) => network.node === firstNode.id,
  );
  const second = scenario.networks?.find(
    (network) => network.node === secondNode.id,
  );
  if (!first || !second)
    throw new Error("Network diagram needs one LAN per node");

  const action = current.networkAction;
  const activeNetwork = action
    ? scenario.networks?.find((network) => network.id === action.networkId)
    : undefined;
  const receiver =
    current.kind === "message"
      ? scenario.nodes.find((node) => node.id === current.to)
      : undefined;
  const actionLabel = action?.kind === "advertise" ? "広告" : "撤回";
  const firstState = current.networkStates?.[first.id] ?? "up";
  const secondState = current.networkStates?.[second.id] ?? "up";
  const disconnectedNetwork = [first, second].find(
    (network) => current.networkStates?.[network.id] === "down",
  );
  const disconnectedRouter = disconnectedNetwork
    ? scenario.nodes.find((node) => node.id === disconnectedNetwork.node)
    : undefined;

  return (
    <figure
      className="network-diagram"
      data-network-action={action?.kind ?? "none"}
      aria-label={
        disconnectedNetwork && disconnectedRouter
          ? `${disconnectedNetwork.label}と${disconnectedRouter.label}の間は切断。${firstNode.label}と${secondNode.label}の間は接続中`
          : "両ルーターと接続するLANの構成図"
      }
    >
      <div className="network-path">
        <div
          className="network-lan"
          data-network={first.id}
          data-active={activeNetwork?.id === first.id}
          data-state={firstState}
        >
          <span>{first.label}</span>
          <code>{first.prefix}</code>
        </div>
        <div className="network-lan-link" data-network-link={first.id} data-state={firstState} aria-hidden="true" />
        <div className="network-router" data-router={firstNode.id}>
          <strong>{firstNode.label}</strong>
          <small>{firstNode.caption}</small>
        </div>
        <div className="network-peer-link" data-action={action?.kind ?? "none"} data-state="up">
          {action && (
            <span className="network-route-arrow" aria-hidden="true">
              {current.kind === "message" && current.from === firstNode.id
                ? "→"
                : "←"}
            </span>
          )}
          {current.kind === "message" && (
            <span
              className="packet network-packet"
              data-progress={progress}
              style={{ "--travel": `${travel}%` } as React.CSSProperties}
            >
              <img src="./pixels/packet.svg" alt="" />
            </span>
          )}
        </div>
        <div className="network-router" data-router={secondNode.id}>
          <strong>{secondNode.label}</strong>
          <small>{secondNode.caption}</small>
        </div>
        <div className="network-lan-link" data-network-link={second.id} data-state={secondState} aria-hidden="true" />
        <div
          className="network-lan"
          data-network={second.id}
          data-active={activeNetwork?.id === second.id}
          data-state={secondState}
        >
          <span>{second.label}</span>
          <code>{second.prefix}</code>
        </div>
      </div>
      <figcaption className="network-diagram-caption">
        {activeNetwork && receiver
          ? `${activeNetwork.prefix} → ${receiver.label}へ${actionLabel}`
          : disconnectedNetwork && disconnectedRouter
            ? `${disconnectedNetwork.label}は切断。${firstNode.label}–${secondNode.label}間は接続中`
          : `${firstNode.label}と${secondNode.label}は別々のLANにつながる`}
      </figcaption>
    </figure>
  );
}
