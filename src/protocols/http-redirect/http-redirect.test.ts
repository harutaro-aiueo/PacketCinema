import { expect, it } from "vitest";
import { createCatalog } from "../../app/catalog";
import { tcp } from "../tcp";
import { httpRedirect } from "./index";

it("uses 303 to retrieve a POST result with GET without resending the body", () => {
  expect(() => createCatalog([
    { protocol: tcp, publishedScenarioIds: ["handshake"] },
    { protocol: httpRedirect, publishedScenarioIds: ["post-see-other"] },
  ])).not.toThrow();
  const steps = httpRedirect.scenarios[0].steps;
  expect(steps.map((step) => step.id)).toEqual([
    "post", "register", "see-other", "follow-get", "result-200",
  ]);
  expect(steps[0]).toMatchObject({ kind: "message", from: "browser", to: "server" });
  expect(steps[2]).toMatchObject({ kind: "message", from: "server", to: "browser" });
  expect(steps[2].fields).toContain("Location：/result");
  expect(steps[3].fields).toContain("POST本文：再送しない");
  expect(steps[3].wire).toBe("GET /result HTTP/1.1");
});
