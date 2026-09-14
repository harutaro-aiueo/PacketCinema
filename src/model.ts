export type Actor = "client" | "server";
export type Auth = "publickey" | "password";
export interface Step {
  id: string;
  phase: string;
  title: string;
  wire: string;
  from: Actor;
  to: Actor;
  description: string;
  fields: string[];
  protection: string;
  source: string;
  states?: [string, string];
}
export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  layer: string;
  actors: [string, string];
  prerequisites: { lesson: string; label: string; linkLabel: string }[];
  topics: string;
  example: string;
  connection: string;
  startCondition?: string;
  authPhase?: string;
  notes: string[];
  steps: (auth: Auth) => Step[];
}
export interface ViewState {
  lesson: string;
  step: number;
  auth: Auth;
  detail: boolean;
}
export function encodeView(v: ViewState) {
  return `#/${v.lesson}?step=${v.step}&auth=${v.auth}&detail=${v.detail ? 1 : 0}`;
}
export function decodeView(hash: string): ViewState {
  const [path, query] = hash.replace(/^#\/?/, "").split("?");
  const p = new URLSearchParams(query);
  const n = Number(p.get("step") || 0);
  return {
    lesson: path || "",
    step: Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0,
    auth: p.get("auth") === "password" ? "password" : "publickey",
    detail: p.get("detail") === "1",
  };
}
