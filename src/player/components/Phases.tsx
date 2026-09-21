import type { Step } from "../../domain/lesson";
export function Phases({
  steps,
  current,
  seek,
}: {
  steps: readonly Step[];
  current: Step;
  seek: (n: number) => void;
}) {
  const phases = [...new Set(steps.map((step) => step.phase))];
  return (
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
  );
}
