import { expect, it } from "vitest";
import { decodeView, encodeView, resolveView } from "./index";
import { catalog, createCatalog } from "../catalog";
import { example } from "../../../tests/fixtures/example";
it("keeps old URLs and ignores legacy auth/detail inputs", () => {
  const view = resolveView(
    decodeView("#/ssh?step=12&auth=password&detail=1"),
    catalog,
    "ssh",
  );
  expect(view.scenario.id).toBe("interactive");
  expect(view.index).toBe(12);
  expect(
    encodeView(
      { protocol: "ssh", scenario: "interactive", step: 12 },
      "interactive",
    ),
  ).toBe("#/ssh?step=12");
});
it("falls back and clamps invalid inputs", () => {
  for (const value of ["NaN", "Infinity", "-4"])
    expect(decodeView("#/tcp?step=" + value).step).toBe(0);
  expect(decodeView("#/tcp?step=1.8").step).toBe(1);
  expect(resolveView(decodeView("#/missing"), catalog, "ssh").protocol.id).toBe(
    "ssh",
  );
  expect(
    resolveView(
      decodeView("#/ssh?scenario=exec-password&step=999"),
      catalog,
      "ssh",
    ).index,
  ).toBe(39);
  expect(
    resolveView(decodeView("#/tcp?scenario=bad&step=999"), catalog, "ssh")
      .index,
  ).toBe(2);
});
it("roundtrips a non-default scenario and preserves its step", () => {
  const entries = createCatalog([
    { protocol: example, publishedScenarioIds: ["roundtrip", "alternate"] },
  ]);
  const original = { protocol: "example", scenario: "alternate", step: 1 };
  const view = resolveView(
    decodeView(encodeView(original, "roundtrip")),
    entries,
    "example",
  );
  expect(view.scenario.id).toBe("alternate");
  expect(view.index).toBe(1);
});
