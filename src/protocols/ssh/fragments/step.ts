import type { Step, StepContent, LocalEffect } from "../../../domain/lesson";
const typing = (
  text: string,
  complete = "↵ Enter · 入力を送信へ",
): LocalEffect => ({
  kind: "typing",
  text,
  prompt: "$ ",
  pending: "コマンドを入力中…",
  complete,
  label: "端末内の操作アニメーション",
});
const effects: Record<string, LocalEffect> = {
  command: typing("ssh learner@server", "↵ Enter · TCP接続へ"),
  "whoami-input": typing("whoami"),
  "exit-input": typing("exit"),
  "host-check": {
    kind: "stages",
    label: "ホスト鍵の確認アニメーション",
    stages: [
      { text: "[■□□] 指紋の照合", status: "信頼できる指紋と照合中…" },
      { text: "[■■□] 署名の検証", status: "ホスト鍵の署名を検証中…" },
      { text: "[■■■] 検証完了", status: "✓ 確認完了" },
    ],
  },
  done: {
    kind: "result",
    text: "Connection closed.",
    prompt: "",
    pending: "セッションを終了しています…",
    complete: "$ ローカル端末に戻りました",
    label: "端末内の操作アニメーション",
  },
};
// Private authoring helper: consumers receive explicit step kinds.
export function makeStep(
  input: StepContent & { from: string; to: string },
): Step {
  const { from, to, ...content } = input;
  const displayWire = content.wire.replace("SSH_MSG_", "");
  if (from !== to)
    return { ...content, displayWire, kind: "message", from, to };
  const effect = effects[content.id];
  if (!effect) throw new Error("Missing SSH local effect: " + content.id);
  return { ...content, displayWire, kind: "local", node: from, effect };
}
export function s(
  id: string,
  phase: string,
  title: string,
  wire: string,
  from: string,
  to: string,
  description: string,
  fields: string[],
  protection: string,
  source: string,
): Step {
  return makeStep({
    id,
    phase,
    title,
    wire,
    from,
    to,
    description,
    fields,
    protection,
    source,
  });
}
