import { useEffect, useRef, useState } from "react";
import type { ProtocolDefinition } from "../domain/lesson";
import { catalog as defaultCatalog } from "./catalog";
import { decodeView, encodeView, resolveView } from "./routing";
import { usePlayback } from "../player/usePlayback";
import { Controls } from "../player/components/Controls";
import { Details } from "../player/components/Details";
import { Overview } from "../player/components/Overview";
import { Phases } from "../player/components/Phases";
import { ProtocolPicker } from "./ProtocolPicker";
import { Home } from "./Home";
import { Scene } from "../visualization/Scene";
function LessonPlayer({
  catalog = defaultCatalog,
  defaultProtocolId = "ssh",
}: {
  catalog?: readonly ProtocolDefinition[];
  defaultProtocolId?: string;
}) {
  const [view, setView] = useState(() => decodeView(location.hash));
  const { protocol, scenario, index } = resolveView(
    view,
    catalog,
    defaultProtocolId,
  );
  const steps = scenario.steps,
    current = steps[index];
  const [details, setDetails] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  function seek(n: number) {
    const next = {
      protocol: protocol.id,
      scenario: scenario.id,
      step: Math.max(0, Math.min(n, steps.length - 1)),
    };
    setView(next);
    history.replaceState(
      null,
      "",
      encodeView(next, protocol.defaultScenarioId),
    );
  }
  const playback = usePlayback({
    identity: protocol.id + "/" + scenario.id,
    index,
    steps,
    details: details || pickerOpen,
    onSeek: seek,
  });
  useEffect(() => {
    const handler = () => setView(decodeView(location.hash));
    addEventListener("hashchange", handler);
    return () => removeEventListener("hashchange", handler);
  }, []);
  return (
    <>
      <main className="terminal-app">
        <header className="masthead">
          <a className="home-back" href="#/" aria-label="トップページへ戻る">
            ← <span>トップ</span>
          </a>
          <h1>{scenario.title}</h1>
          <span className="auth-badge">{scenario.badge}</span>
          <button
            type="button"
            className="protocol-trigger"
            aria-label="プロトコルを探す"
            aria-haspopup="dialog"
            onClick={() => setPickerOpen(true)}
          >
            教材を探す
          </button>
          <span className="counter">
            {String(index + 1).padStart(2, "0")} <small>/ {steps.length}</small>
          </span>
        </header>
        <Phases steps={steps} current={current} seek={seek} />
        <Scene
          scenario={scenario}
          current={current}
          {...playback}
          onTogglePause={() => playback.setPaused((value) => !value)}
          openDetails={() => {
            setDetails(true);
            dialogRef.current?.showModal();
          }}
        >
          <Controls
            index={index}
            total={steps.length}
            seek={seek}
            replay={playback.replay}
          />
        </Scene>
        <Details
          dialogRef={dialogRef}
          current={current}
          index={index}
          total={steps.length}
          notes={scenario.notes}
          onClose={() => setDetails(false)}
        />
      </main>
      <ProtocolPicker
        open={pickerOpen}
        catalog={catalog}
        currentId={protocol.id}
        onClose={() => setPickerOpen(false)}
      />
      <Overview
        steps={steps}
        nodes={scenario.nodes}
        index={index}
        seek={seek}
        pause={() => playback.setPaused(true)}
      />
    </>
  );
}

export function App(props: {
  catalog?: readonly ProtocolDefinition[];
  defaultProtocolId?: string;
}) {
  const [hash, setHash] = useState(() => location.hash);
  useEffect(() => {
    const onHashChange = () => setHash(location.hash);
    addEventListener("hashchange", onHashChange);
    return () => removeEventListener("hashchange", onHashChange);
  }, []);
  return ["", "#", "#/"].includes(hash) ? (
    <Home catalog={props.catalog ?? defaultCatalog} />
  ) : (
    <LessonPlayer {...props} />
  );
}
