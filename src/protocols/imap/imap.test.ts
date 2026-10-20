import { expect, it } from "vitest";
import { createCatalog } from "../../app/catalog";
import { imap } from "./index";
import { tcp } from "../tcp";

it("selects the mailbox, fetches by UID without marking read, then logs out", () => {
  expect(() => createCatalog([
    { protocol: tcp, publishedScenarioIds: ["handshake"] },
    { protocol: imap, publishedScenarioIds: ["select-and-fetch"] },
  ])).not.toThrow();
  const steps = imap.scenarios[0].steps;
  expect(steps.map((step) => step.id)).toEqual(["select", "selected", "uid-fetch", "fetched", "logout", "bye"]);
  expect(steps.map((step) => step.kind === "message" && `${step.from}->${step.to}`)).toEqual([
    "client->server", "server->client", "client->server", "server->client", "client->server", "server->client",
  ]);
  expect(steps[1].fields).toContain("UIDVALIDITY：7（例）");
  expect(steps[2].wire).toContain("UID FETCH 42 (UID BODY.PEEK[])");
  expect(steps[3].wire).toContain("UID 42");
  expect(steps[5].wire).toContain("A003 OK");
});
