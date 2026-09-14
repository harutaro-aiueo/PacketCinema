import { describe, expect, it } from "vitest";
import { lessons } from "./lessons";
import { decodeView, encodeView } from "./model";
describe("教材の整合性", () => {
  it("全参照が実在し、各方式のステップIDと必須情報が有効", () => {
    const ids = lessons.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const lesson of lessons) {
      for (const p of lesson.prerequisites) expect(ids).toContain(p.lesson);
      for (const auth of ["publickey", "password"] as const) {
        const steps = lesson.steps(auth);
        expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
        for (const s of steps) {
          expect(s.description.length).toBeGreaterThan(20);
          expect(s.fields.length).toBeGreaterThan(0);
          expect(new URL(s.source).hostname).toBe("www.rfc-editor.org");
        }
      }
    }
  });
  it("SSHがTCPを参照し、ハンドシェイクを複製しない", () => {
    const ssh = lessons[0];
    expect(ssh.prerequisites[0].lesson).toBe("tcp");
    expect(ssh.steps("publickey").some((s) => s.wire === "SYN")).toBe(false);
  });
  it("認証は双方向NEWKEYSの後。ホスト確認はローカル処理", () => {
    for (const auth of ["publickey", "password"] as const) {
      const steps = lessons[0].steps(auth);
      const authStart = steps.findIndex((s) => s.phase === "ユーザー認証");
      expect(steps.findIndex((s) => s.id === "newkeys-c")).toBeLessThan(
        authStart,
      );
      expect(steps.findIndex((s) => s.id === "newkeys-s")).toBeLessThan(
        authStart,
      );
      expect(
        steps
          .filter((s) => s.phase === "ユーザー認証")
          .every((s) => s.protection === "暗号化・完全性保護あり"),
      ).toBe(true);
      expect(steps.find((s) => s.id === "newkeys-s")?.protection).toBe(
        "暗号化前",
      );
      const host = steps.find((s) => s.id === "host-check")!;
      expect(host.from).toBe(host.to);
    }
  });
  it("公開鍵とパスワードの分岐が混在しない", () => {
    const key = lessons[0].steps("publickey");
    const pw = lessons[0].steps("password");
    expect(key.some((s) => s.id === "key-sign")).toBe(true);
    expect(key.some((s) => s.id === "password")).toBe(false);
    expect(pw.some((s) => s.id === "key-sign")).toBe(false);
    expect(pw.find((s) => s.id === "password")?.protection).toBe(
      "暗号化・完全性保護あり",
    );
  });
  it("TCPの確認応答番号と確立状態を維持", () => {
    const steps = lessons[1].steps("publickey");
    expect(steps.map((s) => s.wire)).toEqual(["SYN", "SYN + ACK", "ACK"]);
    expect(steps[1].fields).toContain("SEQ=5000 / ACK=1001");
    expect(steps[2].fields).toContain("SEQ=1001 / ACK=5001");
    expect(steps[2].states).toEqual(["ESTABLISHED", "ESTABLISHED"]);
  });
});
describe("共有URL", () => {
  it("表示位置・認証方式・詳細表示を復元", () => {
    const v = {
      lesson: "ssh",
      step: 13,
      auth: "password" as const,
      detail: true,
    };
    expect(decodeView(encodeView(v))).toEqual(v);
  });
  it("不正な入力は既定値へ", () => {
    expect(decodeView("#/ssh?step=NaN&auth=bad").step).toBe(0);
    expect(decodeView("#/tcp?step=-4").step).toBe(0);
    expect(decodeView("#/ssh?step=Infinity").step).toBe(0);
  });
});
