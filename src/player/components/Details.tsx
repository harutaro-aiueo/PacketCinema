import type { RefObject } from "react";
import type { Step } from "../../domain/lesson";
export function Details({
  dialogRef,
  current,
  index,
  total,
  notes,
  onClose,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  current: Step;
  index: number;
  total: number;
  notes: readonly string[];
  onClose: () => void;
}) {
  return (
    <dialog ref={dialogRef} onClose={onClose} aria-labelledby="detail-title">
      <div className="dialog-head">
        <span>
          STEP {index + 1} / {total}
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
        このステップの出典 ↗
      </a>
      <p className="model-note">{notes.join(" ")}</p>
    </dialog>
  );
}
