import { expect, it } from "vitest";
import { createCatalog } from "../../app/catalog";
import { tcp } from "../tcp";
import { pop3 } from "./index";

it("authenticates, retrieves, marks deletion, then updates on QUIT", () => {
  expect(() => createCatalog([
    { protocol: tcp, publishedScenarioIds: ["handshake"] },
    { protocol: pop3, publishedScenarioIds: ["retrieve-one"] },
  ])).not.toThrow();
  const steps = pop3.scenarios[0].steps;
  expect(steps.map((step) => step.id)).toEqual([
    "greeting", "user", "user-ok", "pass", "authenticated", "stat", "stat-ok",
    "retr", "message", "dele", "marked", "quit", "updated",
  ]);
  expect(steps[0]).toMatchObject({ kind: "message", from: "server", to: "client" });
  expect(steps[3].wire).toBe("PASS ********");
  expect(steps[4].fields).toContain("状態：TRANSACTION");
  expect(steps[8].fields).toContain("終端：<CRLF>.<CRLF>");
  expect(steps[10].description).toContain("QUIT後");
  expect(steps[12].fields).toContain("状態：UPDATE");
});
