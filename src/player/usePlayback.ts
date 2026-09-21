import { useEffect, useRef, useState } from "react";
import type { Step } from "../domain/lesson";
export const stepDuration = (step: Step) =>
  step.kind === "local" ? 3200 : 6000;
export function usePlayback({
  identity,
  index,
  steps,
  details,
  onSeek,
}: {
  identity: string;
  index: number;
  steps: readonly Step[];
  details: boolean;
  onSeek: (index: number) => void;
}) {
  const [progress, setProgress] = useState(0);
  const [replay, setReplay] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressRef = useRef(0);
  const seekRef = useRef(onSeek);
  seekRef.current = onSeek;
  const duration = stepDuration(steps[index]);
  const finished = index === steps.length - 1 && progress >= 1;
  useEffect(() => {
    progressRef.current = 0;
    setProgress(0);
  }, [identity, index, replay]);
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
      else if (index < steps.length - 1) seekRef.current(index + 1);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [identity, index, replay, paused, details, duration, steps.length]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        details ||
        (event.target as HTMLElement).closest(
          "button,a,input,select,summary",
        ) ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return;
      if (event.code === "Space") {
        event.preventDefault();
        if (!finished) setPaused((value) => !value);
      }
      if (event.code === "ArrowRight") {
        event.preventDefault();
        seekRef.current(index + 1);
      }
      if (event.code === "ArrowLeft") {
        event.preventDefault();
        seekRef.current(index - 1);
      }
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [details, finished, index]);
  return {
    progress,
    paused,
    finished,
    duration,
    setPaused,
    replay: () => {
      setPaused(false);
      setReplay((value) => value + 1);
    },
  };
}
