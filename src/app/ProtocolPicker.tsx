import { useEffect, useRef, useState } from "react";
import type { ProtocolDefinition } from "../domain/lesson";
import "./protocol-picker.css";

const normalize = (value: string) =>
  value.normalize("NFKC").toLocaleLowerCase();

export function ProtocolPicker({
  open,
  catalog,
  currentId,
  onClose,
}: {
  open: boolean;
  catalog: readonly ProtocolDefinition[];
  currentId: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (open) {
      setQuery("");
      dialog.current?.showModal();
      search.current?.focus();
    } else {
      dialog.current?.close();
    }
  }, [open]);
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const results = catalog.filter((protocol) => {
    const text = normalize(
      [
        protocol.id,
        protocol.title,
        protocol.description ?? "",
        ...(protocol.keywords ?? []),
        ...protocol.scenarios.map((scenario) => scenario.title),
      ].join(" "),
    );
    return terms.every((term) => text.includes(term));
  });
  function close() {
    dialog.current?.close();
  }
  return (
    <dialog
      ref={dialog}
      className="protocol-picker"
      aria-labelledby="protocol-picker-title"
      onClose={onClose}
    >
      <div className="picker-heading">
        <h2 id="protocol-picker-title">教材を探す</h2>
        <button
          type="button"
          onClick={close}
          aria-label="プロトコル選択を閉じる"
        >
          閉じる ×
        </button>
      </div>
      <label htmlFor="protocol-search">名前や用途で教材を検索</label>
      <input
        ref={search}
        id="protocol-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="例：SSH、リモート接続"
        autoComplete="off"
      />
      <p className="picker-count" aria-live="polite">
        {results.length} 件の教材
      </p>
      <nav className="picker-results" aria-label="プロトコル一覧">
        {results.map((protocol) => (
          <a
            key={protocol.id}
            href={"#/" + protocol.id}
            aria-current={protocol.id === currentId ? "page" : undefined}
            onClick={(event) => {
              if (
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              if (protocol.id === currentId) event.preventDefault();
              close();
            }}
          >
            <span className="picker-name">
              {protocol.title}
              {protocol.id === currentId && <small>表示中</small>}
            </span>
            <span className="picker-description">
              {protocol.description ??
                protocol.scenarios.find(
                  (scenario) => scenario.id === protocol.defaultScenarioId,
                )?.title}
            </span>
          </a>
        ))}
        {results.length === 0 && (
          <p className="picker-empty">
            教材が見つかりません。別の名前や用途で検索してください。
          </p>
        )}
      </nav>
    </dialog>
  );
}
