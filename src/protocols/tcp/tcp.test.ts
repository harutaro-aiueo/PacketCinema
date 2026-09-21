import { expect, it } from "vitest";
import { createConnection, createDisconnection } from "./index";
it("keeps TCP sequence numbers and states", () => {
  const steps = createConnection();
  expect(steps.map((s) => s.wire)).toEqual(["SYN", "SYN + ACK", "ACK"]);
  expect(steps[1].fields).toContain("SEQ=5000 / ACK=1001");
  expect(steps[2].fields).toContain("SEQ=1001 / ACK=5001");
  expect(steps[2].states).toEqual({
    client: "ESTABLISHED",
    server: "ESTABLISHED",
  });
});
it("composes independent fragments with remapped nodes and IDs", () => {
  const options = {
    nodes: { client: "browser", server: "proxy" },
    idPrefix: "upstream-",
    phase: "上流接続",
  };
  const steps = createConnection(options);
  expect(steps[0]).toMatchObject({
    id: "upstream-syn",
    phase: "上流接続",
    from: "browser",
    to: "proxy",
    states: { browser: "SYN-SENT", proxy: "SYN-RECEIVED" },
  });
  steps[0].states && Object.assign(steps[0].states, { browser: "changed" });
  (steps[0].fields as string[]).push("changed");
  expect(createConnection()[0].states?.client).toBe("SYN-SENT");
  expect(createConnection(options)[0].fields).not.toContain("changed");
  const close = createDisconnection(options);
  expect(close.map((s) => s.id)).toEqual([
    "upstream-fin-c",
    "upstream-fin-ack",
    "upstream-fin-s",
    "upstream-last-ack",
  ]);
  expect(close[0]).toMatchObject({
    from: "browser",
    to: "proxy",
    phase: "上流接続",
  });
});
