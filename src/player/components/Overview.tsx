import { direction, type Step, type LessonNode } from "../../domain/lesson";
export function Overview({
  steps,
  nodes,
  index,
  seek,
  pause,
}: {
  steps: readonly Step[];
  nodes: readonly LessonNode[];
  index: number;
  seek: (n: number) => void;
  pause: () => void;
}) {
  return (
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
                  pause();
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
                  {step.kind === "local" ? "端末内" : direction(step, nodes)}
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
  );
}
