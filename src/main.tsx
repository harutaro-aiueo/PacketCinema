import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { lessons } from "./lessons";
import { decodeView, encodeView, type ViewState } from "./model";
import "./style.css";

interface ReturnContext {
  from: ViewState;
  to: string;
}
function readReturnContext(): ReturnContext | null {
  try {
    const data = JSON.parse(
      sessionStorage.getItem("packet-atlas-return") || "null",
    );
    if (
      data &&
      lessons.some((l) => l.id === data.from?.lesson) &&
      lessons.some((l) => l.id === data.to)
    )
      return { from: decodeView(encodeView(data.from)), to: data.to };
  } catch {
    /* Storage can be disabled; in-memory navigation still works. */
  }
  return null;
}
function App() {
  const [view, setView] = useState(() => decodeView(location.hash));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [progress, setProgress] = useState(0);
  const [returnContext, setReturnContext] = useState(readReturnContext);
  const progressRef = useRef(0);
  const resetProgress = () => {
    progressRef.current = 0;
    setProgress(0);
  };
  const activeRow = useRef<HTMLButtonElement>(null);
  const lesson = lessons.find((l) => l.id === view.lesson);
  const steps = useMemo(
    () => lesson?.steps(view.auth) ?? [],
    [lesson, view.auth],
  );
  const index = Math.min(view.step, Math.max(0, steps.length - 1));
  const step = steps[index];
  const navigate = (next: ViewState) => {
    setPlaying(false);
    location.hash = encodeView(next);
    setView(next);
  };
  const update = (next: Partial<ViewState>) => {
    const v = { ...view, ...next };
    setView(v);
    history.replaceState(history.state, "", encodeView(v));
  };
  const seek = (n: number) => {
    setPlaying(false);
    resetProgress();
    update({ step: Math.max(0, Math.min(n, steps.length - 1)) });
  };
  useEffect(() => {
    const handler = () => {
      setPlaying(false);
      setView(decodeView(location.hash));
    };
    addEventListener("hashchange", handler);
    return () => removeEventListener("hashchange", handler);
  }, []);
  useEffect(resetProgress, [index, view.lesson, view.auth]);
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      progressRef.current = Math.min(
        1,
        progressRef.current + ((now - last) * speed) / 3200,
      );
      last = now;
      setProgress(progressRef.current);
      if (progressRef.current >= 1) {
        if (index >= steps.length - 1) setPlaying(false);
        else update({ step: index + 1 });
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, index, speed, view.lesson, view.auth, view.detail]);
  useEffect(() => {
    const row = activeRow.current;
    const container = row?.parentElement;
    if (row && container) {
      const a = row.getBoundingClientRect();
      const b = container.getBoundingClientRect();
      if (a.top < b.top) container.scrollTop += a.top - b.top - 8;
      else if (a.bottom > b.bottom)
        container.scrollTop += a.bottom - b.bottom + 8;
    }
  }, [index, view.lesson, view.auth]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        !lesson ||
        (e.target as HTMLElement).closest(
          "button,a,select,input,textarea,summary,[contenteditable]",
        ) ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        if (
          !playing &&
          index === steps.length - 1 &&
          progressRef.current >= 1
        ) {
          resetProgress();
          update({ step: 0 });
        }
        setPlaying((p) => !p);
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
    addEventListener("keydown", handler);
    return () => removeEventListener("keydown", handler);
  });
  function openPrerequisite(id: string) {
    const context = { from: { ...view, step: index }, to: id };
    setReturnContext(context);
    try {
      sessionStorage.setItem("packet-atlas-return", JSON.stringify(context));
    } catch {
      /* Keep the return point in memory. */
    }
    navigate({ lesson: id, step: 0, auth: "publickey", detail: view.detail });
  }
  function returnToLesson() {
    if (!returnContext) return;
    navigate(returnContext.from);
    setReturnContext(null);
    try {
      sessionStorage.removeItem("packet-atlas-return");
    } catch {
      /* No persistent return point to clear. */
    }
  }
  const canReturn = view.lesson === returnContext?.to;
  const returnTitle = lessons.find(
    (l) => l.id === returnContext?.from.lesson,
  )?.title;
  const phases = [...new Set(steps.map((s) => s.phase))];
  return (
    <div className="app">
      <header className="header">
        <a href="#/" className="brand">
          <span className="brand-icon">⇄</span> Packet Atlas
          <span className="brand-caption">PROTOCOL EXPLORER</span>
        </a>
        <span className="edition">
          通信のしくみを、ひとつずつ。 <span className="version">v0.1</span>
        </span>
      </header>
      {!lesson ? (
        <main className="catalog">
          <div className="eyebrow">INTERACTIVE NETWORK GUIDE</div>
          <h1>
            見えない通信を、
            <br />
            <span>見える理解に。</span>
          </h1>
          <p className="lead">
            メッセージをひとつずつ追いながら、
            <br />
            プロトコルの「何を」「なぜ」を学ぶ。
          </p>
          <div className="lesson-grid">
            {lessons.map((l, i) => (
              <a
                key={l.id}
                href={encodeView({
                  lesson: l.id,
                  step: 0,
                  auth: "publickey",
                  detail: false,
                })}
                className="lesson-card"
              >
                <div className="card-top">
                  <span className="eyebrow">{l.layer}</span>
                  <span className="card-number">0{i + 1}</span>
                </div>
                <h2>
                  {l.title}
                  <span>↗</span>
                </h2>
                <p>{l.subtitle}</p>
                <div className="card-footer">
                  {l.topics}
                  <span>教材を開く →</span>
                </div>
              </a>
            ))}
          </div>
          <p className="catalog-note">
            共通する処理は、共通の教材へ。SSHからTCPへ、必要なところだけ立ち寄れます。
          </p>
          {view.lesson && (
            <p role="status">
              指定された教材は見つかりません。一覧から選択してください。
            </p>
          )}
        </main>
      ) : (
        <main className="workspace">
          <nav className="breadcrumb">
            <a href="#/">教材一覧</a>
            <span>/</span>
            <span>{lesson.title}</span>
            {canReturn && (
              <button className="return-link" onClick={returnToLesson}>
                ← {returnTitle}の続きに戻る
              </button>
            )}
          </nav>
          <section className="lesson-heading">
            <div>
              <div className="eyebrow">{lesson.layer} PROTOCOL</div>
              <h1>
                {lesson.title}
                <span>{lesson.subtitle}</span>
              </h1>
            </div>
            <span className="lesson-badge">{steps.length} STEPS · 正常系</span>
          </section>
          <div className="context-bar">
            {lesson.prerequisites.length ? (
              lesson.prerequisites.map((p) => (
                <React.Fragment key={p.lesson}>
                  <span>
                    <b>前提</b> {p.label}
                  </span>
                  <button onClick={() => openPrerequisite(p.lesson)}>
                    {p.linkLabel} ↗
                  </button>
                </React.Fragment>
              ))
            ) : (
              <span>
                <b>開始条件</b> {lesson.startCondition}
              </span>
            )}
            <code>{lesson.example}</code>
          </div>
          <div className="lesson-layout">
            <section className="flow-panel" aria-label="通信フロー">
              <div className="panel-toolbar">
                <span className="panel-title">
                  通信フロー <small>SEQUENCE</small>
                </span>
                {lesson.authPhase && (
                  <label className="auth-label">
                    認証方式{" "}
                    <select
                      aria-label="認証方式"
                      value={view.auth}
                      onChange={(e) => {
                        setPlaying(false);
                        update({
                          auth: e.target.value as "publickey" | "password",
                          step: steps.findIndex(
                            (s) => s.phase === lesson.authPhase,
                          ),
                        });
                      }}
                    >
                      <option value="publickey">公開鍵認証</option>
                      <option value="password">パスワード認証</option>
                    </select>
                  </label>
                )}
              </div>
              <div className="actor-head">
                <div>
                  <span className="actor-icon">▣</span>
                  <strong>{lesson.actors[0]}</strong>
                  <small>CLIENT</small>
                </div>
                <span className="connection-label">{lesson.connection}</span>
                <div>
                  <span className="actor-icon server">▤</span>
                  <strong>{lesson.actors[1]}</strong>
                  <small>SERVER</small>
                </div>
              </div>
              <div
                className="sequence-scroll"
                role="group"
                aria-label="ステップ一覧"
              >
                {steps.map((s, i) => (
                  <button
                    key={s.id}
                    ref={i === index ? activeRow : undefined}
                    onClick={() => seek(i)}
                    className={`sequence-row ${i === index ? "current" : ""} ${i < index ? "completed" : ""}`}
                    aria-current={i === index ? "step" : undefined}
                    aria-label={`${i + 1}. ${s.title}`}
                  >
                    <span className="step-num">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="wire-label">{s.wire}</span>
                    <svg
                      viewBox="0 0 600 24"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <defs>
                        <marker
                          id={`arrow-${i}`}
                          markerWidth="6"
                          markerHeight="6"
                          refX="5"
                          refY="3"
                          orient="auto"
                        >
                          <path d="M0,0 L6,3 L0,6" fill="currentColor" />
                        </marker>
                      </defs>
                      {s.from === s.to ? (
                        <path
                          d="M115 3 H175 V19 H115"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          markerEnd={`url(#arrow-${i})`}
                        />
                      ) : (
                        <>
                          <line
                            x1={s.from === "client" ? 115 : 485}
                            x2={s.to === "server" ? 485 : 115}
                            y1="12"
                            y2="12"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            markerEnd={`url(#arrow-${i})`}
                          />
                          {i === index && !reduced && (
                            <circle
                              className="packet"
                              r="4"
                              cy="12"
                              cx={
                                s.from === "client"
                                  ? 115 + 370 * progress
                                  : 485 - 370 * progress
                              }
                            />
                          )}
                        </>
                      )}
                    </svg>
                    <span className="row-caption">
                      {s.from === s.to
                        ? "端末内の処理"
                        : `${s.from === "client" ? "Client → Server" : "Server → Client"}`}
                    </span>
                  </button>
                ))}
              </div>
              <div className="playback">
                <div className="progress-track">
                  <span
                    style={{ width: `${((index + 1) / steps.length) * 100}%` }}
                  />
                </div>
                <div className="playback-controls">
                  <button aria-label="最初に戻る" onClick={() => seek(0)}>
                    ↤
                  </button>
                  <button
                    aria-label="前のステップ"
                    disabled={index === 0}
                    onClick={() => seek(index - 1)}
                  >
                    ←
                  </button>
                  <button
                    className="play"
                    onClick={() => {
                      if (
                        !playing &&
                        index === steps.length - 1 &&
                        progressRef.current >= 1
                      ) {
                        resetProgress();
                        update({ step: 0 });
                      }
                      setPlaying(!playing);
                    }}
                  >
                    {playing ? "Ⅱ 停止" : "▶ 再生"}
                  </button>
                  <button
                    aria-label="次のステップ"
                    disabled={index === steps.length - 1}
                    onClick={() => seek(index + 1)}
                  >
                    →
                  </button>
                  <span className="counter">
                    {String(index + 1).padStart(2, "0")}{" "}
                    <span>/ {steps.length}</span>
                  </span>
                  <label className="speed">
                    速度{" "}
                    <select
                      aria-label="再生速度"
                      value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value))}
                    >
                      <option value="0.5">0.5×</option>
                      <option value="1">1×</option>
                      <option value="1.5">1.5×</option>
                      <option value="2">2×</option>
                    </select>
                  </label>
                </div>
              </div>
            </section>
            <aside className="explanation">
              <div className="tabs">
                <button
                  className={!view.detail ? "selected" : ""}
                  onClick={() => update({ detail: false })}
                >
                  概要
                </button>
                <button
                  className={view.detail ? "selected" : ""}
                  onClick={() => update({ detail: true })}
                >
                  技術的な詳細
                </button>
              </div>
              <div className="explanation-content" aria-live="polite">
                <div className="eyebrow">
                  STEP {String(index + 1).padStart(2, "0")}{" "}
                  <span className="phase-label">{step.phase}</span>
                </div>
                <h2>{step.title}</h2>
                <p className="description">{step.description}</p>
                <div
                  className={`protection ${step.protection === "暗号化・完全性保護あり" ? "protected" : ""}`}
                >
                  <span>◇</span>
                  <div>
                    <small>このメッセージの保護状態</small>
                    <strong>{step.protection}</strong>
                  </div>
                </div>
                {step.states && (
                  <div className="states">
                    {step.states.map((state, i) => (
                      <div key={i}>
                        <small>{lesson.actors[i]} · 処理後</small>
                        <code>{state}</code>
                      </div>
                    ))}
                  </div>
                )}
                {view.detail && (
                  <div className="technical">
                    <h3>MESSAGE</h3>
                    <code>{step.wire}</code>
                    <h3>主要な項目</h3>
                    <ul>
                      {step.fields.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    <a href={step.source} target="_blank" rel="noreferrer">
                      対応するRFCを読む ↗
                    </a>
                  </div>
                )}
                <div className="phase-navigation">
                  <h3>学習のステップ</h3>
                  {phases.map((p, i) => (
                    <button
                      key={p}
                      className={p === step.phase ? "active" : ""}
                      onClick={() =>
                        seek(steps.findIndex((s) => s.phase === p))
                      }
                    >
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      {p}
                      <span>{p === step.phase ? "●" : "↗"}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
          <div className="under-player">
            <span>
              ← → ステップ移動 · Space 再生 /
              停止（操作部にフォーカスがないとき）
            </span>
            <label>
              <input
                type="checkbox"
                checked={reduced}
                onChange={(e) => setReduced(e.target.checked)}
              />{" "}
              動きを減らす
            </label>
          </div>
          <details className="notes">
            <summary>この教材のモデルと省略事項</summary>
            {lesson.notes.map((n) => (
              <p key={n}>{n}</p>
            ))}
          </details>
        </main>
      )}
      <footer>
        <span>PACKET ATLAS</span>
        <span>ひとつのやり取りから、通信の全体像へ。</span>
      </footer>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
