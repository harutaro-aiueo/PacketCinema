import { expect, it } from "vitest";
import { ssh } from "./index";
for (const scenario of ssh.scenarios) {
  it(scenario.id + ": authenticates after both NEWKEYS messages", () => {
    const steps = scenario.steps;
    const index = (id: string) => steps.findIndex((step) => step.id === id);
    const auth = index(
      scenario.id === "exec-password" ? "password" : "key-sign",
    );
    expect(index("newkeys-c")).toBeLessThan(auth);
    expect(index("newkeys-s")).toBeLessThan(auth);
    expect(steps.find((step) => step.id === "newkeys-s")?.protection).toBe(
      "暗号化前",
    );
    expect(steps.find((step) => step.id === "host-check")?.kind).toBe("local");
    expect(
      steps
        .filter((step) => step.phase.includes("認証"))
        .every((step) => step.protection === "暗号化・完全性保護あり"),
    ).toBe(true);
    expect(index("password") >= 0).toBe(scenario.id === "exec-password");
    expect(index("key-sign") >= 0).toBe(scenario.id !== "exec-password");
  });
}
it("interactive shell keeps all 40 steps and closes SSH before TCP", () => {
  const steps = ssh.scenarios.find((s) => s.id === "interactive")!.steps;
  const index = (id: string) => steps.findIndex((step) => step.id === id);
  expect(steps).toHaveLength(40);
  expect(index("shell-ok")).toBeLessThan(index("whoami"));
  expect(index("output")).toBeLessThan(index("exit-data"));
  expect(index("close-c")).toBeLessThan(index("disconnect"));
  expect(index("disconnect")).toBeLessThan(index("fin-c"));
  expect(steps.at(-1)?.id).toBe("done");
});
it("exec scenarios refer to TCP without embedding its handshake", () => {
  for (const scenario of ssh.scenarios.filter((s) =>
    s.id.startsWith("exec-"),
  )) {
    expect(scenario.prerequisites[0].protocol).toBe("tcp");
    expect(scenario.steps.some((s) => s.wire === "SYN")).toBe(false);
  }
});
