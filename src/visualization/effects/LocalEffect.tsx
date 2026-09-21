import type { LocalEffect as Effect } from "../../domain/lesson";
export function LocalEffect({
  effect,
  progress,
  duration,
}: {
  effect: Effect;
  progress: number;
  duration: number;
}) {
  const entered = progress * duration >= 2400;
  const stage =
    effect.kind === "stages"
      ? effect.stages[
          Math.min(
            effect.stages.length - 1,
            Math.floor(progress * effect.stages.length),
          )
        ]
      : undefined;
  const typed =
    effect.kind !== "stages"
      ? effect.text.slice(
          0,
          Math.floor(
            Math.min(1, (progress * duration) / 2000) * effect.text.length,
          ),
        )
      : "";
  return (
    <div className="command-terminal" aria-label={effect.label}>
      <div className="command-line" aria-hidden="true">
        {effect.kind === "stages" ? (
          <code>{stage?.text}</code>
        ) : (
          <>
            <span className="prompt">{effect.prompt}</span>
            <code>{typed}</code>
            <span
              className="typing-cursor"
              style={{
                opacity:
                  !entered && Math.floor((progress * duration) / 300) % 2 === 0
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
        {effect.kind === "stages"
          ? stage?.status
          : entered
            ? effect.complete
            : effect.pending}
      </div>
      <div className="local-progress" aria-hidden="true">
        <span style={{ width: progress * 100 + "%" }} />
      </div>
    </div>
  );
}
