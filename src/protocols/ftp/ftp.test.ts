import { expect, it } from "vitest";
import { createCatalog } from "../../app/catalog";
import { tcp } from "../tcp";
import { ftp } from "./index";

it("uses separate control and passive data connections for one retrieval", () => {
  expect(() => createCatalog([
    { protocol: tcp, publishedScenarioIds: ["handshake"] },
    { protocol: ftp, publishedScenarioIds: ["passive-retrieve"] },
  ])).not.toThrow();
  const steps = ftp.scenarios[0].steps;
  expect(steps.map((step) => step.id)).toEqual([
    "pasv", "pasv-reply", "retr", "preliminary", "data-connect",
    "file", "data-close", "complete", "quit", "goodbye",
  ]);
  expect(steps[1].wire).toContain("195,80");
  expect(steps[4]).toMatchObject({ kind: "message", from: "client", to: "server" });
  expect(steps[5].protection).toContain("データ接続");
  expect(steps[7].protection).toContain("制御接続");
  expect(steps[7].wire).toMatch(/^226 /);
});
