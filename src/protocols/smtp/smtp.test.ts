import { expect, it } from "vitest";
import { createCatalog } from "../../app/catalog";
import { tcp } from "../tcp";
import { smtp } from "./index";

it("accepts a single mail transaction before closing the session", () => {
  expect(() => createCatalog([
    { protocol: tcp, publishedScenarioIds: ["handshake"] },
    { protocol: smtp, publishedScenarioIds: ["one-message"] },
  ])).not.toThrow();
  const steps = smtp.scenarios[0].steps;
  expect(steps.map((step) => step.id)).toEqual([
    "greeting", "ehlo", "ehlo-ok", "mail", "mail-ok", "rcpt", "rcpt-ok",
    "data", "data-ready", "content", "accepted", "quit", "bye",
  ]);
  expect(steps[0]).toMatchObject({ kind: "message", from: "receiver", to: "sender" });
  expect(steps[3].wire).toBe("MAIL FROM:<alice@example.net>");
  expect(steps[5].wire).toBe("RCPT TO:<bob@example.org>");
  expect(steps[8]).toMatchObject({ kind: "message", from: "receiver", to: "sender", wire: "354 Start mail input" });
  expect(steps[9].fields).toContain("終端：<CRLF>.<CRLF>");
  expect(steps[10].wire).toBe("250 OK");
  expect(steps[12].wire).toContain("221");
});
