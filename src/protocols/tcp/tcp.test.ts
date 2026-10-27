import { expect, it } from "vitest";
import { createConnection, createDisconnection, tcp } from "./index";
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
it("keeps data sequence and ACK numbers across timeout retransmission", () => {
  const steps = tcp.scenarios.find((scenario) => scenario.id === "data-retransmission")!.steps;
  expect(steps.map((step) => step.id)).toEqual([
    "syn", "syn-ack", "ack", "data-first", "ack-first",
    "data-lost", "timeout", "data-retry", "ack-retry",
  ]);
  expect(steps[5]).toMatchObject({
    kind: "message", delivery: "dropped", from: "client", to: "server",
    states: { client: "ACK待ち", server: "ESTABLISHED" },
  });
  expect(steps[5].fields).toContain("SEQ=1005");
  expect(steps[7].fields).toContain("SEQ=1005（再送）");
  expect(steps[8].fields).toContain("ACK=1009");
});
it("stops new data at zero receive window and resumes after an update", () => {
  const steps = tcp.scenarios.find((scenario) => scenario.id === "flow-control")!.steps;
  expect(steps.map((step) => step.id)).toEqual([
    "window-four", "fill-window", "window-zero", "pause-send",
    "app-read", "window-update", "send-after-update", "ack-after-update",
  ]);
  expect(steps[0].fields).toContain("受信可能：1001〜1004");
  expect(steps[2].fields).toContain("広告ウィンドウ=0バイト");
  expect(steps[3]).toMatchObject({ kind: "local", node: "client" });
  expect(steps[5]).toMatchObject({ kind: "message", from: "server", to: "client" });
  expect(steps[5].fields).toContain("ACK=1005（変化なし）");
  expect(steps[6].fields).toContain("SEQ=1005");
  expect(steps[7].fields).toContain("ACK=1009：1005〜1008を確認");
});
it("closes each TCP direction separately and retains TIME-WAIT", () => {
  const steps = tcp.scenarios.find((scenario) => scenario.id === "normal-close")!.steps;
  expect(steps.map((step) => step.id)).toEqual([
    "client-fin", "client-fin-ack", "server-data", "server-data-ack",
    "server-fin", "server-fin-ack", "time-wait-end",
  ]);
  expect(steps[0].states).toEqual({ client: "FIN-WAIT-1", server: "CLOSE-WAIT" });
  expect(steps[1].states).toEqual({ client: "FIN-WAIT-2", server: "CLOSE-WAIT" });
  expect(steps[2]).toMatchObject({ kind: "message", from: "server", to: "client" });
  expect(steps[3].fields).toContain("ACK=5005");
  expect(steps[4].fields).toContain("SEQ=5005");
  expect(steps[5].fields).toContain("ACK=5006");
  expect(steps[5].states).toEqual({ client: "TIME-WAIT", server: "CLOSED" });
  expect(steps[6].states).toEqual({ client: "CLOSED", server: "CLOSED" });
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
