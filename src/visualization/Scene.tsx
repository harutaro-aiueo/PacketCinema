import type React from "react";
import { direction, type Scenario, type Step } from "../domain/lesson";
import { twoNodeLayout } from "./layouts/twoNode";
import { LocalEffect } from "./effects/LocalEffect";
import { Topology } from "./Topology";
export function Scene({
  scenario,
  current,
  progress,
  duration,
  paused,
  finished,
  onTogglePause,
  openDetails,
  children,
}: {
  scenario: Scenario;
  current: Step;
  progress: number;
  duration: number;
  paused: boolean;
  finished: boolean;
  onTogglePause: () => void;
  openDetails: () => void;
  children: React.ReactNode;
}) {
  const local = current.kind === "local";
  const topology = !!scenario.topology;
  const layout = topology
    ? {
        side: "client",
        travel: 0,
        active: current.kind === "local" ? current.node : current.from,
        arrived: progress >= 5 / 6,
      }
    : twoNodeLayout(scenario, current, progress);
  const side = layout.side,
    x = layout.travel;
  const summary = current.description.split("。")[0] + "。";
  const status = finished
    ? "再生完了"
    : paused
      ? "一時停止"
      : local
        ? "端末内の操作"
        : layout.arrived
          ? "到着"
          : "送信中";
  return (
    <section
      className="scene"
      aria-label="通信アニメーション"
      data-step={current.id}
    >
      <div className="scene-top">
        <span>
          <i /> {scenario.sceneLabel}
        </span>
        <span role="status">{status}</span>
      </div>
      <div
        className={`stage ${topology ? "topology-stage" : ""} ${!finished ? "can-pause" : ""}`}
        onClick={() => {
          if (!finished && !window.getSelection()?.toString()) onTogglePause();
        }}
      >
        {topology ? (
          <Topology scenario={scenario} current={current} progress={progress} />
        ) : (
          <>
            <div className="actors">
              {scenario.nodes.map((node, i) => (
                <div
                  key={node.id}
                  className={
                    "actor " +
                    (i === 0 ? "client" : "server") +
                    " " +
                    (layout.active === node.id ? "active" : "")
                  }
                >
                  <img className="device" src={node.image} alt="" />
                  <strong>{node.label}</strong>
                  <small>{node.caption}</small>
                </div>
              ))}
            </div>
            <div className="wire">
              <div className="route" />
              {!local && (
                <span
                  className="packet"
                  data-progress={progress}
                  style={{ "--travel": `${x}%` } as React.CSSProperties}
                >
                  <img src="./pixels/packet.svg" alt="" />
                </span>
              )}
            </div>
          </>
        )}
        <div
          className={`callout ${side} ${local ? "local-step" : ""}`}
          aria-live="polite"
        >
          <div className="callout-meta">
            <span>{current.phase}</span>
            <span>{local ? "LOCAL" : direction(current, scenario.nodes)}</span>
          </div>
          {current.kind === "local" ? (
            <LocalEffect
              effect={current.effect}
              progress={progress}
              duration={duration}
            />
          ) : (
            <code>{current.displayWire ?? current.wire}</code>
          )}
          <h2>{current.title}</h2>
          <p>{summary}</p>
          <button
            className="detail-button"
            onClick={(e) => {
              e.stopPropagation();
              openDetails();
            }}
          >
            詳しい解説 ↗
          </button>
        </div>
        <div className="stage-bottom">
          {finished
            ? "すべてのステップが完了しました"
            : paused
              ? "クリックして再開"
              : "クリックして一時停止"}
        </div>
      </div>
      {children}
    </section>
  );
}
