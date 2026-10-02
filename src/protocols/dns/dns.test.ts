import { expect, it } from "vitest";
import { dns } from "./index";
import { createCatalog } from "../../app/catalog";

const scenario = dns.scenarios[0];
const steps = scenario.steps;

it("publishes a direct, non-recursive authoritative A lookup", () => {
  expect(() =>
    createCatalog([
      { protocol: dns, publishedScenarioIds: ["authoritative-a"] },
    ]),
  ).not.toThrow();
  expect(steps.map((step) => step.id)).toEqual([
    "choose-question",
    "query",
    "lookup-zone",
    "answer",
    "use-answer",
  ]);
  expect(steps[1]).toMatchObject({
    kind: "message",
    from: "client",
    to: "authority",
  });
  expect(steps[1].wire).toContain("RD=0");
  expect(steps[3]).toMatchObject({
    kind: "message",
    from: "authority",
    to: "client",
  });
  expect(steps[3].fields).toContain("QR=1 / ID=0x1234 / AA=1 / RCODE=0");
  expect(steps[3].fields).toContain("QDCOUNT=1 / ANCOUNT=1");
});

it("uses the same question and transaction ID in the successful answer", () => {
  expect(steps[0].fields).toEqual([
    "QNAME=www.example.test.",
    "QTYPE=A",
    "QCLASS=IN",
  ]);
  expect(steps[1].wire).toContain("ID=0x1234");
  expect(steps[3].wire).toContain("ID=0x1234");
  expect(steps[3].fields).toContain("www.example.test. IN A 192.0.2.10");
  expect(steps[3].fields).toContain("TTL=300秒");
  expect(steps[4].wire).toContain("192.0.2.10");
});
