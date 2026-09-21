import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import type { Step } from "../../src/domain/lesson";
import { ssh } from "../../src/protocols/ssh";
import { tcp } from "../../src/protocols/tcp";
const baseline = JSON.parse(
  readFileSync(new URL("../fixtures/baseline.json", import.meta.url), "utf8"),
);
const cases = {
  ssh: ssh.scenarios[0].steps,
  tcp: tcp.scenarios[0].steps,
  execPublickey: ssh.scenarios[1].steps,
  execPassword: ssh.scenarios[2].steps,
};
for (const [name, steps] of Object.entries(cases)) {
  it(name + ": preserves every original step and its content", () => {
    expect(steps.map((step) => step.id)).toEqual(baseline[name].ids);
    const canonical = steps.map((s: Step) => ({
      id: s.id,
      phase: s.phase,
      title: s.title,
      wire: s.wire,
      from: s.kind === "local" ? s.node : s.from,
      to: s.kind === "local" ? s.node : s.to,
      description: s.description,
      fields: s.fields,
      protection: s.protection,
      source: s.source,
      states: s.states ? [s.states.client, s.states.server] : undefined,
    }));
    expect(
      createHash("sha256").update(JSON.stringify(canonical)).digest("hex"),
    ).toBe(baseline[name].contentHash);
  });
}
