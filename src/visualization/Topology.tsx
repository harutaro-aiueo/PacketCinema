import type { Scenario, Step } from "../domain/lesson";

const positions = [
  { x: 150, y: 36 },
  { x: 48, y: 150 },
  { x: 252, y: 150 },
];
export function Topology({
  scenario,
  current,
  progress,
}: {
  scenario: Scenario;
  current: Step;
  progress: number;
}) {
  const point = (id: string) =>
    positions[scenario.nodes.findIndex((node) => node.id === id)];
  const from = point(current.kind === "local" ? current.node : current.from);
  const to = point(current.kind === "local" ? current.node : current.to);
  const travel = Math.min(1, progress * 1.2);
  const active =
    current.kind === "local"
      ? current.node
      : travel < 1
        ? current.from
        : current.to;
  return (
    <div className="topology">
      <svg
        viewBox="0 0 300 202"
        role="img"
        aria-label="3台のスイッチとリンクの状態"
      >
        {scenario.topology!.links.map((link) => {
          const a = point(link.from),
            b = point(link.to);
          const state = current.linkStates?.[link.id] ?? "pending";
          const label = {
            pending: "待機",
            forwarding: "転送",
            blocked: "遮断",
            down: "断線",
          }[state];
          return (
            <g
              key={link.id}
              className={`topology-link ${state}`}
              data-link={link.id}
              data-state={state}
            >
              <title>
                {link.label}: {label}
                {current.topologyAnnotations?.portRoles?.[link.id]
                  ? ` · ${link.from}側 ${current.topologyAnnotations.portRoles[link.id].from} / ${link.to}側 ${current.topologyAnnotations.portRoles[link.id].to}`
                  : ""}
              </title>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
              <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 7}>
                {label}
              </text>
              {current.topologyAnnotations?.portRoles?.[link.id] && (
                <>
                  <text
                    className="topology-port-role"
                    x={a.x + (b.x - a.x) * 0.28}
                    y={a.y + (b.y - a.y) * 0.28 - 8}
                  >
                    {current.topologyAnnotations.portRoles[link.id].from}
                  </text>
                  <text
                    className="topology-port-role"
                    x={a.x + (b.x - a.x) * 0.72}
                    y={a.y + (b.y - a.y) * 0.72 - 8}
                  >
                    {current.topologyAnnotations.portRoles[link.id].to}
                  </text>
                </>
              )}
            </g>
          );
        })}
        {scenario.nodes.map((node, i) => (
          <g
            key={node.id}
            className={`topology-node ${active === node.id ? "active" : ""}`}
            transform={`translate(${positions[i].x},${positions[i].y})`}
          >
            <title>
              {scenario.topology?.nodeDetails?.[node.id] ?? node.caption}
              {current.topologyAnnotations?.nodeDetails?.[node.id]
                ? ` · ${current.topologyAnnotations.nodeDetails[node.id]}`
                : ""}
              {` · ${current.states?.[node.id] ?? "選出前"}`}
            </title>
            <rect x="-37" y="-26" width="74" height="52" rx="3" />
            <text y="-10">{node.label}</text>
            {scenario.topology?.nodeDetails?.[node.id] && (
              <text className="topology-node-detail" y="2">
                {scenario.topology.nodeDetails[node.id]}
              </text>
            )}
            {current.topologyAnnotations?.nodeDetails?.[node.id] && (
              <text className="topology-node-detail" y="14">
                {current.topologyAnnotations.nodeDetails[node.id]}
              </text>
            )}
          </g>
        ))}
        {current.kind === "message" && (
          <circle
            className="topology-packet"
            data-progress={progress}
            cx={from.x + (to.x - from.x) * travel}
            cy={from.y + (to.y - from.y) * travel}
            r="6"
          >
            <title>{current.displayWire ?? current.wire}</title>
          </circle>
        )}
      </svg>
      <dl className="topology-states" aria-label="各スイッチの状態">
        {scenario.nodes.map((node) => (
          <div key={node.id}>
            <dt>{node.label}</dt>
            <dd>{current.states?.[node.id] ?? node.caption}</dd>
          </div>
        ))}
      </dl>
      <p className="topology-legend">線はデータ転送の状態／● は通信</p>
    </div>
  );
}
