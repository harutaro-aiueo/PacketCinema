import { expect, it } from "vitest";
import { httpCookie } from "./index";

it("stores a Secure cookie before sending only its name and value", () => {
  const steps = httpCookie.scenarios[0].steps;
  expect(steps.map((step) => step.id)).toEqual([
    "initial-get", "set-cookie", "store-cookie", "cookie-get", "personalized-200",
  ]);
  expect(steps[0]).toMatchObject({ kind: "message", from: "browser", to: "server" });
  expect(steps[1]).toMatchObject({ kind: "message", from: "server", to: "browser" });
  expect(steps[1].wire).toContain("Set-Cookie: theme=dark; Path=/; Secure");
  expect(steps[2]).toMatchObject({ kind: "local", node: "browser" });
  expect(steps[3]).toMatchObject({ kind: "message", from: "browser", to: "server" });
  expect(steps[3].wire).toContain("Cookie: theme=dark");
  expect(steps[3].wire).not.toContain("Path=");
  expect(steps[3].wire).not.toContain("Secure");
});
