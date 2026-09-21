import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { lessons } from "./lessons";
import { sshSteps } from "./ssh";
import { decodeView } from "./model";
import "./style.css";
function App() {
  const [view, setView] = useState(() => decodeView(location.hash));
  const tcp = view.lesson === "tcp";
  const steps = tcp ? lessons[1].steps("publickey") : sshSteps;
  const index = Math.min(view.step, steps.length - 1);
  const current = steps[index];
  const [progress, setProgress] = useState(0);
  const [replay, setReplay] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressRef = useRef(0);
  const [details, setDetails] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const local = current.from === current.to;
  const inputCommand: Record<string, string> = {
    command: "ssh learner@server",
    "whoami-input": "whoami",
    "exit-input": "exit",
  };
  const command = inputCommand[current.id] ?? "Connection closed.";
  const duration = local ? 3200 : 6000;
  const typed = command.slice(
    0,
    Math.floor(Math.min(1, (progress * duration) / 2000) * command.length),
  );
  const entered = progress * duration >= 2400;
  const checking = current.id === "host-check";
  const checkPhase = Math.min(2, Math.floor(progress * 3));
  const localResult = checking
    ? ["信頼できる指紋と照合中…", "ホスト鍵の署名を検証中…", "✓ 確認完了"][
        checkPhase
      ]
    : current.id === "done"
      ? entered
        ? "$ ローカル端末に戻りました"
        : "セッションを終了しています…"
      : entered
        ? current.id === "command"
          ? "↵ Enter · TCP接続へ"
          : "↵ Enter · 入力を送信へ"
        : "コマンドを入力中…";
  const arrived = local || progress >= 5 / 6;
  const finished = index === steps.length - 1 && progress >= 1;
  const phases = [...new Set(steps.map((s) => s.phase))];
  function seek(n: number) {
    const step = Math.max(0, Math.min(n, steps.length - 1));
    setView((v) => ({ ...v, step }));
    history.replaceState(null, "", `#/${tcp ? "tcp" : "ssh"}?step=${step}`);
  }
  useEffect(() => {
    const handler = () => setView(decodeView(location.hash));
    addEventListener("hashchange", handler);
    return () => removeEventListener("hashchange", handler);
  }, []);
  useEffect(() => {
    progressRef.current = 0;
    setProgress(0);
  }, [index, tcp, replay, local]);
  useEffect(() => {
    if (paused || details || progressRef.current >= 1) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, progressRef.current + (now - last) / duration);
      last = now;
      progressRef.current = p;
      setProgress(p);
      if (p < 1) frame = requestAnimationFrame(tick);
      else if (index < steps.length - 1) seek(index + 1);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [index, tcp, replay, local, paused, details, duration]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        details ||
        (e.target as HTMLElement).closest("button,a,input,select,summary") ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        if (!finished) setPaused((p) => !p);
      }
      if (e.code === "ArrowRight") {
        e.preventDefault();
        seek(index + 1);
      }
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        seek(index - 1);
      }
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  });
  const side = local || !arrived ? current.from : current.to;
  const x =
    current.from === "client"
      ? 12 + 76 * Math.min(1, progress * 1.2)
      : 88 - 76 * Math.min(1, progress * 1.2);
  const summary = current.description.split("。")[0] + "。";
  const status = finished
    ? "再生完了"
    : paused
      ? "一時停止"
      : local
        ? "端末内の操作"
        : arrived
          ? "到着"
          : "送信中";
  function openDetails() {
    setDetails(true);
    dialogRef.current?.showModal();
  }
  return (
    <>
      <main className="terminal-app">
        <header className="masthead">
          <h1>{tcp ? "TCP接続の流れ" : "SSH接続の流れ"}</h1>
          <span className="auth-badge">{tcp ? "TCP" : "公開鍵認証"}</span>
          <nav aria-label="プロトコル">
            <a href="#/ssh" aria-current={!tcp ? "page" : undefined}>
              SSH
            </a>
            <a href="#/tcp" aria-current={tcp ? "page" : undefined}>
              TCP
            </a>
          </nav>
          <span className="counter">
            {String(index + 1).padStart(2, "0")} <small>/ {steps.length}</small>
          </span>
        </header>
        <nav className="phases" aria-label="接続の段階">
          {phases.map((phase, i) => (
            <button
              key={phase}
              aria-current={current.phase === phase ? "step" : undefined}
              onClick={() => seek(steps.findIndex((s) => s.phase === phase))}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {phase}
            </button>
          ))}
        </nav>
        <section
          className="scene"
          aria-label="通信アニメーション"
          data-step={current.id}
        >
          <div className="scene-top">
            <span>
              <i /> {tcp ? "tcp" : "ssh"} — learner@server
            </span>
            <span role="status">{status}</span>
          </div>
          <div
            className={`stage ${!finished ? "can-pause" : ""}`}
            onClick={() => {
              if (!finished && !window.getSelection()?.toString())
                setPaused((p) => !p);
            }}
          >
            <div className="actors">
              <div
                className={`actor client ${side === "client" ? "active" : ""}`}
              >
                <img className="device" src="./pixels/client.svg" alt="" />
                <strong>CLIENT</strong>
                <small>クライアント</small>
              </div>
              <div
                className={`actor server ${side === "server" ? "active" : ""}`}
              >
                <img className="device" src="./pixels/server.svg" alt="" />
                <strong>SERVER</strong>
                <small>{tcp ? "サーバー" : "SSHサーバー"}</small>
              </div>
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
            <div
              className={`callout ${side} ${local ? "local-step" : ""}`}
              aria-live="polite"
            >
              <div className="callout-meta">
                <span>{current.phase}</span>
                <span>
                  {local
                    ? "LOCAL"
                    : current.from === "client"
                      ? "CLIENT → SERVER"
                      : "SERVER → CLIENT"}
                </span>
              </div>
              {local ? (
                <div
                  className="command-terminal"
                  aria-label={
                    checking
                      ? "ホスト鍵の確認アニメーション"
                      : "端末内の操作アニメーション"
                  }
                >
                  <div className="command-line" aria-hidden="true">
                    {checking ? (
                      <code>
                        {
                          [
                            "[■□□] 指紋の照合",
                            "[■■□] 署名の検証",
                            "[■■■] 検証完了",
                          ][checkPhase]
                        }
                      </code>
                    ) : (
                      <>
                        <span className="prompt">
                          {current.id === "done" ? "" : "$ "}
                        </span>
                        <code>{typed}</code>
                        <span
                          className="typing-cursor"
                          style={{
                            opacity:
                              !entered &&
                              Math.floor((progress * duration) / 300) % 2 === 0
                                ? 1
                                : 0,
                          }}
                        >
                          ▌
                        </span>
                      </>
                    )}
                  </div>
                  <div className="enter-line" aria-hidden="true">
                    {localResult}
                  </div>
                  <div className="local-progress" aria-hidden="true">
                    <span style={{ width: `${progress * 100}%` }} />
                  </div>
                </div>
              ) : (
                <code>{current.wire.replace("SSH_MSG_", "")}</code>
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
          <div className="controls">
            <button
              aria-label="最初から"
              onClick={() => {
                setPaused(false);
                setReplay((v) => v + 1);
                seek(0);
              }}
            >
              最初から
            </button>
            <button disabled={index === 0} onClick={() => seek(index - 1)}>
              戻る
            </button>
            <button
              className="replay"
              aria-label="もう一度"
              onClick={() => {
                setPaused(false);
                setReplay((v) => v + 1);
              }}
            >
              もう一度
            </button>
            <button
              className="next"
              disabled={index === steps.length - 1}
              onClick={() => seek(index + 1)}
            >
              次へ
            </button>
            <button
              disabled={index === steps.length - 1}
              onClick={() => seek(steps.length - 1)}
            >
              最後へ
            </button>
          </div>
          <div className="progress">
            <span style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
          </div>
        </section>
        <dialog
          ref={dialogRef}
          onClose={() => setDetails(false)}
          aria-labelledby="detail-title"
        >
          <div className="dialog-head">
            <span>
              STEP {index + 1} / {steps.length}
            </span>
            <button onClick={() => dialogRef.current?.close()} autoFocus>
              閉じる ×
            </button>
          </div>
          <h2 id="detail-title">{current.title}</h2>
          <code>{current.wire}</code>
          <p>{current.description}</p>
          <p className="protection">{current.protection}</p>
          <ul>
            {current.fields.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <a href={current.source} target="_blank" rel="noreferrer">
            このステップのRFC ↗
          </a>
          <p className="model-note">
            正常系の一例です。SSHは論理メッセージ単位で、TCPセグメントとの一対一対応ではありません。入力文字・端末エコー・プロンプトをまとめ、再送や失敗系などを省略しています。
          </p>
        </dialog>
      </main>
      <details className="flow-overview">
        <summary>
          フロー全体{" "}
          <span>
            {index + 1} / {steps.length} ステップ
          </span>
        </summary>
        <nav aria-label="フロー全体のステップ">
          <p className="flow-hint">
            ステップを選ぶと、その場面に移動して一時停止します。
          </p>
          <ol>
            {steps.map((step, i) => (
              <li key={step.id}>
                <button
                  aria-current={index === i ? "step" : undefined}
                  onClick={() => {
                    setPaused(true);
                    seek(i);
                    document
                      .querySelector(".scene")
                      ?.scrollIntoView({ block: "nearest" });
                  }}
                >
                  <span className="flow-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flow-phase">{step.phase}</span>
                  <span className="flow-copy">
                    <strong>{step.title}</strong>
                    <code>{step.wire}</code>
                  </span>
                  <span className="flow-direction">
                    {step.from === step.to
                      ? "端末内"
                      : step.from === "client"
                        ? "CLIENT → SERVER"
                        : "SERVER → CLIENT"}
                  </span>
                  <span className="flow-current">
                    {index === i ? "現在" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </details>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
