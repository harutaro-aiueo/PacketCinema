import { expect, it } from "vitest";
import { createCatalog } from "../../app/catalog";
import { https } from "../https";
import { tcp } from "../tcp";
import { httpBasic } from "./index";

it("challenges first, then sends Basic credentials over HTTPS", () => {
  expect(() => createCatalog([
    { protocol: tcp, publishedScenarioIds: ["handshake"] },
    { protocol: https, publishedScenarioIds: ["tls13-http11"] },
    { protocol: httpBasic, publishedScenarioIds: ["challenge-response"] },
  ])).not.toThrow();
  const steps = httpBasic.scenarios[0].steps;
  expect(steps.map((step) => step.id)).toEqual([
    "initial-get", "challenge", "prepare-credentials", "authorized-get", "authorized-200",
  ]);
  expect(steps[0]).toMatchObject({ kind: "message", from: "browser", to: "server" });
  expect(steps[1]).toMatchObject({ kind: "message", from: "server", to: "browser" });
  expect(steps[1].fields).toContain('WWW-Authenticate：Basic realm="private"');
  expect(steps[3]).toMatchObject({ kind: "message", from: "browser", to: "server" });
  expect(steps[3].fields).toContain("Authorization：Basic <Base64>");
  expect(steps[4]).toMatchObject({ kind: "message", from: "server", to: "browser" });
});
