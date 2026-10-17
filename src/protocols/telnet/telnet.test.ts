import { expect, it } from "vitest";
import { createCatalog } from "../../app/catalog";
import { tcp } from "../tcp";
import { telnet } from "./index";

it("negotiates remote echo before returning input over the opposite direction", () => {
  expect(() => createCatalog([
    { protocol: tcp, publishedScenarioIds: ["handshake"] },
    { protocol: telnet, publishedScenarioIds: ["remote-echo"] },
  ])).not.toThrow();
  const steps = telnet.scenarios[0].steps;
  expect(steps.map((step) => step.id)).toEqual(["will-echo", "do-echo", "input", "echo"]);
  expect(steps.map((step) => step.kind === "message" && `${step.from}->${step.to}`)).toEqual([
    "server->client", "client->server", "client->server", "server->client",
  ]);
  expect(steps[0].wire).toBe("IAC WILL ECHO");
  expect(steps[1].wire).toBe("IAC DO ECHO");
  expect(steps[2].wire).toBe(steps[3].wire);
});
